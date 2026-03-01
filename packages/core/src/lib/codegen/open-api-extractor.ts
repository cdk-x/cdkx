import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import type { OpenAPISchema, OpenAPISpec, ResourceSpec } from './types.js';
import { TypeMapper } from './type-mapper.js';

/**
 * Abstract base class for provider-specific OpenAPI extractors.
 *
 * Handles the common concerns of downloading, caching, and change-detection
 * for an OpenAPI specification. Concrete subclasses implement
 * `extractResources()` to parse the provider-specific structure and produce
 * `ResourceSpec[]`.
 *
 * ## Usage in a provider script
 *
 * ```ts
 * class HetznerExtractor extends OpenAPIExtractor {
 *   constructor() {
 *     super('https://docs.hetzner.cloud/cloud.spec.json', 'scripts/.cache', 'hetzner');
 *   }
 *
 *   extractResources(): ResourceSpec[] {
 *     // walk this.spec.paths and build ResourceSpec[]
 *   }
 * }
 *
 * const extractor = new HetznerExtractor();
 * const { hasChanged } = await extractor.checkForUpdates();
 * await extractor.loadSpec();
 * const resources = extractor.extractResources();
 * ```
 */
export abstract class OpenAPIExtractor {
  /**
   * The parsed OpenAPI specification.
   * Available after `loadSpec()` resolves successfully.
   */
  protected spec: OpenAPISpec | null = null;

  /**
   * @param specUrl   - URL of the OpenAPI JSON/YAML specification.
   * @param cacheDir  - Directory where the spec and hash are cached.
   *                    Relative paths are resolved from `process.cwd()`.
   * @param cachePrefix - Short identifier used as the cache file prefix.
   *                      e.g. "hetzner" → hetzner-openapi.json / hetzner-openapi.hash
   */
  constructor(
    protected readonly specUrl: string,
    protected readonly cacheDir: string,
    protected readonly cachePrefix: string,
  ) {}

  // ---------------------------------------------------------------------------
  // Abstract — provider implementations
  // ---------------------------------------------------------------------------

  /**
   * Extract all creatable resources from the loaded spec.
   *
   * Must be called after `loadSpec()` resolves.
   * Implementations should iterate over `this.spec.paths`, identify resource
   * creation endpoints (POST), and build one `ResourceSpec` per resource.
   */
  abstract extractResources(): ResourceSpec[];

  // ---------------------------------------------------------------------------
  // Concrete — spec loading with cache
  // ---------------------------------------------------------------------------

  /**
   * Loads the OpenAPI specification.
   *
   * Behaviour:
   * - If a cached copy exists in `cacheDir`, it is used without network access.
   * - If no cache exists, the spec is downloaded from `specUrl`, parsed, and
   *   written to the cache.
   *
   * After this method resolves, `this.spec` is populated and
   * `extractResources()` can be called.
   *
   * @throws If the download fails or the response is not valid JSON.
   */
  async loadSpec(): Promise<void> {
    const specPath = this.specCachePath();

    if (existsSync(specPath)) {
      const raw = readFileSync(specPath, 'utf-8');
      this.spec = JSON.parse(raw) as OpenAPISpec;
      return;
    }

    await this.downloadAndCache();
  }

  /**
   * Checks whether the remote spec has changed since the last download.
   *
   * Downloads the latest spec, computes its SHA-256 hash, and compares it
   * against the stored hash.  The cached spec is updated if the content has
   * changed.
   *
   * @returns `{ hasChanged, hash }` — whether the remote spec differs from the
   *          cached copy and the new hash.
   */
  async checkForUpdates(): Promise<{ hasChanged: boolean; hash: string }> {
    const raw = await this.fetchRaw();
    const hash = this.sha256(raw);
    const hashPath = this.hashCachePath();

    let hasChanged = true;
    if (existsSync(hashPath)) {
      const stored = readFileSync(hashPath, 'utf-8').trim();
      hasChanged = stored !== hash;
    }

    if (hasChanged) {
      this.ensureCacheDir();
      writeFileSync(this.specCachePath(), raw, 'utf-8');
      writeFileSync(hashPath, hash, 'utf-8');
      this.spec = JSON.parse(raw) as OpenAPISpec;
    }

    return { hasChanged, hash };
  }

  // ---------------------------------------------------------------------------
  // Protected helpers — available to subclasses
  // ---------------------------------------------------------------------------

  /**
   * Delegates to `TypeMapper.map()`.
   * Convenience so subclasses can call `this.mapType(schema, ctx)` without
   * importing `TypeMapper` directly.
   */
  protected mapType(
    schema: OpenAPISchema,
    context: { propName: string; resourceName: string },
  ): string {
    return TypeMapper.map(schema, context);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async downloadAndCache(): Promise<void> {
    const raw = await this.fetchRaw();
    const hash = this.sha256(raw);

    this.ensureCacheDir();
    writeFileSync(this.specCachePath(), raw, 'utf-8');
    writeFileSync(this.hashCachePath(), hash, 'utf-8');

    this.spec = JSON.parse(raw) as OpenAPISpec;
  }

  private async fetchRaw(): Promise<string> {
    const response = await fetch(this.specUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to download OpenAPI spec from ${this.specUrl}: ${response.status} ${response.statusText}`,
      );
    }
    return response.text();
  }

  private sha256(content: string): string {
    return createHash('sha256').update(content, 'utf-8').digest('hex');
  }

  private ensureCacheDir(): void {
    const abs = this.resolvedCacheDir();
    if (!existsSync(abs)) {
      mkdirSync(abs, { recursive: true });
    }
  }

  private specCachePath(): string {
    return join(this.resolvedCacheDir(), `${this.cachePrefix}-openapi.json`);
  }

  private hashCachePath(): string {
    return join(this.resolvedCacheDir(), `${this.cachePrefix}-openapi.hash`);
  }

  /**
   * Resolves `cacheDir` to an absolute path.
   * If `cacheDir` is already absolute it is returned as-is;
   * otherwise it is resolved relative to `process.cwd()`.
   */
  private resolvedCacheDir(): string {
    return isAbsolute(this.cacheDir)
      ? this.cacheDir
      : resolve(process.cwd(), this.cacheDir);
  }
}
