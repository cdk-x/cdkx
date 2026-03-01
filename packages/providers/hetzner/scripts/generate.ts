/**
 * @file scripts/generate.ts
 *
 * Codegen entry point for `@cdk-x/hetzner`.
 *
 * Run via:
 *   yarn nx run @cdk-x/hetzner:codegen
 *
 * What this script does:
 * 1. Downloads (or loads from cache) the Hetzner Cloud OpenAPI spec.
 * 2. Extracts `ResourceSpec[]` for all supported resources.
 * 3. Generates TypeScript L1 files (`NtvHetznerXxx`) and writes them to `src/lib/`.
 * 4. Writes `hetzner-resources.json` to `src/` for the engine.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ResourceCodeGenerator, ResourceSpecWriter } from '@cdk-x/core';
import { HetznerExtractor } from './codegen/hetzner-extractor.js';

// ---------------------------------------------------------------------------
// Paths (all resolved relative to the package root)
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(__dirname, '..');
const SRC_LIB = join(PACKAGE_ROOT, 'src', 'lib');
const ENGINE_JSON_PATH = join(PACKAGE_ROOT, 'src', 'hetzner-resources.json');
const CACHE_DIR = join(__dirname, '.cache');

// ---------------------------------------------------------------------------
// Generator configuration
// ---------------------------------------------------------------------------

const PROVIDER_NAME = 'Hetzner';
const RESOURCE_TYPE_CONST = 'HetznerResourceType';

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('[codegen] Loading Hetzner OpenAPI spec...');
  const extractor = new HetznerExtractor(CACHE_DIR);

  await extractor.loadSpec();
  console.log('[codegen] Spec loaded.');

  const specs = extractor.extractResources();
  console.log(`[codegen] Extracted ${specs.length} resource specs.`);

  const generator = new ResourceCodeGenerator(
    PROVIDER_NAME,
    RESOURCE_TYPE_CONST,
  );
  const writer = new ResourceSpecWriter();

  // Write TypeScript L1 files
  let filesWritten = 0;
  for (const spec of specs) {
    const file = generator.generateFile(spec);
    const outputPath = join(SRC_LIB, file.relativePath);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, file.content, 'utf-8');
    console.log(`[codegen]   wrote ${file.relativePath}`);
    filesWritten++;
  }

  // Write engine JSON
  writer.write(specs, ENGINE_JSON_PATH);
  console.log(`[codegen]   wrote src/hetzner-resources.json`);

  console.log(
    `[codegen] Done — ${filesWritten} L1 files + engine JSON written.`,
  );
}

main().catch((err: unknown) => {
  console.error('[codegen] Fatal error:', err);
  process.exit(1);
});
