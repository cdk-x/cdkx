import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ResourceSpec } from './types.js';

/**
 * Serialises an array of `ResourceSpec` objects to a single JSON file.
 *
 * The output is consumed by the cdkx runtime engine, which reads the file at
 * deploy time to resolve CRUD endpoints, response shapes, and async polling
 * for each resource — without any provider-specific hard-coding in the engine.
 *
 * ## Output format
 *
 * The JSON file is a single object keyed by `ResourceSpec.providerType`:
 *
 * ```json
 * {
 *   "Hetzner::Networking::Network": {
 *     "resourceName": "Network",
 *     "domain": "Networking",
 *     "providerType": "Hetzner::Networking::Network",
 *     "api": { ... }
 *   },
 *   ...
 * }
 * ```
 *
 * Only the fields required by the engine are included (the TypeScript-specific
 * fields such as `createProps`, `enums`, and `nestedInterfaces` are omitted
 * from the engine output to keep it compact).
 *
 * @example
 * const writer = new ResourceSpecWriter();
 * writer.write(specs, '/path/to/provider/hetzner-resources.json');
 */
export class ResourceSpecWriter {
  /**
   * Writes the engine-facing JSON file to `outputPath`.
   *
   * Creates parent directories if they do not exist.
   *
   * @param specs      - The resource specifications to serialise.
   * @param outputPath - Absolute path of the output JSON file.
   */
  write(specs: ResourceSpec[], outputPath: string): void {
    const payload = this.toEnginePayload(specs);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf-8');
  }

  /**
   * Converts `ResourceSpec[]` to the engine payload object.
   *
   * Exported as a separate method so callers (and tests) can inspect the
   * data without writing to disk.
   */
  toEnginePayload(specs: ResourceSpec[]): Record<string, EngineResourceEntry> {
    const result: Record<string, EngineResourceEntry> = {};
    for (const spec of specs) {
      result[spec.providerType] = {
        resourceName: spec.resourceName,
        domain: spec.domain,
        providerType: spec.providerType,
        api: spec.api,
      };
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// EngineResourceEntry — the subset of ResourceSpec written to the JSON file
// ---------------------------------------------------------------------------

/**
 * The per-resource object that appears in the engine JSON file.
 *
 * A strict subset of `ResourceSpec` — contains only what the runtime engine
 * needs.  TypeScript-specific fields (`createProps`, `enums`,
 * `nestedInterfaces`) are intentionally excluded.
 */
export interface EngineResourceEntry {
  resourceName: string;
  domain: string;
  providerType: string;
  api: ResourceSpec['api'];
}
