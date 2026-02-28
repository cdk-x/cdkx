import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { App } from '@cdk-x/core';

/**
 * Common utilities for synthesis tests.
 * Static methods reusable across any test suite in the monorepo or in external provider packages.
 */
export class SynthHelpers {
  /**
   * Creates a unique temporary directory under the OS temp folder.
   * Each call returns a fresh directory so parallel tests don't collide.
   */
  static tmpDir(): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-integration-'));
  }

  /**
   * Reads and parses a JSON file from disk.
   */
  static readJson(filePath: string): unknown {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  /**
   * Extracts all resource entries from a keyed stack JSON object.
   * Stack JSON is a `{ [logicalId]: { type, properties, metadata } }` object.
   */
  static resourceValues(
    json: unknown,
  ): Array<{ type: string; properties: Record<string, unknown> }> {
    return Object.values(json as Record<string, unknown>) as Array<{
      type: string;
      properties: Record<string, unknown>;
    }>;
  }

  /**
   * Synthesizes the app, reads the JSON output for the given stack id,
   * and returns it ready for `expect(...).toMatchSnapshot()`.
   *
   * The outdir is cleaned up after reading if `cleanup` is true (default).
   *
   * @param app     - The App to synthesize.
   * @param stackId - The artifactId of the stack (construct id, e.g. 'MyStack').
   * @param cleanup - Whether to remove the outdir after reading (default: true).
   */
  static synthSnapshot(
    app: App,
    stackId: string,
    cleanup = true,
  ): Record<string, unknown> {
    const { outdir } = app;
    app.synth();
    const stackFile = path.join(outdir, `${stackId}.json`);
    const result = SynthHelpers.readJson(stackFile) as Record<string, unknown>;
    if (cleanup) {
      fs.rmSync(outdir, { recursive: true, force: true });
    }
    return result;
  }
}
