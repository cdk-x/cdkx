import { ResourceCodeGenerator } from './resource-code-generator.js';
import type { ResourceSpec } from './types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeMinimalSpec(): ResourceSpec {
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
      {
        name: 'ipRange',
        originalName: 'ip_range',
        type: 'string',
        required: true,
        description: 'IPv4 prefix of the whole network.',
        isEnum: false,
        isCrossRef: false,
        isNestedObject: false,
        isArray: false,
        isNullable: false,
      },
      {
        name: 'labels',
        originalName: 'labels',
        type: 'Record<string, string>',
        required: false,
        description: 'User-defined labels.',
        isEnum: false,
        isCrossRef: false,
        isNestedObject: false,
        isArray: false,
        isNullable: false,
      },
    ],
    attributes: [
      {
        name: 'networkId',
        description: 'Cloud-assigned ID of this network.',
      },
    ],
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

function makeEnumSpec(): ResourceSpec {
  return {
    resourceName: 'Certificate',
    domain: 'Security',
    providerType: 'Hetzner::Security::Certificate',
    createProps: [
      {
        name: 'name',
        originalName: 'name',
        type: 'string',
        required: true,
        description: 'Name of the certificate.',
        isEnum: false,
        isCrossRef: false,
        isNestedObject: false,
        isArray: false,
        isNullable: false,
      },
      {
        name: 'type',
        originalName: 'type',
        type: 'CertificateType',
        required: false,
        description: 'Choose between uploading a Certificate in PEM format...',
        isEnum: true,
        enumRef: 'CertificateType',
        isCrossRef: false,
        isNestedObject: false,
        isArray: false,
        isNullable: false,
      },
    ],
    attributes: [{ name: 'certificateId', description: 'Cloud-assigned ID.' }],
    enums: [
      {
        name: 'CertificateType',
        description: 'Type of the Certificate.',
        values: [
          { label: 'UPLOADED', value: 'uploaded', description: 'Uploaded.' },
          { label: 'MANAGED', value: 'managed', description: 'Let us manage.' },
        ],
      },
    ],
    nestedInterfaces: [],
    api: {
      createPath: '/certificates',
      idPath: '/certificates/{id}',
      createMethod: 'post',
      updateMethod: 'put',
      deleteMethod: 'delete',
      getMethod: 'get',
      responseResourceKey: 'certificate',
      idField: 'id',
      isAsync: true,
      actionPath: '/actions/{id}',
    },
  };
}

function makeNestedInterfaceSpec(): ResourceSpec {
  return {
    resourceName: 'Firewall',
    domain: 'Security',
    providerType: 'Hetzner::Security::Firewall',
    createProps: [
      {
        name: 'name',
        originalName: 'name',
        type: 'string',
        required: true,
        description: 'Name of the Firewall.',
        isEnum: false,
        isCrossRef: false,
        isNestedObject: false,
        isArray: false,
        isNullable: false,
      },
      {
        name: 'rules',
        originalName: 'rules',
        type: 'FirewallRule[]',
        required: false,
        description: 'Array of rules.',
        isEnum: false,
        isCrossRef: false,
        isNestedObject: false,
        isArray: true,
        isNullable: false,
      },
    ],
    attributes: [{ name: 'firewallId', description: 'Cloud-assigned ID.' }],
    enums: [
      {
        name: 'FirewallRuleDirection',
        description: 'The direction of the rule.',
        values: [
          { label: 'IN', value: 'in' },
          { label: 'OUT', value: 'out' },
        ],
      },
    ],
    nestedInterfaces: [
      {
        name: 'FirewallRule',
        description: 'A firewall rule.',
        properties: [
          {
            name: 'direction',
            originalName: 'direction',
            type: 'FirewallRuleDirection',
            required: true,
            description: 'Direction of the rule.',
            isEnum: true,
            enumRef: 'FirewallRuleDirection',
            isCrossRef: false,
            isNestedObject: false,
            isArray: false,
            isNullable: false,
          },
          {
            name: 'protocol',
            originalName: 'protocol',
            type: 'string',
            required: true,
            description: 'Protocol.',
            isEnum: false,
            isCrossRef: false,
            isNestedObject: false,
            isArray: false,
            isNullable: false,
          },
        ],
      },
    ],
    api: {
      createPath: '/firewalls',
      idPath: '/firewalls/{id}',
      createMethod: 'post',
      updateMethod: 'put',
      deleteMethod: 'delete',
      getMethod: 'get',
      responseResourceKey: 'firewall',
      idField: 'id',
      isAsync: false,
      actionPath: null,
    },
  };
}

