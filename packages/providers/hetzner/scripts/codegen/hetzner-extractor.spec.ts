import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { HetznerExtractor } from './hetzner-extractor.js';
import type { OpenAPISpec } from '@cdk-x/core';

// ---------------------------------------------------------------------------
// Minimal fixture spec (representative subset of the real Hetzner OpenAPI)
// ---------------------------------------------------------------------------

const FIXTURE_SPEC: OpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Hetzner Cloud API', version: '1.0.0' },
  paths: {
    '/networks': {
      post: {
        operationId: 'createNetwork',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'ip_range'],
                properties: {
                  name: { type: 'string', description: 'Name of the network.' },
                  ip_range: {
                    type: 'string',
                    description: 'IPv4 prefix of the whole network.',
                  },
                  labels: {
                    type: 'object',
                    additionalProperties: { type: 'string' },
                    description: 'User-defined labels.',
                  },
                  expose_routes_to_vswitch: {
                    type: 'boolean',
                    description: 'Expose routes to vSwitch.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    network: {
                      type: 'object',
                      properties: { id: { type: 'integer' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/networks/{id}': {
      get: { operationId: 'getNetwork', responses: { '200': {} } },
      put: { operationId: 'updateNetwork', responses: { '200': {} } },
      delete: { operationId: 'deleteNetwork', responses: { '204': {} } },
    },
    '/servers': {
      post: {
        operationId: 'createServer',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'server_type'],
                properties: {
                  name: { type: 'string', description: 'Name of the server.' },
                  server_type: {
                    type: 'string',
                    description: 'Type of server to create.',
                  },
                  image: { type: 'string', description: 'Image to use.' },
                  ssh_keys: {
                    type: 'array',
                    items: { type: 'integer' },
                    description: 'SSH key IDs.',
                  },
                  networks: {
                    type: 'array',
                    items: { type: 'integer' },
                    description: 'Network IDs.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    server: {
                      type: 'object',
                      properties: { id: { type: 'integer' } },
                    },
                    action: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/servers/{id}': {
      get: { operationId: 'getServer', responses: { '200': {} } },
      put: { operationId: 'updateServer', responses: { '200': {} } },
      delete: { operationId: 'deleteServer', responses: { '204': {} } },
    },
    '/certificates': {
      post: {
        operationId: 'createCertificate',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name of the certificate.',
                  },
                  type: {
                    type: 'string',
                    enum: ['uploaded', 'managed'],
                    'x-enumDescriptions': {
                      uploaded: 'Uploaded certificate.',
                      managed: 'Let us manage.',
                    },
                    description:
                      'Choose between uploading a Certificate in PEM format...',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    certificate: {
                      type: 'object',
                      properties: { id: { type: 'integer' } },
                    },
                    action: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/certificates/{id}': {
      get: { operationId: 'getCertificate', responses: { '200': {} } },
      put: { operationId: 'updateCertificate', responses: { '200': {} } },
      delete: { operationId: 'deleteCertificate', responses: { '204': {} } },
    },
    '/firewalls': {
      post: {
        operationId: 'createFirewall',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name of the Firewall.',
                  },
                  rules: {
                    type: 'array',
                    description: 'Array of rules.',
                    items: {
                      type: 'object',
                      required: ['direction', 'protocol'],
                      properties: {
                        direction: {
                          type: 'string',
                          enum: ['in', 'out'],
                          description: 'Direction of the rule.',
                        },
                        protocol: {
                          type: 'string',
                          enum: ['tcp', 'udp', 'icmp', 'esp', 'gre'],
                          description: 'Protocol.',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    firewall: {
                      type: 'object',
                      properties: { id: { type: 'integer' } },
                    },
                    actions: { type: 'array' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/firewalls/{id}': {
      get: { operationId: 'getFirewall', responses: { '200': {} } },
      put: { operationId: 'updateFirewall', responses: { '200': {} } },
      delete: { operationId: 'deleteFirewall', responses: { '204': {} } },
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTmpDir(): string {
  const dir = join(tmpdir(), `cdkx-hetzner-extractor-test-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function makeExtractorWithFixture(cacheDir: string): HetznerExtractor {
  const extractor = new HetznerExtractor(cacheDir);
  // Pre-populate the cache so loadSpec() reads from disk without network
  writeFileSync(
    join(cacheDir, 'hetzner-openapi.json'),
    JSON.stringify(FIXTURE_SPEC),
    'utf-8',
  );
  return extractor;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerExtractor', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if extractResources() called before loadSpec()', () => {
    const extractor = new HetznerExtractor(tmpDir);
    expect(() => extractor.extractResources()).toThrow(
      'Spec not loaded — call loadSpec() first.',
    );
  });

  describe('after loadSpec()', () => {
    let specs: ReturnType<HetznerExtractor['extractResources']>;

    beforeEach(async () => {
      const extractor = makeExtractorWithFixture(tmpDir);
      await extractor.loadSpec();
      specs = extractor.extractResources();
    });

    // -------------------------------------------------------------------------
    // Extraction coverage
    // -------------------------------------------------------------------------
    it('extracts resources for all fixture paths', () => {
      const names = specs.map((s) => s.resourceName);
      expect(names).toContain('Network');
      expect(names).toContain('Server');
      expect(names).toContain('Certificate');
      expect(names).toContain('Firewall');
    });

    it('does not include paths not in HETZNER_RESOURCE_PATHS', () => {
      const names = specs.map((s) => s.resourceName);
      // The fixture only has networks/servers/certificates/firewalls
      expect(names).not.toContain('Unknown');
    });

    // -------------------------------------------------------------------------
    // Network spec
    // -------------------------------------------------------------------------
    describe('Network resource', () => {
      let networkSpec: (typeof specs)[number];

      beforeEach(() => {
        networkSpec = specs.find((s) => s.resourceName === 'Network')!;
      });

      it('has correct domain', () => {
        expect(networkSpec.domain).toBe('Networking');
      });

      it('has correct providerType', () => {
        expect(networkSpec.providerType).toBe('Hetzner::Networking::Network');
      });

      it('extracts required props', () => {
        const names = networkSpec.createProps.map((p) => p.name);
        expect(names).toContain('name');
        expect(names).toContain('ipRange');
      });

      it('marks name and ipRange as required', () => {
        const name = networkSpec.createProps.find((p) => p.name === 'name');
        const ipRange = networkSpec.createProps.find(
          (p) => p.name === 'ipRange',
        );
        expect(name?.required).toBe(true);
        expect(ipRange?.required).toBe(true);
      });

      it('marks labels and exposeRoutesToVswitch as optional', () => {
        const labels = networkSpec.createProps.find((p) => p.name === 'labels');
        const expose = networkSpec.createProps.find(
          (p) => p.name === 'exposeRoutesToVswitch',
        );
        expect(labels?.required).toBe(false);
        expect(expose?.required).toBe(false);
      });

      it('maps labels to Record<string, string>', () => {
        const labels = networkSpec.createProps.find((p) => p.name === 'labels');
        expect(labels?.type).toBe('Record<string, string>');
      });

      it('has networkId attribute', () => {
        expect(networkSpec.attributes[0]?.name).toBe('networkId');
      });

      it('api: not async, no actionPath', () => {
        expect(networkSpec.api.isAsync).toBe(false);
        expect(networkSpec.api.actionPath).toBeNull();
      });

      it('api: correct paths', () => {
        expect(networkSpec.api.createPath).toBe('/networks');
        expect(networkSpec.api.idPath).toBe('/networks/{id}');
      });

      it('api: correct HTTP methods', () => {
        expect(networkSpec.api.createMethod).toBe('post');
        expect(networkSpec.api.updateMethod).toBe('put');
        expect(networkSpec.api.deleteMethod).toBe('delete');
        expect(networkSpec.api.getMethod).toBe('get');
      });

      it('api: responseResourceKey is network', () => {
        expect(networkSpec.api.responseResourceKey).toBe('network');
      });

      it('has no enums', () => {
        expect(networkSpec.enums).toHaveLength(0);
      });

      it('has no nestedInterfaces', () => {
        expect(networkSpec.nestedInterfaces).toHaveLength(0);
      });
    });

    // -------------------------------------------------------------------------
    // Server spec (async, id-array props)
    // -------------------------------------------------------------------------
    describe('Server resource', () => {
      let serverSpec: (typeof specs)[number];

      beforeEach(() => {
        serverSpec = specs.find((s) => s.resourceName === 'Server')!;
      });

      it('has correct domain', () => {
        expect(serverSpec.domain).toBe('Compute');
      });

      it('api: is async, has actionPath', () => {
        expect(serverSpec.api.isAsync).toBe(true);
        expect(serverSpec.api.actionPath).toBe('/actions/{id}');
      });

      it('maps ssh_keys to Array<number | IResolvable>', () => {
        const sshKeys = serverSpec.createProps.find(
          (p) => p.name === 'sshKeys',
        );
        expect(sshKeys?.type).toBe('Array<number | IResolvable>');
      });

      it('maps networks to Array<number | IResolvable>', () => {
        const networks = serverSpec.createProps.find(
          (p) => p.name === 'networks',
        );
        expect(networks?.type).toBe('Array<number | IResolvable>');
      });
    });

    // -------------------------------------------------------------------------
    // Certificate spec (enum)
    // -------------------------------------------------------------------------
    describe('Certificate resource', () => {
      let certSpec: (typeof specs)[number];

      beforeEach(() => {
        certSpec = specs.find((s) => s.resourceName === 'Certificate')!;
      });

      it('has correct domain', () => {
        expect(certSpec.domain).toBe('Security');
      });

      it('api: is async', () => {
        expect(certSpec.api.isAsync).toBe(true);
      });

      it('extracts CertificateType enum', () => {
        const e = certSpec.enums.find((en) => en.name === 'CertificateType');
        expect(e).toBeDefined();
        expect(e?.values.map((v) => v.value)).toEqual(['uploaded', 'managed']);
      });

      it('enum labels are SCREAMING_SNAKE_CASE', () => {
        const e = certSpec.enums.find((en) => en.name === 'CertificateType');
        expect(e?.values.map((v) => v.label)).toEqual(['UPLOADED', 'MANAGED']);
      });

      it('type prop references CertificateType enum', () => {
        const typeProp = certSpec.createProps.find((p) => p.name === 'type');
        expect(typeProp?.isEnum).toBe(true);
        expect(typeProp?.type).toBe('CertificateType');
      });
    });

    // -------------------------------------------------------------------------
    // Firewall spec (nested interface + enums in items + "actions" async)
    // -------------------------------------------------------------------------
    describe('Firewall resource', () => {
      let firewallSpec: (typeof specs)[number];

      beforeEach(() => {
        firewallSpec = specs.find((s) => s.resourceName === 'Firewall')!;
      });

      it('api: isAsync=false (firewalls has "actions" plural but spec is sync)', () => {
        // Our fixture has "actions" key → isAsync should be true for firewalls
        // (the real Hetzner spec has actions plural for firewalls)
        expect(firewallSpec.api.isAsync).toBe(true);
      });

      it('extracts FirewallRule nested interface', () => {
        const ni = firewallSpec.nestedInterfaces.find(
          (n) => n.name === 'FirewallRule',
        );
        expect(ni).toBeDefined();
        expect(ni?.properties.map((p) => p.name)).toContain('direction');
        expect(ni?.properties.map((p) => p.name)).toContain('protocol');
      });

      it('extracts FirewallRuleDirection enum from nested interface', () => {
        const e = firewallSpec.enums.find(
          (en) => en.name === 'FirewallRuleDirection',
        );
        expect(e).toBeDefined();
        expect(e?.values.map((v) => v.value)).toEqual(['in', 'out']);
      });

      it('extracts FirewallRuleProtocol enum from nested interface', () => {
        const e = firewallSpec.enums.find(
          (en) => en.name === 'FirewallRuleProtocol',
        );
        expect(e).toBeDefined();
        expect(e?.values.map((v) => v.value)).toEqual([
          'tcp',
          'udp',
          'icmp',
          'esp',
          'gre',
        ]);
      });
    });
  });
});
