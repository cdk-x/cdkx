import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawnSync } from 'node:child_process';
import esbuild from 'esbuild';

/** Absolute path to the compiled CLI bundle (dist/main.js). */
const CLI_BUNDLE = path.resolve(__dirname, '../../../dist/main.js');

/** Absolute path to the simple-app fixture source. */
const SIMPLE_APP_FIXTURE = path.resolve(
  __dirname,
  '../fixtures/simple-app/src/main.ts',
);

export interface RunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Utilities for CLI integration tests.
 *
 * Pattern mirrors @cdk-x/core's SynthHelpers — static methods only,
 * not exported from src/index.ts (test-only).
 */
export class CliHelpers {
  /**
   * Creates a unique temporary directory under the OS temp folder.
   * Each call returns a fresh directory so parallel tests don't collide.
   */
  static tmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-cli-integration-'));
  }

  /**
   * Reads and parses a JSON file from disk.
   */
  static readJson(filePath: string): unknown {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  /**
   * Compiles the simple-app fixture TypeScript file to a temporary .js
   * using esbuild (bundle: true, format: cjs). Returns the path to the
   * compiled output file inside the provided outDir.
   */
  static buildFixture(outDir: string): string {
    const outfile = path.join(outDir, 'app.js');
    esbuild.buildSync({
      entryPoints: [SIMPLE_APP_FIXTURE],
      outfile,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      logLevel: 'silent',
    });
    return outfile;
  }

  /**
   * Writes a cdkx.json config file into the given directory.
   */
  static writeConfig(
    dir: string,
    config: { app: string; output?: string },
  ): void {
    fs.writeFileSync(
      path.join(dir, 'cdkx.json'),
      JSON.stringify(config, null, 2),
    );
  }

  /**
   * Runs the CLI (node dist/main.js) with the given arguments from the
   * specified working directory.
   */
  static runCli(args: string[], cwd: string): RunResult {
    const result = spawnSync('node', [CLI_BUNDLE, ...args], {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return {
      exitCode: result.status,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    };
  }
}
