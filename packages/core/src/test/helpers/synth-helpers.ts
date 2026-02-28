import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Common utilities for integration tests that exercise the synthesis pipeline.
 * Static methods so they can be reused across any integration test suite.
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
}
