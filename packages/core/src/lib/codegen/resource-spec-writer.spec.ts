import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ResourceSpecWriter } from './resource-spec-writer.js';
import type { ResourceSpec } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeNetworkSpec(): ResourceSpec {
  return {
    resourceName: 'Network',
    domain: 'Networking',
    providerType: 'Hetzner::Networking::Network',
    createProps: [
      {
        name: 'name',
        originalName: 'name',
        type: 'string',
        required: true,
        description: 'Name of the network.',
        isEnum: false,
        isCrossRef: false,
        isNestedObject: false,
        isArray: false,
        isNullable: false,
      },
    ],
    attributes: [{ name: 'networkId', description: 'Cloud-assigned ID.' }],
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
}

function makeServerSpec(): ResourceSpec {
  return {
    resourceName: 'Server',
    domain: 'Compute',
    providerType: 'Hetzner::Compute::Server',
    createProps: [],
    attributes: [{ name: 'serverId', description: 'Cloud-assigned ID.' }],
    enums: [],
    nestedInterfaces: [],
    api: {
      createPath: '/servers',
      idPath: '/servers/{id}',
      createMethod: 'post',
      updateMethod: 'put',
      deleteMethod: 'delete',
      getMethod: 'get',
      responseResourceKey: 'server',
      idField: 'id',
      isAsync: true,
      actionPath: '/actions/{id}',
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = join(tmpdir(), `cdkx-spec-writer-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResourceSpecWriter', () => {
  let tmpDir: string;
  let writer: ResourceSpecWriter;

  beforeEach(() => {
    tmpDir = makeTmpDir();
    writer = new ResourceSpecWriter();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // toEnginePayload
  // -------------------------------------------------------------------------
  describe('toEnginePayload()', () => {
    it('returns an empty object for empty specs array', () => {
      expect(writer.toEnginePayload([])).toEqual({});
    });

    it('keys the payload by providerType', () => {
      const payload = writer.toEnginePayload([makeNetworkSpec()]);
      expect(Object.keys(payload)).toEqual(['Hetzner::Networking::Network']);
    });

    it('includes resourceName, domain, providerType, and api', () => {
      const payload = writer.toEnginePayload([makeNetworkSpec()]);
      const entry = payload['Hetzner::Networking::Network'];
      expect(entry.resourceName).toBe('Network');
      expect(entry.domain).toBe('Networking');
      expect(entry.providerType).toBe('Hetzner::Networking::Network');
      expect(entry.api.createPath).toBe('/networks');
      expect(entry.api.isAsync).toBe(false);
    });

    it('excludes createProps, enums, nestedInterfaces', () => {
      const payload = writer.toEnginePayload([makeNetworkSpec()]);
      const entry = payload[
        'Hetzner::Networking::Network'
      ] as unknown as Record<string, unknown>;
      expect(entry['createProps']).toBeUndefined();
      expect(entry['enums']).toBeUndefined();
      expect(entry['nestedInterfaces']).toBeUndefined();
      expect(entry['attributes']).toBeUndefined();
    });

    it('handles multiple specs', () => {
      const payload = writer.toEnginePayload([
        makeNetworkSpec(),
        makeServerSpec(),
      ]);
      expect(Object.keys(payload)).toHaveLength(2);
      expect(payload['Hetzner::Compute::Server'].api.isAsync).toBe(true);
      expect(payload['Hetzner::Compute::Server'].api.actionPath).toBe(
        '/actions/{id}',
      );
    });

    it('preserves all api fields', () => {
      const payload = writer.toEnginePayload([makeServerSpec()]);
      const api = payload['Hetzner::Compute::Server'].api;
      expect(api.createMethod).toBe('post');
      expect(api.updateMethod).toBe('put');
      expect(api.deleteMethod).toBe('delete');
      expect(api.getMethod).toBe('get');
      expect(api.responseResourceKey).toBe('server');
      expect(api.idField).toBe('id');
      expect(api.idPath).toBe('/servers/{id}');
    });
  });

  // -------------------------------------------------------------------------
  // write
  // -------------------------------------------------------------------------
  describe('write()', () => {
    it('creates the output file', () => {
      const outputPath = join(tmpDir, 'hetzner-resources.json');
      writer.write([makeNetworkSpec()], outputPath);
      expect(existsSync(outputPath)).toBe(true);
    });

    it('writes valid JSON', () => {
      const outputPath = join(tmpDir, 'hetzner-resources.json');
      writer.write([makeNetworkSpec()], outputPath);
      const raw = readFileSync(outputPath, 'utf-8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    it('written JSON matches toEnginePayload output', () => {
      const specs = [makeNetworkSpec(), makeServerSpec()];
      const outputPath = join(tmpDir, 'hetzner-resources.json');
      writer.write(specs, outputPath);
      const parsed = JSON.parse(readFileSync(outputPath, 'utf-8')) as unknown;
      expect(parsed).toEqual(writer.toEnginePayload(specs));
    });

    it('creates parent directories if they do not exist', () => {
      const outputPath = join(tmpDir, 'nested', 'deep', 'resources.json');
      expect(existsSync(join(tmpDir, 'nested'))).toBe(false);
      writer.write([makeNetworkSpec()], outputPath);
      expect(existsSync(outputPath)).toBe(true);
    });

    it('writes file ending with a newline', () => {
      const outputPath = join(tmpDir, 'resources.json');
      writer.write([makeNetworkSpec()], outputPath);
      const raw = readFileSync(outputPath, 'utf-8');
      expect(raw.endsWith('\n')).toBe(true);
    });

    it('writes empty object for empty specs array', () => {
      const outputPath = join(tmpDir, 'empty.json');
      writer.write([], outputPath);
      const parsed = JSON.parse(readFileSync(outputPath, 'utf-8')) as unknown;
      expect(parsed).toEqual({});
    });

    it('overwrites an existing file', () => {
      const outputPath = join(tmpDir, 'resources.json');
      writer.write([makeNetworkSpec()], outputPath);
      writer.write([makeServerSpec()], outputPath);
      const parsed = JSON.parse(readFileSync(outputPath, 'utf-8')) as Record<
        string,
        unknown
      >;
      expect(Object.keys(parsed)).toEqual(['Hetzner::Compute::Server']);
    });
  });
});