function makeCrossRefSpec(): ResourceSpec {
  return {
    resourceName: 'Subnet',
    domain: 'Networking',
    providerType: 'Hetzner::Networking::Subnet',
    createProps: [
      {
        name: 'networkId',
        originalName: 'network_id',
        type: 'string | number | IResolvable',
        required: true,
        description: 'ID of the parent network.',
        isEnum: false,
        isCrossRef: true,
        isNestedObject: false,
        isArray: false,
        isNullable: false,
      },
      {
        name: 'ipRange',
        originalName: 'ip_range',
        type: 'string',
        required: true,
        description: 'IP range.',
        isEnum: false,
        isCrossRef: false,
        isNestedObject: false,
        isArray: false,
        isNullable: false,
      },
    ],
    attributes: [{ name: 'subnetId', description: 'Cloud-assigned ID.' }],
    enums: [],
    nestedInterfaces: [],
    api: {
      createPath: '/networks/{id}/subnets',
      idPath: '/networks/{id}/subnets/{subnetId}',
      createMethod: 'post',
      updateMethod: null,
      deleteMethod: 'delete',
      getMethod: null,
      responseResourceKey: 'subnet',
      idField: 'id',
      isAsync: true,
      actionPath: '/actions/{id}',
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResourceCodeGenerator', () => {
  const generator = new ResourceCodeGenerator('Hetzner', 'HetznerResourceType');

  // -------------------------------------------------------------------------
  // toFilePath
  // -------------------------------------------------------------------------
  describe('toFilePath()', () => {
    it('produces kebab-case path for simple PascalCase name', () => {
      const spec = makeMinimalSpec();
      expect(generator.toFilePath(spec)).toBe(
        'networking/ntv-hetzner-network.ts',
      );
    });

    it('produces kebab-case path for multi-word PascalCase name', () => {
      const spec = makeCrossRefSpec();
      expect(generator.toFilePath(spec)).toBe(
        'networking/ntv-hetzner-subnet.ts',
      );
    });

    it('lowercases the domain directory', () => {
      const spec = makeEnumSpec(); // domain: Security
      expect(generator.toFilePath(spec)).toBe(
        'security/ntv-hetzner-certificate.ts',
      );
    });

    it('handles compound resource names like FloatingIp', () => {
      const spec: ResourceSpec = {
        ...makeMinimalSpec(),
        resourceName: 'FloatingIp',
        domain: 'Networking',
      };
      expect(generator.toFilePath(spec)).toBe(
        'networking/ntv-hetzner-floating-ip.ts',
      );
    });
  });

  // -------------------------------------------------------------------------
  // generateFile — minimal spec (no enums, no nested interfaces)
  // -------------------------------------------------------------------------
  describe('generateFile() — minimal spec', () => {
    it('matches snapshot', () => {
      const file = generator.generateFile(makeMinimalSpec());
      expect(file.content).toMatchSnapshot();
    });

    it('sets relativePath correctly', () => {
      const file = generator.generateFile(makeMinimalSpec());
      expect(file.relativePath).toBe('networking/ntv-hetzner-network.ts');
    });

    it('contains the auto-generated header', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain('AUTO-GENERATED — do not edit manually.');
      expect(content).toContain('yarn nx run @cdk-x/hetzner:codegen');
    });

    it('imports ProviderResource from @cdk-x/core', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain("from '@cdk-x/core'");
      expect(content).toContain('ProviderResource');
    });

    it('does NOT import IResolvable when no cross-refs or attributes', () => {
      const specNoAttrs: ResourceSpec = {
        ...makeMinimalSpec(),
        attributes: [],
      };
      const { content } = generator.generateFile(specNoAttrs);
      expect(content).not.toContain('IResolvable');
    });

    it('imports IResolvable when spec has attributes', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain('IResolvable');
    });

    it('emits the HetznerNetwork props interface', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain('export interface HetznerNetwork {');
    });

    it('emits the NtvHetznerNetworkProps interface extending HetznerNetwork', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain(
        'export interface NtvHetznerNetworkProps extends HetznerNetwork {}',
      );
    });

    it('emits the NtvHetznerNetwork class', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain(
        'export class NtvHetznerNetwork extends ProviderResource {',
      );
    });

    it('emits required prop without ?', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain('readonly name: string;');
    });

    it('emits optional prop with ?', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain('readonly labels?: Record<string, string>;');
    });

    it('emits networkId getter returning IResolvable', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain('get networkId(): IResolvable {');
      expect(content).toContain("attr: 'networkId'");
    });

    it('ends with a newline', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content.endsWith('\n')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // generateFile — spec with enums
  // -------------------------------------------------------------------------
  describe('generateFile() — spec with enums', () => {
    it('matches snapshot', () => {
      const file = generator.generateFile(makeEnumSpec());
      expect(file.content).toMatchSnapshot();
    });

    it('emits the CertificateType enum', () => {
      const { content } = generator.generateFile(makeEnumSpec());
      expect(content).toContain('export enum CertificateType {');
      expect(content).toContain("UPLOADED = 'uploaded'");
      expect(content).toContain("MANAGED = 'managed'");
    });

    it('includes enum JSDoc descriptions as member comments', () => {
      const { content } = generator.generateFile(makeEnumSpec());
      expect(content).toContain('/** Uploaded. */');
    });
  });

  // -------------------------------------------------------------------------
  // generateFile — spec with nested interfaces
  // -------------------------------------------------------------------------
  describe('generateFile() — spec with nested interfaces', () => {
    it('matches snapshot', () => {
      const file = generator.generateFile(makeNestedInterfaceSpec());
      expect(file.content).toMatchSnapshot();
    });

    it('emits the FirewallRule nested interface', () => {
      const { content } = generator.generateFile(makeNestedInterfaceSpec());
      expect(content).toContain('export interface FirewallRule {');
      expect(content).toContain('readonly direction: FirewallRuleDirection;');
    });

    it('emits the FirewallRuleDirection enum', () => {
      const { content } = generator.generateFile(makeNestedInterfaceSpec());
      expect(content).toContain('export enum FirewallRuleDirection {');
      expect(content).toContain("IN = 'in'");
      expect(content).toContain("OUT = 'out'");
    });
  });

  // -------------------------------------------------------------------------
  // generateFile — spec with cross-resource references
  // -------------------------------------------------------------------------
  describe('generateFile() — spec with cross-resource references (IResolvable)', () => {
    it('imports IResolvable when createProps has a cross-ref', () => {
      const { content } = generator.generateFile(makeCrossRefSpec());
      expect(content).toContain('IResolvable');
    });

    it('emits cross-ref prop with correct type', () => {
      const { content } = generator.generateFile(makeCrossRefSpec());
      expect(content).toContain(
        'readonly networkId: string | number | IResolvable;',
      );
    });
  });

  // -------------------------------------------------------------------------
  // generateFile — nullable prop
  // -------------------------------------------------------------------------
  describe('generateFile() — nullable props', () => {
    it('appends | null to nullable optional prop', () => {
      const spec: ResourceSpec = {
        ...makeMinimalSpec(),
        createProps: [
          {
            name: 'description',
            originalName: 'description',
            type: 'string',
            required: false,
            description: 'Description.',
            isEnum: false,
            isCrossRef: false,
            isNestedObject: false,
            isArray: false,
            isNullable: true,
          },
        ],
        attributes: [],
      };
      const { content } = generator.generateFile(spec);
      expect(content).toContain('readonly description?: string | null;');
    });

    it('does NOT duplicate | null when already in type string', () => {
      const spec: ResourceSpec = {
        ...makeMinimalSpec(),
        createProps: [
          {
            name: 'description',
            originalName: 'description',
            type: 'string | null',
            required: false,
            description: 'Description.',
            isEnum: false,
            isCrossRef: false,
            isNestedObject: false,
            isArray: false,
            isNullable: true,
          },
        ],
        attributes: [],
      };
      const { content } = generator.generateFile(spec);
      // Should appear exactly once
      const matches = (content.match(/string \| null/g) ?? []).length;
      expect(matches).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // resourceTypeConst reference in class body
  // -------------------------------------------------------------------------
  describe('resource type constant reference', () => {
    it('references the correct constant path in constructor', () => {
      const { content } = generator.generateFile(makeMinimalSpec());
      expect(content).toContain(
        'type: HetznerResourceType.Networking.NETWORK,',
      );
    });
  });
});
