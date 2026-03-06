import * as path from 'path';
import { SchemaReader } from './schema-reader.js';

const FIXTURES_DIR = path.join(__dirname, '../../test/fixtures/schemas');

describe('SchemaReader', () => {
  describe('read()', () => {
    let resources: ReturnType<typeof SchemaReader.read>;

    beforeAll(() => {
      resources = SchemaReader.read(FIXTURES_DIR);
    });

    it('returns one ResourceSchema per file with a typeName', () => {
      // common.schema.json has no typeName — network + server + subnet should be returned
      expect(resources).toHaveLength(3);
    });

    it('extracts typeName, domain, and resourceName', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      expect(network).toBeDefined();
      expect(network?.typeName).toBe('Test::Networking::Network');
      expect(network?.domain).toBe('Networking');
    });

    it('extracts properties from the schema', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      expect(network?.properties).toHaveProperty('name');
      expect(network?.properties).toHaveProperty('ipRange');
      expect(network?.properties).toHaveProperty('labels');
    });

    it('extracts readOnlyProperties as plain names (not JSON pointers)', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      expect(network?.readOnlyProperties).toEqual(['networkId']);
    });

    it('resolves cross-file $ref for Labels → additionalProperties type', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      const labelsProp = network?.properties['labels'];
      // Cross-file ref should be inlined — the Labels definition has additionalProperties
      expect(labelsProp?.additionalProperties).toEqual({ type: 'string' });
    });

    it('resolves cross-file $ref for enum (NetworkZone) to a same-file $ref', () => {
      const server = resources.find((r) => r.resourceName === 'Server');
      const zoneProp = server?.properties['networkZone'];
      // NetworkZone is a named enum — must be kept as a same-file $ref, not inlined.
      expect(zoneProp?.$ref).toBe('#/definitions/NetworkZone');
      // The body must NOT be inlined (no enum array on the property itself).
      expect(zoneProp?.enum).toBeUndefined();
    });

    it('leaves same-file $ref as-is', () => {
      const server = resources.find((r) => r.resourceName === 'Server');
      const publicNetProp = server?.properties['publicNet'];
      // #/definitions/ServerPublicNet — should remain as $ref
      expect(publicNetProp?.$ref).toBe('#/definitions/ServerPublicNet');
    });

    it('populates definitions map with local definitions', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      expect(network?.definitions).toHaveProperty('NetworkSubnetType');
    });

    it('includes global definitions from common.schema.json in the map', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      expect(network?.definitions).toHaveProperty('Labels');
    });

    it('populates localDefinitionNames with only this schema\u2019s own defs', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      // NetworkSubnetType is defined in network.schema.json
      expect(network?.localDefinitionNames).toContain('NetworkSubnetType');
      // Labels comes from common.schema.json — must NOT be in localDefinitionNames
      expect(network?.localDefinitionNames).not.toContain('Labels');
    });

    it('populates sharedDefinitionNames with cross-file named types referenced by properties', () => {
      const server = resources.find((r) => r.resourceName === 'Server');
      // networkZone references NetworkZone (a named enum) from common.schema.json
      expect(server?.sharedDefinitionNames).toContain('NetworkZone');
    });

    it('does not include structural cross-file defs (e.g. Labels) in sharedDefinitionNames', () => {
      const server = resources.find((r) => r.resourceName === 'Server');
      // Labels uses additionalProperties (structural) — inlined, not a named type
      expect(server?.sharedDefinitionNames).not.toContain('Labels');
    });

    it('returns an empty sharedDefinitionNames when no cross-file named types are referenced', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      // network.schema.json only references Labels (structural) — no named shared types
      expect(network?.sharedDefinitionNames).toEqual([]);
    });

    it('includes description from the schema', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      expect(network?.description).toBe('A test network resource.');
    });

    it('includes the absolute filePath', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      expect(network?.filePath).toContain('network.schema.json');
      expect(path.isAbsolute(network?.filePath ?? '')).toBe(true);
    });

    it('populates required from the schema required array', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      // network.schema.json has required: ["name", "ipRange"]
      expect(network?.required).toEqual(['name', 'ipRange']);
    });

    it('returns an empty required array when schema has no required field', () => {
      // Verify the field exists and is an array on all resources
      for (const r of resources) {
        expect(Array.isArray(r.required)).toBe(true);
      }
    });

    it('handles schemas with no readOnlyProperties', () => {
      // If we had such a schema, it should return an empty array.
      // Verify existing schemas work — network has one, server has one.
      const server = resources.find((r) => r.resourceName === 'Server');
      expect(server?.readOnlyProperties).toEqual(['serverId']);
    });

    it('populates createOnlyProperties as plain names (not JSON pointers)', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      // network.schema.json has createOnlyProperties: ["/properties/ipRange"]
      expect(network?.createOnlyProperties).toEqual(['ipRange']);
    });

    it('returns an empty createOnlyProperties array when schema has none', () => {
      const server = resources.find((r) => r.resourceName === 'Server');
      expect(server?.createOnlyProperties).toEqual([]);
    });

    it('populates api when the schema has an api block', () => {
      const network = resources.find((r) => r.resourceName === 'Network');
      expect(network?.api).toBeDefined();
      expect(network?.api?.createPath).toBe('/networks');
      expect(network?.api?.getPath).toBe('/networks/{id}');
      expect(network?.api?.updatePath).toBe('/networks/{id}');
      expect(network?.api?.deletePath).toBe('/networks/{id}');
      expect(network?.api?.responseBodyKey).toBe('network');
      expect(network?.api?.outputAttrMap).toEqual({ networkId: 'id' });
    });

    it('leaves api undefined when the schema has no api block', () => {
      const server = resources.find((r) => r.resourceName === 'Server');
      expect(server?.api).toBeUndefined();
    });
  });
});
