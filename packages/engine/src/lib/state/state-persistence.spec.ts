import * as path from 'node:path';
import { StatePersistence, StatePersistenceDeps } from './state-persistence';
import { EngineState } from './engine-state';
import { StackStatus } from '../states/stack-status';

const OUTDIR = '/fake/outdir';

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

describe('StatePersistence', () => {
  describe('stateFilePath', () => {
    it('is <outdir>/engine-state.json', () => {
      const persistence = new StatePersistence(OUTDIR);
      expect(persistence.stateFilePath).toBe(
        path.join(OUTDIR, 'engine-state.json'),
      );
    });
  });

  describe('save()', () => {
    it('creates the outdir with recursive: true', () => {
      const mkdirCalls: Array<{
        p: string;
        options?: { recursive?: boolean };
      }> = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: (p, options) => mkdirCalls.push({ p, options }),
        writeFileSync: () => undefined,
        existsSync: () => false,
        readFileSync: () => '{}',
      };

      const persistence = new StatePersistence(OUTDIR, deps);
      persistence.save(makeState());

      expect(mkdirCalls).toHaveLength(1);
      expect(mkdirCalls[0].p).toBe(OUTDIR);
      expect(mkdirCalls[0].options?.recursive).toBe(true);
    });

    it('writes JSON to the correct file path', () => {
      const written: Array<{ p: string; data: string }> = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (p, data) => written.push({ p, data }),
        existsSync: () => false,
        readFileSync: () => '{}',
      };

      const persistence = new StatePersistence(OUTDIR, deps);
      persistence.save(makeState());

      expect(written).toHaveLength(1);
      expect(written[0].p).toBe(path.join(OUTDIR, 'engine-state.json'));
    });

    it('writes valid JSON that round-trips correctly', () => {
      let writtenData = '';
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_, data) => {
          writtenData = data;
        },
        existsSync: () => false,
        readFileSync: () => '{}',
      };

      const state = makeState();
      const persistence = new StatePersistence(OUTDIR, deps);
      persistence.save(state);

      const parsed = JSON.parse(writtenData) as EngineState;
      expect(parsed.stacks['MyStack'].status).toBe(StackStatus.CREATE_COMPLETE);
    });

    it('uses utf8 encoding', () => {
      const encodings: string[] = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_, __, encoding) => encodings.push(encoding),
        existsSync: () => false,
        readFileSync: () => '{}',
      };

      new StatePersistence(OUTDIR, deps).save(makeState());

      expect(encodings[0]).toBe('utf8');
    });

    it('writes pretty-printed JSON (2-space indent)', () => {
      let writtenData = '';
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_, data) => {
          writtenData = data;
        },
        existsSync: () => false,
        readFileSync: () => '{}',
      };

      new StatePersistence(OUTDIR, deps).save(makeState());

      // Pretty-printed JSON has newlines
      expect(writtenData).toContain('\n');
      // 2-space indent
      expect(writtenData).toContain('  ');
    });
  });

  describe('load()', () => {
    it('returns null when the state file does not exist', () => {
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: () => undefined,
        existsSync: () => false,
        readFileSync: () => {
          throw new Error('should not be called');
        },
      };

      const persistence = new StatePersistence(OUTDIR, deps);
      expect(persistence.load()).toBeNull();
    });

    it('reads and parses the state file when it exists', () => {
      const state = makeState();
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: () => undefined,
        existsSync: () => true,
        readFileSync: () => JSON.stringify(state),
      };

      const persistence = new StatePersistence(OUTDIR, deps);
      const loaded = persistence.load();

      expect(loaded).not.toBeNull();
      expect(loaded?.stacks['MyStack'].status).toBe(
        StackStatus.CREATE_COMPLETE,
      );
    });

    it('reads from the correct file path', () => {
      const readPaths: string[] = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: () => undefined,
        existsSync: () => true,
        readFileSync: (p) => {
          readPaths.push(p);
          return JSON.stringify(makeState());
        },
      };

      new StatePersistence(OUTDIR, deps).load();

      expect(readPaths[0]).toBe(path.join(OUTDIR, 'engine-state.json'));
    });

    it('checks existence of the correct file path', () => {
      const checkedPaths: string[] = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: () => undefined,
        existsSync: (p) => {
          checkedPaths.push(p);
          return false;
        },
        readFileSync: () => '{}',
      };

      new StatePersistence(OUTDIR, deps).load();

      expect(checkedPaths[0]).toBe(path.join(OUTDIR, 'engine-state.json'));
    });
  });
});
