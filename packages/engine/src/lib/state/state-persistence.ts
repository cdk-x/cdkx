import * as fs from 'node:fs';
import * as path from 'node:path';
import { EngineState } from './engine-state';

/** File name written inside `outdir`. */
const STATE_FILE_NAME = 'engine-state.json';

/**
 * Persists and loads `EngineState` as a JSON file on disk.
 *
 * Written to `<stateDir>/engine-state.json` after every state transition so
 * that interrupted deployments can be resumed.
 *
 * All I/O is synchronous to keep the state machine simple — the engine already
 * controls the async deployment loop; there is no benefit in making the tiny
 * state file write async.
 */
export class StatePersistence {
  private readonly filePath: string;

  /**
   * @param stateDir — Absolute path to the directory where the engine state
   *   file is written (e.g. `<projectRoot>/.cdkx/`). This is separate from
   *   the cloud assembly output directory that contains `manifest.json`.
   * @param deps — Injectable I/O functions (for testing without hitting disk).
   */
  public constructor(
    private readonly stateDir: string,
    private readonly deps: StatePersistenceDeps = defaultDeps,
  ) {
    this.filePath = path.join(stateDir, STATE_FILE_NAME);
  }

  /**
   * Serialises `state` to `<stateDir>/engine-state.json`, creating the
   * directory if it does not already exist.
   */
  public save(state: EngineState): void {
    this.deps.mkdirSync(this.stateDir, { recursive: true });
    this.deps.writeFileSync(
      this.filePath,
      JSON.stringify(state, null, 2),
      'utf8',
    );
  }

  /**
   * Reads and deserialises `engine-state.json` from `outdir`.
   *
   * @returns The persisted `EngineState`, or `null` if the file does not exist.
   */
  public load(): EngineState | null {
    if (!this.deps.existsSync(this.filePath)) {
      return null;
    }
    const raw = this.deps.readFileSync(this.filePath, 'utf8');
    return JSON.parse(raw) as EngineState;
  }

  /** The absolute path of the state file managed by this instance. */
  public get stateFilePath(): string {
    return this.filePath;
  }
}

// ─── Dependency injection types ──────────────────────────────────────────────

export interface StatePersistenceDeps {
  mkdirSync: (p: string, options?: { recursive?: boolean }) => void;
  writeFileSync: (p: string, data: string, encoding: BufferEncoding) => void;
  existsSync: (p: string) => boolean;
  readFileSync: (p: string, encoding: BufferEncoding) => string;
}

const defaultDeps: StatePersistenceDeps = {
  mkdirSync: (p, options) => fs.mkdirSync(p, options),
  writeFileSync: (p, data, encoding) => fs.writeFileSync(p, data, encoding),
  existsSync: (p) => fs.existsSync(p),
  readFileSync: (p, encoding) => fs.readFileSync(p, encoding),
};
