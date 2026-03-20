import * as path from 'node:path';
import { StatePersistence, StatePersistenceDeps } from './state-persistence';
import { EngineState } from './engine-state';
import { StackStatus } from '../states/stack-status';

const STATE_DIR = '/fake/statedir';

function makeState(): EngineState {
  return {
    stacks: {
      MyStack: {
        status: StackStatus.CREATE_COMPLETE,
        resources: {},
      },
    },
  };
}

function makeNullDeps(
  overrides?: Partial<StatePersistenceDeps>,
): StatePersistenceDeps {
  return {
    mkdirSync: () => undefined,
    writeFileSync: () => undefined,
    existsSync: () => false,
    readFileSync: () => '{}',
    unlinkSync: () => undefined,
    ...overrides,
  };
}

describe('StatePersistence', () => {
  describe('stateFilePath', () => {
    it('is <stateDir>/engine-state.json', () => {
      const persistence = new StatePersistence(STATE_DIR);
      expect(persistence.stateFilePath).toBe(
        path.join(STATE_DIR, 'engine-state.json'),
      );
    });
  });

  describe('snapshotFilePath', () => {
    it('is <stateDir>/engine-state.snapshot.json', () => {
      const persistence = new StatePersistence(STATE_DIR);
      expect(persistence.snapshotFilePath).toBe(
        path.join(STATE_DIR, 'engine-state.snapshot.json'),
      );
    });
  });

  describe('save()', () => {
    it('creates the stateDir with recursive: true', () => {
      const mkdirCalls: Array<{
        p: string;
        options?: { recursive?: boolean };
      }> = [];
      const deps = makeNullDeps({
        mkdirSync: (p, options) => mkdirCalls.push({ p, options }),
      });

      const persistence = new StatePersistence(STATE_DIR, deps);
      persistence.save(makeState());

      expect(mkdirCalls).toHaveLength(1);
      expect(mkdirCalls[0].p).toBe(STATE_DIR);
      expect(mkdirCalls[0].options?.recursive).toBe(true);
    });

    it('writes JSON to the correct file path', () => {
      const written: Array<{ p: string; data: string }> = [];
      const deps = makeNullDeps({
        writeFileSync: (p, data) => written.push({ p, data }),
      });

      const persistence = new StatePersistence(STATE_DIR, deps);
      persistence.save(makeState());

      expect(written).toHaveLength(1);
      expect(written[0].p).toBe(path.join(STATE_DIR, 'engine-state.json'));
    });

    it('writes valid JSON that round-trips correctly', () => {
      let writtenData = '';
      const deps = makeNullDeps({
        writeFileSync: (_, data) => {
          writtenData = data;
        },
      });

      const state = makeState();
      const persistence = new StatePersistence(STATE_DIR, deps);
      persistence.save(state);

      const parsed = JSON.parse(writtenData) as EngineState;
      expect(parsed.stacks['MyStack'].status).toBe(StackStatus.CREATE_COMPLETE);
    });

    it('uses utf8 encoding', () => {
      const encodings: string[] = [];
      const deps = makeNullDeps({
        writeFileSync: (_, __, encoding) => encodings.push(encoding),
      });

      new StatePersistence(STATE_DIR, deps).save(makeState());

      expect(encodings[0]).toBe('utf8');
    });

    it('writes pretty-printed JSON (2-space indent)', () => {
      let writtenData = '';
      const deps = makeNullDeps({
        writeFileSync: (_, data) => {
          writtenData = data;
        },
      });

      new StatePersistence(STATE_DIR, deps).save(makeState());

      // Pretty-printed JSON has newlines
      expect(writtenData).toContain('\n');
      // 2-space indent
      expect(writtenData).toContain('  ');
    });
  });

  describe('load()', () => {
    it('returns null when the state file does not exist', () => {
      const deps = makeNullDeps({
        existsSync: () => false,
        readFileSync: () => {
          throw new Error('should not be called');
        },
      });

      const persistence = new StatePersistence(STATE_DIR, deps);
      expect(persistence.load()).toBeNull();
    });

    it('reads and parses the state file when it exists', () => {
      const state = makeState();
      const deps = makeNullDeps({
        existsSync: () => true,
        readFileSync: () => JSON.stringify(state),
      });

      const persistence = new StatePersistence(STATE_DIR, deps);
      const loaded = persistence.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.stacks['MyStack'].status).toBe(
        StackStatus.CREATE_COMPLETE,
      );
    });

    it('reads from the correct file path', () => {
      const readPaths: string[] = [];
      const deps = makeNullDeps({
        existsSync: () => true,
        readFileSync: (p) => {
          readPaths.push(p);
          return JSON.stringify(makeState());
        },
      });

      new StatePersistence(STATE_DIR, deps).load();

      expect(readPaths[0]).toBe(path.join(STATE_DIR, 'engine-state.json'));
    });

    it('checks existence of the correct file path', () => {
      const checkedPaths: string[] = [];
      const deps = makeNullDeps({
        existsSync: (p) => {
          checkedPaths.push(p);
          return false;
        },
      });

      new StatePersistence(STATE_DIR, deps).load();

      expect(checkedPaths[0]).toBe(path.join(STATE_DIR, 'engine-state.json'));
    });
  });

  describe('writeSnapshot()', () => {
    it('writes to engine-state.snapshot.json', () => {
      const written: Array<{ p: string; data: string }> = [];
      const deps = makeNullDeps({
        writeFileSync: (p, data) => written.push({ p, data }),
      });

      new StatePersistence(STATE_DIR, deps).writeSnapshot(makeState());

      expect(written).toHaveLength(1);
      expect(written[0].p).toBe(
        path.join(STATE_DIR, 'engine-state.snapshot.json'),
      );
    });

    it('creates the stateDir with recursive: true', () => {
      const mkdirCalls: Array<{
        p: string;
        options?: { recursive?: boolean };
      }> = [];
      const deps = makeNullDeps({
        mkdirSync: (p, options) => mkdirCalls.push({ p, options }),
      });

      new StatePersistence(STATE_DIR, deps).writeSnapshot(makeState());

      expect(mkdirCalls).toHaveLength(1);
      expect(mkdirCalls[0].p).toBe(STATE_DIR);
      expect(mkdirCalls[0].options?.recursive).toBe(true);
    });

    it('serialises state as pretty-printed JSON', () => {
      let writtenData = '';
      const deps = makeNullDeps({
        writeFileSync: (_, data) => {
          writtenData = data;
        },
      });

      new StatePersistence(STATE_DIR, deps).writeSnapshot(makeState());

      const parsed = JSON.parse(writtenData) as EngineState;
      expect(parsed.stacks['MyStack'].status).toBe(StackStatus.CREATE_COMPLETE);
      expect(writtenData).toContain('\n');
    });

    it('writes empty state without error (first deployment)', () => {
      const written: string[] = [];
      const deps = makeNullDeps({
        writeFileSync: (_, data) => written.push(data),
      });

      const emptyState: EngineState = { stacks: {} };
      expect(() =>
        new StatePersistence(STATE_DIR, deps).writeSnapshot(emptyState),
      ).not.toThrow();
      expect(JSON.parse(written[0])).toEqual({ stacks: {} });
    });
  });

  describe('readSnapshot()', () => {
    it('returns null when the snapshot file does not exist', () => {
      const deps = makeNullDeps({ existsSync: () => false });

      const result = new StatePersistence(STATE_DIR, deps).readSnapshot();

      expect(result).toBeNull();
    });

    it('reads and parses the snapshot when it exists', () => {
      const state = makeState();
      const deps = makeNullDeps({
        existsSync: () => true,
        readFileSync: () => JSON.stringify(state),
      });

      const result = new StatePersistence(STATE_DIR, deps).readSnapshot();

      expect(result).not.toBeNull();
      expect(result?.stacks['MyStack'].status).toBe(
        StackStatus.CREATE_COMPLETE,
      );
    });

    it('reads from engine-state.snapshot.json', () => {
      const readPaths: string[] = [];
      const deps = makeNullDeps({
        existsSync: () => true,
        readFileSync: (p) => {
          readPaths.push(p);
          return JSON.stringify(makeState());
        },
      });

      new StatePersistence(STATE_DIR, deps).readSnapshot();

      expect(readPaths[0]).toBe(
        path.join(STATE_DIR, 'engine-state.snapshot.json'),
      );
    });
  });

  describe('deleteSnapshot()', () => {
    it('calls unlinkSync on the snapshot path when it exists', () => {
      const unlinked: string[] = [];
      const deps = makeNullDeps({
        existsSync: () => true,
        unlinkSync: (p) => unlinked.push(p),
      });

      new StatePersistence(STATE_DIR, deps).deleteSnapshot();

      expect(unlinked).toHaveLength(1);
      expect(unlinked[0]).toBe(
        path.join(STATE_DIR, 'engine-state.snapshot.json'),
      );
    });

    it('does not call unlinkSync when the snapshot does not exist', () => {
      const unlinked: string[] = [];
      const deps = makeNullDeps({
        existsSync: () => false,
        unlinkSync: (p) => unlinked.push(p),
      });

      new StatePersistence(STATE_DIR, deps).deleteSnapshot();

      expect(unlinked).toHaveLength(0);
    });
  });

  describe('snapshotExists()', () => {
    it('returns true when the snapshot file exists', () => {
      const deps = makeNullDeps({ existsSync: () => true });

      expect(new StatePersistence(STATE_DIR, deps).snapshotExists()).toBe(true);
    });

    it('returns false when the snapshot file does not exist', () => {
      const deps = makeNullDeps({ existsSync: () => false });

      expect(new StatePersistence(STATE_DIR, deps).snapshotExists()).toBe(
        false,
      );
    });

    it('checks existence of engine-state.snapshot.json', () => {
      const checkedPaths: string[] = [];
      const deps = makeNullDeps({
        existsSync: (p) => {
          checkedPaths.push(p);
          return false;
        },
      });

      new StatePersistence(STATE_DIR, deps).snapshotExists();

      expect(checkedPaths[0]).toBe(
        path.join(STATE_DIR, 'engine-state.snapshot.json'),
      );
    });
  });
});
