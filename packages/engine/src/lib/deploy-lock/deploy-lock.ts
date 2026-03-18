import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/** Name of the lock file inside `stateDir`. */
const LOCK_FILE_NAME = 'deploy.lock';

/**
 * Data written to and read from the lock file.
 */
export interface LockData {
  /** PID of the process that acquired the lock. */
  pid: number;
  /** ISO timestamp of when the lock was acquired. */
  startedAt: string;
  /** Hostname of the machine that acquired the lock. */
  hostname: string;
}

/**
 * Thrown by `DeployLock.acquire()` when the lock is held by another live
 * process.
 */
export class LockError extends Error {
  constructor(
    public readonly lockPath: string,
    public readonly lockData: LockData,
  ) {
    super(
      `Deploy already in progress (pid ${lockData.pid} on ${lockData.hostname}, started ${lockData.startedAt}).\n` +
        `Lock file: ${lockPath}\n` +
        `If the process is no longer running, delete the lock file manually and retry.`,
    );
    this.name = 'LockError';
  }
}

// ─── Dependency injection ─────────────────────────────────────────────────────

export interface DeployLockDeps {
  mkdirSync?: (p: string, options?: { recursive?: boolean }) => void;
  writeFileSync?: (p: string, data: string, encoding: BufferEncoding) => void;
  readFileSync?: (p: string, encoding: BufferEncoding) => string;
  unlinkSync?: (p: string) => void;
  existsSync?: (p: string) => boolean;
  /** Returns `true` if the process with the given PID is still alive. */
  isProcessAlive?: (pid: number) => boolean;
  /** Returns the current process ID. */
  getPid?: () => number;
  /** Returns the current hostname. */
  getHostname?: () => string;
}

function defaultIsProcessAlive(pid: number): boolean {
  try {
    // Signal 0 checks if the process exists without actually sending a signal.
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// ─── DeployLock ───────────────────────────────────────────────────────────────

/**
 * File-based deploy lock that prevents concurrent deployments.
 *
 * The lock file is written to `<stateDir>/deploy.lock` and contains the PID,
 * start timestamp, and hostname of the process that acquired the lock.
 *
 * When `acquire()` is called and a lock file already exists, the lock holder's
 * PID is checked. If the process is no longer alive (stale lock), the file is
 * removed automatically and the lock is re-acquired. If the process is still
 * alive, a `LockError` is thrown.
 *
 * `release()` deletes the lock file. It is idempotent — calling it when no
 * lock file exists is a no-op.
 */
export class DeployLock {
  private readonly lockPath: string;
  private readonly mkdirSync: (
    p: string,
    options?: { recursive?: boolean },
  ) => void;
  private readonly writeFileSync: (
    p: string,
    data: string,
    encoding: BufferEncoding,
  ) => void;
  private readonly readFileSync: (
    p: string,
    encoding: BufferEncoding,
  ) => string;
  private readonly unlinkSync: (p: string) => void;
  private readonly existsSync: (p: string) => boolean;
  private readonly isProcessAlive: (pid: number) => boolean;
  private readonly getPid: () => number;
  private readonly getHostname: () => string;

  constructor(
    private readonly stateDir: string,
    deps: DeployLockDeps = {},
  ) {
    this.lockPath = path.join(stateDir, LOCK_FILE_NAME);
    this.mkdirSync = deps.mkdirSync ?? ((p, opts) => fs.mkdirSync(p, opts));
    this.writeFileSync =
      deps.writeFileSync ?? ((p, data, enc) => fs.writeFileSync(p, data, enc));
    this.readFileSync =
      deps.readFileSync ?? ((p, enc) => fs.readFileSync(p, enc));
    this.unlinkSync = deps.unlinkSync ?? ((p) => fs.unlinkSync(p));
    this.existsSync = deps.existsSync ?? ((p) => fs.existsSync(p));
    this.isProcessAlive = deps.isProcessAlive ?? defaultIsProcessAlive;
    this.getPid = deps.getPid ?? (() => process.pid);
    this.getHostname = deps.getHostname ?? (() => os.hostname());
  }

  /**
   * Attempts to acquire the deploy lock.
   *
   * - If no lock file exists, writes a new lock file and returns.
   * - If a lock file exists and the holder PID is still alive, throws
   *   `LockError`.
   * - If a lock file exists and the holder PID is no longer alive (stale),
   *   removes the file and writes a new lock.
   */
  public acquire(): void {
    this.mkdirSync(this.stateDir, { recursive: true });

    if (this.existsSync(this.lockPath)) {
      const existing = this.readLockFile();
      if (existing !== null && this.isProcessAlive(existing.pid)) {
        throw new LockError(this.lockPath, existing);
      }
      // Stale lock — remove it.
      this.unlinkSync(this.lockPath);
    }

    const data: LockData = {
      pid: this.getPid(),
      startedAt: new Date().toISOString(),
      hostname: this.getHostname(),
    };
    this.writeFileSync(this.lockPath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * Releases the deploy lock by deleting the lock file.
   * Idempotent — safe to call even if the lock file does not exist.
   */
  public release(): void {
    if (this.existsSync(this.lockPath)) {
      this.unlinkSync(this.lockPath);
    }
  }

  /** The absolute path of the lock file managed by this instance. */
  public get lockFilePath(): string {
    return this.lockPath;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private readLockFile(): LockData | null {
    try {
      const raw = this.readFileSync(this.lockPath, 'utf8');
      return JSON.parse(raw) as LockData;
    } catch {
      return null;
    }
  }
}
