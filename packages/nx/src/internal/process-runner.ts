import { spawnSync } from 'node:child_process';

/**
 * Result of a {@link ProcessRunner.run} call, shaped to be returned directly
 * from an Nx executor.
 */
export interface ProcessRunResult {
  success: boolean;
  message?: string;
}

/**
 * Thin wrapper around spawning a CLI process from an executor, sharing
 * consistent working-directory resolution and error surfacing across all of
 * `@cdk-x/nx`'s jsii executors (instead of Nx's raw `nx:run-commands`, which
 * only proxies the underlying shell's exit code).
 */
export class ProcessRunner {
  private constructor() {}

  /**
   * Runs `command` with `args` synchronously in `cwd`, streaming its output
   * to the current process.
   *
   * @param command - the executable to run (resolved via PATH).
   * @param args - arguments to pass to `command`.
   * @param cwd - the working directory to run `command` in.
   * @returns `{ success: true }` on a zero exit code, or `{ success: false,
   * message }` with a clear explanation otherwise - including when `command`
   * itself cannot be found on PATH.
   * @example
   * const result = ProcessRunner.run('jsii-pacmak', ['-t', 'python'], projectRoot);
   */
  public static run(
    command: string,
    args: string[],
    cwd: string,
  ): ProcessRunResult {
    const result = spawnSync(command, args, { cwd, stdio: 'inherit' });

    if (result.error) {
      return {
        success: false,
        message: `Failed to run "${command}": ${result.error.message}. Is it installed and on PATH?`,
      };
    }
    if (result.status !== 0) {
      return {
        success: false,
        message: `"${command} ${args.join(' ')}" exited with code ${result.status}.`,
      };
    }
    return { success: true };
  }
}
