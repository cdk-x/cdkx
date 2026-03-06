import type { ResourceSchema } from './schema-reader.js';
import { RegistryGenerator } from './registry-generator.js';

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
    createOnlyProperties: [],
    required: [],
    definitions: {},
    localDefinitionNames: [],
    sharedDefinitionNames: [],
    filePath: '/fake/resource.schema.json',
    ...overrides,
  };
}

const RESOURCE_TYPE_CONST = 'TestResourceType';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RegistryGenerator', () => {
  describe('file structure', () => {
    it('emits auto-generated header comment', () => {
      const src = RegistryGenerator.generate([], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
      expect(src).toContain('AUTO-GENERATED — DO NOT EDIT');
    });

    it('imports the resource type const', () => {
      const src = RegistryGenerator.generate([], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
        resourcesImportPath: './resources.generated',
      });
      expect(src).toContain(
        `import { ${RESOURCE_TYPE_CONST} } from './resources.generated';`,
      );
    });

    it('uses default import path when resourcesImportPath is omitted', () => {
      const src = RegistryGenerator.generate([], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
      expect(src).toContain(`from './resources.generated'`);
    });

    it('emits the ResourceConfig interface', () => {
      const src = RegistryGenerator.generate([], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
      expect(src).toContain('export interface ResourceConfig {');
      expect(src).toContain('readonly createPath: string;');
      expect(src).toContain(
        'readonly deletePath: string | ((physicalId: string) => string);',
      );
    });

    it('emits the asRecord helper function', () => {
      const src = RegistryGenerator.generate([], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
      expect(src).toContain(
        'function asRecord(v: unknown): Record<string, unknown>',
      );
    });

    it('emits the RESOURCE_REGISTRY export', () => {
      const src = RegistryGenerator.generate([], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
      expect(src).toContain(
        'export const RESOURCE_REGISTRY: Record<string, ResourceConfig> = {',
      );
    });
  });

  describe('resources without api block', () => {
    it('skips resources that have no api block', () => {
      const resource = makeResource({
        typeName: 'Test::Compute::Server',
        domain: 'Compute',
        resourceName: 'Server',
      });
      const src = RegistryGenerator.generate([resource], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
      expect(src).not.toContain('TestResourceType.Compute.Server');
    });
  });

  describe('normal resource (network-like, with outputAttrMap)', () => {
    const network = makeResource({
      typeName: 'Test::Networking::Network',
      domain: 'Networking',
      resourceName: 'Network',
      readOnlyProperties: ['networkId'],
      createOnlyProperties: ['ipRange'],
      api: {
        createPath: '/networks',
        getPath: '/networks/{id}',
        updatePath: '/networks/{id}',
        deletePath: '/networks/{id}',
        responseBodyKey: 'network',
        outputAttrMap: { networkId: 'id' },
      },
    });

    let src: string;
    beforeAll(() => {
      src = RegistryGenerator.generate([network], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
    });

    it('emits the registry key using the resource type const', () => {
      expect(src).toContain(`[${RESOURCE_TYPE_CONST}.Networking.Network]:`);
    });

    it('emits createPath as a string literal', () => {
      expect(src).toContain(`createPath: '/networks',`);
    });

    it('emits getPath as an arrow function', () => {
      expect(src).toContain(`getPath: (id) => \`/networks/\${id}\`,`);
    });

    it('emits updatePath as an arrow function', () => {
      expect(src).toContain(`updatePath: (id) => \`/networks/\${id}\`,`);
    });

    it('emits deletePath as an arrow function', () => {
      expect(src).toContain(`deletePath: (id) => \`/networks/\${id}\`,`);
    });

    it('emits extractPhysicalId using responseBodyKey and mapped response field', () => {
      expect(src).toContain(`extractPhysicalId: (response) =>`);
      expect(src).toContain(
        `String(asRecord(asRecord(response)['network'])['id']),`,
      );
    });

    it('emits extractOutputs using outputAttrMap', () => {
      expect(src).toContain(`extractOutputs: (response) => ({`);
      expect(src).toContain(
        `networkId: asRecord(asRecord(response)['network'])['id'],`,
      );
    });

    it('emits createOnlyProps as a Set', () => {
      expect(src).toContain(`createOnlyProps: new Set(['ipRange']),`);
    });

    it('does not emit isActionResource', () => {
      // Only within the entry block — check by extracting the entry
      const entryStart = src.indexOf('[TestResourceType.Networking.Network]:');
      const entryEnd = src.indexOf('  },', entryStart);
      const entry = src.slice(entryStart, entryEnd);
      expect(entry).not.toContain('isActionResource');
    });
  });

  describe('action resource (subnet-like)', () => {
    const subnet = makeResource({
      typeName: 'Test::Networking::Subnet',
      domain: 'Networking',
      resourceName: 'Subnet',
      readOnlyProperties: [],
      createOnlyProperties: ['networkId', 'type', 'ipRange'],
      api: {
        createPath: '/networks/{networkId}/actions/add_subnet',
        deletePath: '/networks/{networkId}/actions/delete_subnet',
        responseBodyKey: null,
        compositeIdProps: ['networkId', 'ipRange'],
      },
    });

    let src: string;
    beforeAll(() => {
      src = RegistryGenerator.generate([subnet], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
    });

    it('emits the registry key', () => {
      expect(src).toContain(`[${RESOURCE_TYPE_CONST}.Networking.Subnet]:`);
    });

    it('emits createPath with placeholder', () => {
      expect(src).toContain(
        `createPath: '/networks/{networkId}/actions/add_subnet',`,
      );
    });

    it('does not emit getPath', () => {
      const entryStart = src.indexOf('[TestResourceType.Networking.Subnet]:');
      const entryEnd = src.indexOf('  },', entryStart);
      const entry = src.slice(entryStart, entryEnd);
      expect(entry).not.toContain('getPath');
    });

    it('does not emit updatePath', () => {
      const entryStart = src.indexOf('[TestResourceType.Networking.Subnet]:');
      const entryEnd = src.indexOf('  },', entryStart);
      const entry = src.slice(entryStart, entryEnd);
      expect(entry).not.toContain('updatePath');
    });

    it('emits deletePath as a string literal (not arrow function)', () => {
      expect(src).toContain(
        `deletePath: '/networks/{networkId}/actions/delete_subnet',`,
      );
    });

    it('emits extractPhysicalId as a composite from compositeIdProps', () => {
      expect(src).toContain(
        `extractPhysicalId: (_response, properties) => String(properties['networkId'] ?? '') + ':' + String(properties['ipRange'] ?? ''),`,
      );
    });

    it('emits extractOutputs as a no-op', () => {
      expect(src).toContain(`extractOutputs: () => ({}),`);
    });

    it('emits isActionResource: true', () => {
      expect(src).toContain('isActionResource: true,');
    });

    it('emits parentIdProp from first compositeIdProp', () => {
      expect(src).toContain(`parentIdProp: 'networkId',`);
    });

    it('emits createOnlyProps as a Set', () => {
      expect(src).toContain(
        `createOnlyProps: new Set(['networkId', 'type', 'ipRange']),`,
      );
    });
  });

  describe('ssh-key style: getPath with query string uses encodeURIComponent', () => {
    const sshKey = makeResource({
      typeName: 'Test::Security::SshKey',
      domain: 'Security',
      resourceName: 'SshKey',
      readOnlyProperties: [],
      createOnlyProperties: ['publicKey'],
      api: {
        createPath: '/ssh_keys',
        getPath: '/ssh_keys?name={name}',
        updatePath: '/ssh_keys/{id}',
        deletePath: '/ssh_keys/{id}',
        responseBodyKey: 'ssh_key',
      },
    });

    let src: string;
    beforeAll(() => {
      src = RegistryGenerator.generate([sshKey], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
    });

    it('uses encodeURIComponent for query-string path param', () => {
      expect(src).toContain(
        'getPath: (name) => `/ssh_keys?name=${encodeURIComponent(name)}`,',
      );
    });

    it('uses plain template literal for regular path param', () => {
      expect(src).toContain('updatePath: (id) => `/ssh_keys/${id}`,');
      expect(src).toContain('deletePath: (id) => `/ssh_keys/${id}`,');
    });

    it('emits extractOutputs as no-op when no readOnlyProperties', () => {
      expect(src).toContain('extractOutputs: () => ({}),');
    });
  });

  describe('placement-group style: multiple readOnlyProperties with outputAttrMap', () => {
    const pg = makeResource({
      typeName: 'Test::Compute::PlacementGroup',
      domain: 'Compute',
      resourceName: 'PlacementGroup',
      readOnlyProperties: ['id', 'serverIds'],
      createOnlyProperties: ['type'],
      api: {
        createPath: '/placement_groups',
        getPath: '/placement_groups/{id}',
        updatePath: '/placement_groups/{id}',
        deletePath: '/placement_groups/{id}',
        responseBodyKey: 'placement_group',
        outputAttrMap: { id: 'id', serverIds: 'servers' },
      },
    });

    let src: string;
    beforeAll(() => {
      src = RegistryGenerator.generate([pg], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
    });

    it('emits extractOutputs with all mapped attrs', () => {
      expect(src).toContain(`extractOutputs: (response) => ({`);
      expect(src).toContain(
        `id: asRecord(asRecord(response)['placement_group'])['id'],`,
      );
      expect(src).toContain(
        `serverIds: asRecord(asRecord(response)['placement_group'])['servers'],`,
      );
    });

    it('uses outputAttrMap[firstReadOnly] for physicalId response field', () => {
      // first readOnly is 'id', outputAttrMap.id = 'id'
      expect(src).toContain(
        `String(asRecord(asRecord(response)['placement_group'])['id']),`,
      );
    });
  });

  describe('primary-ip style: readOnlyProperties without outputAttrMap', () => {
    const primaryIp = makeResource({
      typeName: 'Test::Networking::PrimaryIp',
      domain: 'Networking',
      resourceName: 'PrimaryIp',
      readOnlyProperties: ['id'],
      createOnlyProperties: ['type', 'assigneeType'],
      api: {
        createPath: '/primary_ips',
        getPath: '/primary_ips/{id}',
        updatePath: '/primary_ips/{id}',
        deletePath: '/primary_ips/{id}',
        responseBodyKey: 'primary_ip',
        // No outputAttrMap — falls back to prop name as response field
      },
    });

    let src: string;
    beforeAll(() => {
      src = RegistryGenerator.generate([primaryIp], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
    });

    it('emits extractOutputs falling back to prop name as response field', () => {
      expect(src).toContain(`extractOutputs: (response) => ({`);
      // prop name 'id' maps to response field 'id' (fallback)
      expect(src).toContain(
        `id: asRecord(asRecord(response)['primary_ip'])['id'],`,
      );
    });

    it('defaults extractPhysicalId response field to "id"', () => {
      expect(src).toContain(
        `String(asRecord(asRecord(response)['primary_ip'])['id']),`,
      );
    });
  });

  describe('empty createOnlyProps', () => {
    it('emits new Set() when createOnlyProperties is empty', () => {
      const resource = makeResource({
        typeName: 'Test::Domain::Simple',
        domain: 'Domain',
        resourceName: 'Simple',
        readOnlyProperties: [],
        createOnlyProperties: [],
        api: {
          createPath: '/simple',
          deletePath: '/simple/{id}',
          responseBodyKey: 'simple',
        },
      });
      const src = RegistryGenerator.generate([resource], {
        resourceTypeConst: RESOURCE_TYPE_CONST,
      });
      expect(src).toContain('createOnlyProps: new Set(),');
    });
  });
});
