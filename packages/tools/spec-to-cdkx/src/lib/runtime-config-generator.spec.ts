import type { ResourceSchema } from './schema-reader.js';
import { RuntimeConfigGenerator } from './runtime-config-generator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResource(overrides: Partial<ResourceSchema>): ResourceSchema {
  return {
    typeName: 'Test::Domain::Resource',
    domain: 'Domain',
    resourceName: 'Resource',
    description: '',
    properties: {},
    readOnlyProperties: [],
    attrProperties: [],
    createOnlyProperties: [],
    primaryIdentifier: [],
    required: [],
    definitions: {},
    localDefinitionNames: [],
    sharedDefinitionNames: [],
    filePath: '/fake/resource.schema.json',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RuntimeConfigGenerator', () => {
  describe('file structure', () => {
    it('emits auto-generated header comment', () => {
      const src = RuntimeConfigGenerator.generate([]);
      expect(src).toContain('AUTO-GENERATED — DO NOT EDIT');
    });

    it('emits the RuntimeResourceConfig interface', () => {
      const src = RuntimeConfigGenerator.generate([]);
      expect(src).toContain('export interface RuntimeResourceConfig {');
      expect(src).toContain('readonly physicalIdKey: string;');
      expect(src).toContain('readonly createOnlyProps: ReadonlySet<string>;');
    });

    it('emits the RUNTIME_CONFIGS export', () => {
      const src = RuntimeConfigGenerator.generate([]);
      expect(src).toContain(
        'export const RUNTIME_CONFIGS: Record<string, RuntimeResourceConfig> = {',
      );
    });
  });

  describe('physicalIdKey resolution', () => {
    it('uses property name for single-element primaryIdentifier', () => {
      const resource = makeResource({
        typeName: 'Test::Networking::Network',
        primaryIdentifier: ['networkId'],
      });
      const src = RuntimeConfigGenerator.generate([resource]);
      expect(src).toContain("physicalIdKey: 'networkId'");
    });

    it('uses "physicalId" for multi-element primaryIdentifier', () => {
      const resource = makeResource({
        typeName: 'Test::Networking::Subnet',
        primaryIdentifier: ['networkId', 'ipRange'],
      });
      const src = RuntimeConfigGenerator.generate([resource]);
      expect(src).toContain("physicalIdKey: 'physicalId'");
    });

    it('handles JSON pointer format in primaryIdentifier', () => {
      // Note: SchemaReader.extractPropNames converts "/properties/serverId" → "serverId"
      const resource = makeResource({
        typeName: 'Test::Compute::Server',
        primaryIdentifier: ['serverId'],
      });
      const src = RuntimeConfigGenerator.generate([resource]);
      expect(src).toContain("physicalIdKey: 'serverId'");
    });

    it('falls back to "id" when primaryIdentifier is empty', () => {
      const resource = makeResource({
        typeName: 'Test::Storage::Volume',
        primaryIdentifier: [],
      });
      const src = RuntimeConfigGenerator.generate([resource]);
      expect(src).toContain("physicalIdKey: 'id'");
    });
  });

  describe('createOnlyProps', () => {
    it('emits empty Set when no createOnlyProperties', () => {
      const resource = makeResource({
        typeName: 'Test::Networking::Network',
        createOnlyProperties: [],
      });
      const src = RuntimeConfigGenerator.generate([resource]);
      expect(src).toContain('createOnlyProps: new Set(),');
    });

    it('emits Set with property names', () => {
      const resource = makeResource({
        typeName: 'Test::Networking::Subnet',
        createOnlyProperties: ['networkId', 'type', 'networkZone', 'ipRange'],
      });
      const src = RuntimeConfigGenerator.generate([resource]);
      expect(src).toContain(
        "createOnlyProps: new Set(['networkId', 'type', 'networkZone', 'ipRange']),",
      );
    });
  });

  describe('full resource examples', () => {
    it('generates config for network (simple ID)', () => {
      const network = makeResource({
        typeName: 'Test::Networking::Network',
        primaryIdentifier: ['networkId'],
        createOnlyProperties: ['ipRange'],
      });
      const src = RuntimeConfigGenerator.generate([network]);

      expect(src).toContain('// Test::Networking::Network');
      expect(src).toContain("'Test::Networking::Network': {");
      expect(src).toContain("physicalIdKey: 'networkId'");
      expect(src).toContain("createOnlyProps: new Set(['ipRange']),");
    });

    it('generates config for subnet (composite ID)', () => {
      const subnet = makeResource({
        typeName: 'Test::Networking::Subnet',
        primaryIdentifier: ['networkId', 'ipRange'],
        createOnlyProperties: [
          'networkId',
          'type',
          'networkZone',
          'ipRange',
          'vswitchId',
        ],
      });
      const src = RuntimeConfigGenerator.generate([subnet]);

      expect(src).toContain('// Test::Networking::Subnet');
      expect(src).toContain("'Test::Networking::Subnet': {");
      expect(src).toContain("physicalIdKey: 'physicalId'");
      expect(src).toContain(
        "createOnlyProps: new Set(['networkId', 'type', 'networkZone', 'ipRange', 'vswitchId']),",
      );
    });

    it('generates configs for multiple resources', () => {
      const resources: ResourceSchema[] = [
        makeResource({
          typeName: 'Test::Networking::Network',
          primaryIdentifier: ['networkId'],
          createOnlyProperties: ['ipRange'],
        }),
        makeResource({
          typeName: 'Test::Networking::Subnet',
          primaryIdentifier: ['networkId', 'ipRange'],
          createOnlyProperties: ['networkId', 'ipRange'],
        }),
        makeResource({
          typeName: 'Test::Compute::Server',
          primaryIdentifier: ['serverId'],
          createOnlyProperties: ['serverType', 'datacenter'],
        }),
      ];

      const src = RuntimeConfigGenerator.generate(resources);

      expect(src).toContain("'Test::Networking::Network': {");
      expect(src).toContain("'Test::Networking::Subnet': {");
      expect(src).toContain("'Test::Compute::Server': {");
    });
  });
});
