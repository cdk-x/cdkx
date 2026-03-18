import * as path from 'node:path';
import { DeployLock, DeployLockDeps, LockData, LockError } from './deploy-lock';

const STATE_DIR = '/fake/statedir';

function makeDeps(overrides: Partial<DeployLockDeps> = {}): DeployLockDeps {
  return {
    mkdirSync: () => undefined,
    writeFileSync: () => undefined,
    readFileSync: () => {
      throw new Error('not found');
    },
    unlinkSync: () => undefined,
    existsSync: () => false,
    isProcessAlive: () => false,
    getPid: () => 1234,
    getHostname: () => 'test-host',
    ...overrides,
  };
}

function makeLockData(overrides: Partial<LockData> = {}): LockData {
  return {
    pid: 9999,
    startedAt: '2026-01-01T00:00:00.000Z',
    hostname: 'other-host',
    ...overrides,
  };
}

describe('DeployLock', () => {
  describe('lockFilePath', () => {
    it('is <stateDir>/deploy.lock', () => {
      const lock = new DeployLock(STATE_DIR, makeDeps());
      expect(lock.lockFilePath).toBe(path.join(STATE_DIR, 'deploy.lock'));
    });
  });

  describe('acquire()', () => {
    it('creates the stateDir with recursive: true', () => {
      const mkdirCalls: Array<{
        p: string;
        options?: { recursive?: boolean };
      }> = [];
      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          mkdirSync: (p, options) => mkdirCalls.push({ p, options }),
        }),
      );

      lock.acquire();

      expect(mkdirCalls).toHaveLength(1);
      expect(mkdirCalls[0].p).toBe(STATE_DIR);
      expect(mkdirCalls[0].options?.recursive).toBe(true);
    });

    it('writes the lock file when no lock exists', () => {
      const written: Array<{ p: string; data: string }> = [];
      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => false,
          writeFileSync: (p, data) => written.push({ p, data }),
        }),
      );

      lock.acquire();

      expect(written).toHaveLength(1);
      expect(written[0].p).toBe(path.join(STATE_DIR, 'deploy.lock'));
    });

    it('writes lock file containing pid, startedAt, hostname', () => {
      let writtenData = '';
      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => false,
          writeFileSync: (_, data) => {
            writtenData = data;
          },
          getPid: () => 5678,
          getHostname: () => 'my-machine',
        }),
      );

      lock.acquire();

      const parsed = JSON.parse(writtenData) as LockData;
      expect(parsed.pid).toBe(5678);
      expect(parsed.hostname).toBe('my-machine');
      expect(typeof parsed.startedAt).toBe('string');
      expect(() => new Date(parsed.startedAt)).not.toThrow();
    });

    it('removes stale lock and writes new lock when holder PID is dead', () => {
      const unlinkCalls: string[] = [];
      const writeCalls: string[] = [];
      const existingLock = makeLockData({ pid: 9999 });

      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => true,
          readFileSync: () => JSON.stringify(existingLock),
          isProcessAlive: () => false, // PID is dead
          unlinkSync: (p) => unlinkCalls.push(p),
          writeFileSync: (p) => writeCalls.push(p),
        }),
      );

      lock.acquire();

      expect(unlinkCalls).toHaveLength(1);
      expect(unlinkCalls[0]).toBe(path.join(STATE_DIR, 'deploy.lock'));
      expect(writeCalls).toHaveLength(1);
    });

    it('throws LockError when lock is held by a live process', () => {
      const existingLock = makeLockData({ pid: 9999, hostname: 'other-host' });

      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => true,
          readFileSync: () => JSON.stringify(existingLock),
          isProcessAlive: () => true, // PID is alive
        }),
      );

      expect(() => lock.acquire()).toThrow(LockError);
    });

    it('LockError contains the lock path and lock data', () => {
      const existingLock = makeLockData({ pid: 9999 });

      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => true,
          readFileSync: () => JSON.stringify(existingLock),
          isProcessAlive: () => true,
        }),
      );

      let thrown: LockError | undefined;
      try {
        lock.acquire();
      } catch (err) {
        thrown = err as LockError;
      }

      expect(thrown).toBeInstanceOf(LockError);
      expect(thrown?.lockPath).toBe(path.join(STATE_DIR, 'deploy.lock'));
      expect(thrown?.lockData.pid).toBe(9999);
    });

    it('LockError message mentions the PID and hostname', () => {
      const existingLock = makeLockData({ pid: 9999, hostname: 'prod-box' });

      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => true,
          readFileSync: () => JSON.stringify(existingLock),
          isProcessAlive: () => true,
        }),
      );

      expect(() => lock.acquire()).toThrow(/9999/);
      expect(() => lock.acquire()).toThrow(/prod-box/);
    });

    it('treats corrupt lock file (unparseable JSON) as stale and acquires', () => {
      const unlinkCalls: string[] = [];
      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => true,
          readFileSync: () => 'not-valid-json',
          isProcessAlive: () => false,
          unlinkSync: (p) => unlinkCalls.push(p),
          writeFileSync: () => undefined,
        }),
      );

      // Should not throw — corrupt file is treated as stale (null PID check)
      expect(() => lock.acquire()).not.toThrow();
    });
  });

  describe('release()', () => {
    it('deletes the lock file when it exists', () => {
      const unlinkCalls: string[] = [];
      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => true,
          unlinkSync: (p) => unlinkCalls.push(p),
        }),
      );

      lock.release();

      expect(unlinkCalls).toHaveLength(1);
      expect(unlinkCalls[0]).toBe(path.join(STATE_DIR, 'deploy.lock'));
    });

    it('is a no-op when no lock file exists', () => {
      const unlinkCalls: string[] = [];
      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => false,
          unlinkSync: (p) => unlinkCalls.push(p),
        }),
      );

      lock.release();

      expect(unlinkCalls).toHaveLength(0);
    });

    it('can be called multiple times safely', () => {
      let fileExists = true;
      const lock = new DeployLock(
        STATE_DIR,
        makeDeps({
          existsSync: () => fileExists,
          unlinkSync: () => {
            fileExists = false;
          },
        }),
      );

      lock.release();
      lock.release(); // second call — file no longer exists, should be safe
    });
  });
});
