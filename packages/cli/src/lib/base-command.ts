import { Command } from 'commander';
import chalk from 'chalk';

/**
 * Abstract base class for all cdkx CLI commands.
 *
 * Subclasses implement {@link build} to configure and return a Commander
 * `Command` instance, and use the protected helpers {@link run} and
 * {@link fail} for standardised error handling.
 *
 * Convention:
 *   - Subclasses expose a `static create(deps?)` factory that instantiates the
 *     class with optional injectable dependencies and calls `.build()`.
 *   - A module-level `export const xyzCommand = XyzCommand.create()` provides
 *     the singleton used by `main.ts`.
 */
export abstract class BaseCommand {
  /** Builds and returns the configured Commander `Command` instance. */
  abstract build(): Command;

  /**
   * Executes an async action with standardised error handling.
   * Any error thrown inside `fn` is caught, printed in red, and causes
   * `process.exit(1)`.
   */
  protected async run(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`Error: ${message}`));
      process.exit(1);
    }
  }

  /**
   * Throws an `Error` with the given message.
   * Intended to be called inside a `run()` callback so the error is caught
   * and handled uniformly (red output + exit 1).
   */
  protected fail(message: string): never {
    throw new Error(message);
  }
}
