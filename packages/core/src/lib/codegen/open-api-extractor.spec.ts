import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { OpenAPIExtractor } from './open-api-extractor.js';
import type { OpenAPISpec, ResourceSpec } from './types.js';

// ---------------------------------------------------------------------------
// Concrete test extractor
// ---------------------------------------------------------------------------

/**
 * Minimal concrete implementation used only in tests.
 * `extractResources()` returns whatever is passed to the constructor.
 */
class TestExtractor extends OpenAPIExtractor {
  constructor(
    cacheDir: string,
    private readonly resources: ResourceSpec[] = [],
  ) {
    super('https://example.com/spec.json', cacheDir, 'test');
  }

  extractResources(): ResourceSpec[] {
    return this.resources;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = join(tmpdir(), `cdkx-extractor-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeMinimalSpec(): OpenAPISpec {
  return {
    openapi: '3.0.0',
    info: { title: 'Test', version: '1.0.0' },
    paths: {},
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OpenAPIExtractor', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // loadSpec — from cache
  // -------------------------------------------------------------------------
  describe('loadSpec()', () => {
    it('loads spec from cache when cache file exists', async () => {
      const spec = makeMinimalSpec();
      const specPath = join(tmpDir, 'test-openapi.json');
      writeFileSync(specPath, JSON.stringify(spec), 'utf-8');

      // Point cacheDir to tmpDir — cwd relative path trick:
      // We use an absolute path directly by overriding cacheDir to tmpDir
      // and cachePrefix to 'test'
      const extractor = new TestExtractor(tmpDir);

      // Replace cwd-relative resolution by using absolute tmpDir
      // We need to load spec manually since loadSpec uses process.cwd()
      // Instead, write the file to the exact expected location:
      // cacheDir = tmpDir (absolute), spec file = tmpDir/test-openapi.json ✓

      await extractor.loadSpec();

      expect(extractor.extractResources()).toEqual([]);
    });

    it('throws when download fails and no cache exists', async () => {
      // Use a cacheDir with no pre-existing file so it tries to fetch
      const emptyDir = join(tmpDir, 'empty');
      mkdirSync(emptyDir);

      const extractor = new (class extends OpenAPIExtractor {
        constructor() {
          // unreachable URL
          super('http://localhost:0/nonexistent.json', emptyDir, 'test');
        }
        extractResources(): ResourceSpec[] {
          return [];
        }
      })();

      await expect(extractor.loadSpec()).rejects.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // checkForUpdates
  // -------------------------------------------------------------------------
  describe('checkForUpdates()', () => {
    it('reports hasChanged=true when no hash file exists', async () => {
      const spec = makeMinimalSpec();
      const specJson = JSON.stringify(spec);

      // Mock fetch inside the extractor
      const extractor = new (class extends OpenAPIExtractor {
        constructor() {
          super('https://example.com/spec.json', tmpDir, 'test');
        }
        extractResources(): ResourceSpec[] {
          return [];
        }
        // Expose internal fetchRaw for testing via monkey-patch
      })();

      // Patch global fetch for this test
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(specJson),
      } as unknown as Response);

      const result = await extractor.checkForUpdates();

      expect(result.hasChanged).toBe(true);
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex

      global.fetch = originalFetch;
    });

    it('reports hasChanged=false when spec content is unchanged', async () => {
      const spec = makeMinimalSpec();
      const specJson = JSON.stringify(spec);

      // Pre-write the spec and hash
      const specPath = join(tmpDir, 'test-openapi.json');
      const hashPath = join(tmpDir, 'test-openapi.hash');
      const { createHash } = await import('node:crypto');
      const hash = createHash('sha256').update(specJson, 'utf-8').digest('hex');
      writeFileSync(specPath, specJson, 'utf-8');
      writeFileSync(hashPath, hash, 'utf-8');

      const extractor = new (class extends OpenAPIExtractor {
        constructor() {
          super('https://example.com/spec.json', tmpDir, 'test');
        }
        extractResources(): ResourceSpec[] {
          return [];
        }
      })();

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(specJson),
      } as unknown as Response);

      const result = await extractor.checkForUpdates();

      expect(result.hasChanged).toBe(false);
      expect(result.hash).toBe(hash);

      global.fetch = originalFetch;
    });

    it('reports hasChanged=true and updates cache when spec changed', async () => {
      const oldSpec = makeMinimalSpec();
      const newSpec = {
        ...makeMinimalSpec(),
        info: { title: 'Updated', version: '2.0.0' },
      };
      const oldJson = JSON.stringify(oldSpec);
      const newJson = JSON.stringify(newSpec);

      const { createHash } = await import('node:crypto');
      const oldHash = createHash('sha256')
        .update(oldJson, 'utf-8')
        .digest('hex');

      writeFileSync(join(tmpDir, 'test-openapi.json'), oldJson, 'utf-8');
      writeFileSync(join(tmpDir, 'test-openapi.hash'), oldHash, 'utf-8');

      const extractor = new (class extends OpenAPIExtractor {
        constructor() {
          super('https://example.com/spec.json', tmpDir, 'test');
        }
        extractResources(): ResourceSpec[] {
          return [];
        }
      })();

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(newJson),
      } as unknown as Response);

      const result = await extractor.checkForUpdates();

      expect(result.hasChanged).toBe(true);
      expect(result.hash).not.toBe(oldHash);

      global.fetch = originalFetch;
    });

    it('throws when fetch returns a non-ok response', async () => {
      const extractor = new (class extends OpenAPIExtractor {
        constructor() {
          super('https://example.com/spec.json', tmpDir, 'test');
        }
        extractResources(): ResourceSpec[] {
          return [];
        }
      })();

      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as unknown as Response);

      await expect(extractor.checkForUpdates()).rejects.toThrow('404');

      global.fetch = originalFetch;
    });
  });

  // -------------------------------------------------------------------------
  // mapType helper
  // -------------------------------------------------------------------------
  describe('mapType() helper', () => {
    it('is accessible from subclasses and delegates to TypeMapper', () => {
      const extractor = new (class extends OpenAPIExtractor {
        constructor() {
          super('https://example.com', tmpDir, 'test');
        }
        extractResources(): ResourceSpec[] {
          return [];
        }
        testMapType(): string {
          return this.mapType(
            { type: 'string' },
            { propName: 'name', resourceName: 'Network' },
          );
        }
      })();

      expect(extractor.testMapType()).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // extractResources delegation
  // -------------------------------------------------------------------------
  describe('extractResources()', () => {
    it('returns the resources provided by the concrete subclass', () => {
      const fakeResource: ResourceSpec = {
        resourceName: 'Network',
        domain: 'Networking',
        providerType: 'Test::Networking::Network',
        createProps: [],
        attributes: [{ name: 'networkId', description: '' }],
        enums: [],
        nestedInterfaces: [],
        api: {
          createPath: '/networks',
          idPath: '/networks/{id}',
          createMethod: 'post',
          updateMethod: 'put',
          deleteMethod: 'delete',
          getMethod: 'get',
          responseResourceKey: 'network',
          idField: 'id',
          isAsync: false,
          actionPath: null,
        },
      };

      const extractor = new TestExtractor(tmpDir, [fakeResource]);
      expect(extractor.extractResources()).toEqual([fakeResource]);
    });
  });
});
