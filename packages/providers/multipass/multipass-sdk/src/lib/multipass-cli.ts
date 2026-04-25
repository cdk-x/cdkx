import * as net from 'node:net';
import { spawn as nodeSpawn } from 'child_process';

// ─── Types ────────────────────────────────────────────────────────────────────

/** A network interface to attach at launch time. */
export interface MultipassNetworkOpt {
  readonly name: string;
  readonly mode?: 'auto' | 'manual';
  readonly mac?: string;
}

/** A host-to-guest directory mount to attach at launch time. */
export interface MultipassMountOpt {
  readonly source: string;
  readonly target?: string;
}

/** Options for launching a Multipass VM. 1:1 mapping of MltInstance props. */
export interface MultipassLaunchOpts {
  readonly name: string;
  readonly image?: string;
  readonly cpus?: number;
  readonly memory?: string;
  readonly disk?: string;
  readonly bridged?: boolean;
  readonly timeout?: number;
  readonly cloudInit?: string;
  readonly networks?: MultipassNetworkOpt[];
  readonly mounts?: MultipassMountOpt[];
}

/** VM state returned by `multipass info`. */
export interface MultipassVmInfo {
  readonly name: string;
  readonly ipAddress: string;
  readonly sshUser: string;
  readonly state: string;
}

// ─── Spawn abstraction ───────────────────────────────────────────────────────

interface SpawnResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

type SpawnFn = (cmd: string, args: string[]) => Promise<SpawnResult>;

export interface MultipassCliDeps {
  /** Override process spawning for tests. Default: Node's `child_process.spawn`. */
  spawn?: SpawnFn;
}

// ─── Default spawn ───────────────────────────────────────────────────────────

function defaultSpawn(cmd: string, args: string[]): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const proc = nodeSpawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    proc.on('close', (code) => resolve({ code: code ?? 1, stdout, stderr }));
    proc.on('error', reject);
  });
}

// ─── MultipassCli ─────────────────────────────────────────────────────────────

/**
 * Thin wrapper around the `multipass` CLI binary.
 *
 * All methods call `multipass` as a subprocess. Tests inject a `spawn` stub
 * via `MultipassCliDeps` to avoid touching real VMs.
 */
export class MultipassCli {
  private readonly spawn: SpawnFn;

  constructor(deps: MultipassCliDeps = {}) {
    this.spawn = deps.spawn ?? defaultSpawn;
  }

  /**
   * Verifies that Multipass is installed and accessible on PATH.
   * Throws with a descriptive error if not.
   */
  async assertInstalled(): Promise<void> {
    try {
      await this.spawn('multipass', ['version']);
    } catch {
      throw new Error(
        'Multipass is not installed or not on PATH. ' +
          'Install it from https://multipass.run and try again.',
      );
    }
  }

  /**
   * Launches a new Multipass VM.
   */
  async launch(opts: MultipassLaunchOpts): Promise<void> {
    const args: string[] = ['launch', '--name', opts.name];

    if (opts.image) args.push(opts.image);
    if (opts.cpus !== undefined) args.push('--cpus', String(opts.cpus));
    if (opts.memory) args.push('--memory', opts.memory);
    if (opts.disk) args.push('--disk', opts.disk);
    if (opts.bridged) args.push('--bridged');
    if (opts.timeout !== undefined)
      args.push('--timeout', String(opts.timeout));
    if (opts.cloudInit) args.push('--cloud-init', opts.cloudInit);
    for (const net of opts.networks ?? []) {
      const parts = [`name=${net.name}`];
      if (net.mode) parts.push(`mode=${net.mode}`);
      if (net.mac) parts.push(`mac=${net.mac}`);
      args.push('--network', parts.join(','));
    }
    for (const mount of opts.mounts ?? []) {
      const mountArg = mount.target
        ? `${mount.source}:${mount.target}`
        : mount.source;
      args.push('--mount', mountArg);
    }

    const result = await this.spawn('multipass', args);
    if (result.code !== 0) {
      throw new Error(
        `multipass launch failed (exit ${result.code}): ${result.stderr}`,
      );
    }
  }

  /**
   * Returns info about a running VM.
   */
  async info(name: string): Promise<MultipassVmInfo> {
    const result = await this.spawn('multipass', [
      'info',
      name,
      '--format',
      'json',
    ]);
    if (result.code !== 0) {
      throw new Error(
        `multipass info failed (exit ${result.code}): ${result.stderr}`,
      );
    }

    const parsed = JSON.parse(result.stdout) as {
      info: Record<string, { ipv4?: string[]; state?: string }>;
    };

    const vmData = parsed.info[name];
    if (!vmData) {
      throw new Error(`multipass info: no data for instance '${name}'`);
    }

    return {
      name,
      ipAddress: vmData.ipv4?.[0] ?? '',
      sshUser: 'ubuntu',
      state: vmData.state ?? 'Unknown',
    };
  }

  /**
   * Resolves when TCP port 22 on `host` accepts a connection.
   * Returns immediately on success; rejects only if the socket errors
   * (which the caller should treat as 'pending' and retry).
   */
  waitForSsh(host: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port: 22 });
      socket.once('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  }

  /**
   * Queries the cloud-init status inside a running VM.
   *
   * Runs `multipass exec <name> -- cloud-init status` and parses the output.
   * Returns `'running'` on any exec failure (VM not yet reachable) so callers
   * can treat it as a transient pending state and retry.
   */
  async cloudInitStatus(
    name: string,
  ): Promise<'running' | 'done' | 'error' | 'degraded'> {
    const result = await this.spawn('multipass', [
      'exec',
      name,
      '--',
      'cloud-init',
      'status',
    ]);

    if (result.code !== 0) return 'running';

    const output = result.stdout.toLowerCase();
    if (output.includes('done')) return 'done';
    if (output.includes('error')) return 'error';
    if (output.includes('degraded')) return 'degraded';
    return 'running';
  }

  /**
   * Reads the cloud-init output log from inside a running VM.
   *
   * Returns the full contents of `/var/log/cloud-init-output.log`, or an empty
   * string if the file cannot be read (VM not yet reachable, file missing, etc.).
   */
  async cloudInitLog(name: string): Promise<string> {
    const result = await this.spawn('multipass', [
      'exec',
      name,
      '--',
      'cat',
      '/var/log/cloud-init-output.log',
    ]);
    if (result.code !== 0) return '';
    return result.stdout;
  }

  /**
   * Deletes and purges a VM by name.
   */
  async delete(name: string): Promise<void> {
    const result = await this.spawn('multipass', ['delete', '--purge', name]);
    if (result.code !== 0) {
      throw new Error(
        `multipass delete failed (exit ${result.code}): ${result.stderr}`,
      );
    }
  }
}
