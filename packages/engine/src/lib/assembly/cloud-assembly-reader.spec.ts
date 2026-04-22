import { CloudAssemblyReader } from './cloud-assembly-reader';
import type { AssemblyAsset, AssemblyStack } from './assembly-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MANIFEST_VERSION = '1.0.0';

function makeManifest(
  artifacts: Record<
    string,
    {
      templateFile: string;
      displayName?: string;
      outputKeys?: string[];
      dependencies?: string[];
    }
  >,
): string {
  const full: Record<
    string,
    {
      type: string;
      properties: { templateFile: string };
      displayName?: string;
      outputKeys?: string[];
      dependencies?: string[];
    }
  > = {};
  for (const [id, a] of Object.entries(artifacts)) {
    full[id] = {
      type: 'cdkx:stack',
      properties: { templateFile: a.templateFile },
      ...(a.displayName !== undefined ? { displayName: a.displayName } : {}),
      ...(a.outputKeys !== undefined ? { outputKeys: a.outputKeys } : {}),
      ...(a.dependencies !== undefined ? { dependencies: a.dependencies } : {}),
    };
  }
  return JSON.stringify(
    { version: MANIFEST_VERSION, artifacts: full },
    null,
    2,
  );
}

function makeTemplate(
  resources?: Record<
    string,
    {
      type: string;
      properties?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      dependsOn?: string[];
    }
  >,
  outputs?: Record<string, { value: unknown; description?: string }>,
): string {
  const tpl: {
    resources?: typeof resources;
    outputs?: typeof outputs;
  } = {};
  if (resources !== undefined) tpl.resources = resources;
  if (outputs !== undefined) tpl.outputs = outputs;
  return JSON.stringify(tpl, null, 2);
}

/** Minimal injectable deps helper. */
function makeDeps(files: Record<string, string>) {
  return {
    fileExists: (p: string) => p in files,
    readFile: (p: string) => {
      const content = files[p];
      if (content === undefined) throw new Error(`File not found: ${p}`);
      return content;
    },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CloudAssemblyReader', () => {
  const OUTDIR = '/fake/cdkx.out';

  describe('read()', () => {
    describe('manifest validation', () => {
      it('throws when manifest.json is not found', () => {
        const reader = new CloudAssemblyReader(OUTDIR, makeDeps({}));
        expect(() => reader.read()).toThrow(/manifest not found/i);
      });

      it('throws when manifest.json contains invalid JSON', () => {
        const reader = new CloudAssemblyReader(
          OUTDIR,
          makeDeps({ [`${OUTDIR}/manifest.json`]: 'not json {' }),
        );
        expect(() => reader.read()).toThrow(/failed to parse manifest\.json/i);
      });
    });

    describe('template validation', () => {
      it('throws when a stack template file is missing', () => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            MyStack: { templateFile: 'MyStack.json' },
          }),
        };
        const reader = new CloudAssemblyReader(OUTDIR, makeDeps(files));
        expect(() => reader.read()).toThrow(/MyStack\.json.*not found/i);
      });

      it('throws when a stack template contains invalid JSON', () => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            MyStack: { templateFile: 'MyStack.json' },
          }),
          [`${OUTDIR}/MyStack.json`]: 'not json {',
        };
        const reader = new CloudAssemblyReader(OUTDIR, makeDeps(files));
        expect(() => reader.read()).toThrow(/failed to parse stack template/i);
      });
    });

    describe('single stack with no resources or outputs', () => {
      let stacks: AssemblyStack[];

      beforeAll(() => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            EmptyStack: {
              templateFile: 'EmptyStack.json',
              displayName: 'EmptyStack',
            },
          }),
          [`${OUTDIR}/EmptyStack.json`]: makeTemplate(),
        };
        stacks = new CloudAssemblyReader(OUTDIR, makeDeps(files)).read();
      });

      it('returns exactly one stack', () => {
        expect(stacks).toHaveLength(1);
      });

      it('populates stack id correctly', () => {
        expect(stacks[0].id).toBe('EmptyStack');
      });

      it('populates templateFile correctly', () => {
        expect(stacks[0].templateFile).toBe('EmptyStack.json');
      });

      it('populates displayName correctly', () => {
        expect(stacks[0].displayName).toBe('EmptyStack');
      });

      it('returns empty resources array', () => {
        expect(stacks[0].resources).toEqual([]);
      });

      it('returns empty outputs object', () => {
        expect(stacks[0].outputs).toEqual({});
      });

      it('returns empty outputKeys array', () => {
        expect(stacks[0].outputKeys).toEqual([]);
      });

      it('returns empty dependencies array', () => {
        expect(stacks[0].dependencies).toEqual([]);
      });
    });

    describe('stack with resources', () => {
      let stacks: AssemblyStack[];

      beforeAll(() => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            MyStack: { templateFile: 'MyStack.json' },
          }),
          [`${OUTDIR}/MyStack.json`]: makeTemplate(
            {
              MyStackServerA1B2C3D4: {
                type: 'Hetzner::Compute::Server',
                properties: { name: 'web', serverType: 'cx21' },
                metadata: { 'cdkx:path': 'MyStack/Server' },
              },
              MyStackNetworkB5C6D7E8: {
                type: 'Hetzner::Networking::Network',
                properties: { name: 'my-net', ipRange: '10.0.0.0/8' },
              },
            },
            undefined,
          ),
        };
        stacks = new CloudAssemblyReader(OUTDIR, makeDeps(files)).read();
      });

      it('returns two resources', () => {
        expect(stacks[0].resources).toHaveLength(2);
      });

      it('parses first resource logicalId', () => {
        expect(stacks[0].resources[0].logicalId).toBe('MyStackServerA1B2C3D4');
      });

      it('parses first resource type', () => {
        expect(stacks[0].resources[0].type).toBe('Hetzner::Compute::Server');
      });

      it('parses first resource properties', () => {
        expect(stacks[0].resources[0].properties).toEqual({
          name: 'web',
          serverType: 'cx21',
        });
      });

      it('parses first resource metadata', () => {
        expect(stacks[0].resources[0].metadata).toEqual({
          'cdkx:path': 'MyStack/Server',
        });
      });

      it('omits metadata when not present', () => {
        expect(stacks[0].resources[1].metadata).toBeUndefined();
      });
    });

    describe('stack with outputs', () => {
      let stacks: AssemblyStack[];

      beforeAll(() => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            MyStack: {
              templateFile: 'MyStack.json',
              outputKeys: ['ServerId', 'NetworkId'],
            },
          }),
          [`${OUTDIR}/MyStack.json`]: makeTemplate(undefined, {
            ServerId: { value: 'srv-123', description: 'The server ID' },
            NetworkId: { value: 42 },
          }),
        };
        stacks = new CloudAssemblyReader(OUTDIR, makeDeps(files)).read();
      });

      it('populates outputKeys from manifest', () => {
        expect(stacks[0].outputKeys).toEqual(['ServerId', 'NetworkId']);
      });

      it('parses output with description', () => {
        expect(stacks[0].outputs['ServerId']).toEqual({
          value: 'srv-123',
          description: 'The server ID',
        });
      });

      it('parses output without description', () => {
        expect(stacks[0].outputs['NetworkId']).toEqual({ value: 42 });
      });
    });

    describe('resource dependsOn field', () => {
      let stacks: AssemblyStack[];

      beforeAll(() => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            MyStack: { templateFile: 'MyStack.json' },
          }),
          [`${OUTDIR}/MyStack.json`]: makeTemplate({
            ResA: {
              type: 'test::Resource',
              properties: {},
            },
            ResB: {
              type: 'test::Resource',
              properties: {},
              dependsOn: ['ResA'],
            },
            ResC: {
              type: 'test::Resource',
              properties: {},
            },
          }),
        };
        stacks = new CloudAssemblyReader(OUTDIR, makeDeps(files)).read();
      });

      it('parses dependsOn on a resource that has it', () => {
        const resB = stacks[0].resources.find((r) => r.logicalId === 'ResB');
        expect(resB).toBeDefined();
        if (!resB) return;
        expect(resB.dependsOn).toEqual(['ResA']);
      });

      it('omits dependsOn on a resource that does not have it', () => {
        const resA = stacks[0].resources.find((r) => r.logicalId === 'ResA');
        expect(resA).toBeDefined();
        if (!resA) return;
        expect(resA.dependsOn).toBeUndefined();
      });

      it('omits dependsOn on a resource with no dependsOn key', () => {
        const resC = stacks[0].resources.find((r) => r.logicalId === 'ResC');
        expect(resC).toBeDefined();
        if (!resC) return;
        expect(resC.dependsOn).toBeUndefined();
      });

      it('parses dependsOn with multiple entries', () => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            S: { templateFile: 'S.json' },
          }),
          [`${OUTDIR}/S.json`]: makeTemplate({
            X: { type: 'test::Resource', properties: {} },
            Y: { type: 'test::Resource', properties: {} },
            Z: {
              type: 'test::Resource',
              properties: {},
              dependsOn: ['X', 'Y'],
            },
          }),
        };
        const result = new CloudAssemblyReader(OUTDIR, makeDeps(files)).read();
        const z = result[0].resources.find((r) => r.logicalId === 'Z');
        expect(z?.dependsOn).toEqual(['X', 'Y']);
      });
    });

    describe('multiple stacks', () => {
      let stacks: AssemblyStack[];

      beforeAll(() => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            StackA: {
              templateFile: 'StackA.json',
              outputKeys: ['NetworkId'],
            },
            StackB: {
              templateFile: 'StackB.json',
            },
          }),
          [`${OUTDIR}/StackA.json`]: makeTemplate(
            {
              StackANetworkABCDEF01: {
                type: 'Hetzner::Networking::Network',
                properties: { name: 'app-net' },
              },
            },
            { NetworkId: { value: 'resolved-net-id' } },
          ),
          [`${OUTDIR}/StackB.json`]: makeTemplate({
            StackBServerXYZ12345: {
              type: 'Hetzner::Compute::Server',
              properties: { name: 'web', networkId: 'NetworkId' },
            },
          }),
        };
        stacks = new CloudAssemblyReader(OUTDIR, makeDeps(files)).read();
      });

      it('returns two stacks', () => {
        expect(stacks).toHaveLength(2);
      });

      it('StackA has no dependencies', () => {
        const a = stacks.find((s) => s.id === 'StackA');
        expect(a).toBeDefined();
        if (!a) return;
        expect(a.dependencies).toEqual([]);
      });

      it('StackB has no dependencies because none are declared in the manifest', () => {
        const b = stacks.find((s) => s.id === 'StackB');
        expect(b).toBeDefined();
        if (!b) return;
        expect(b.dependencies).toEqual([]);
      });
    });

    describe('cross-stack dependencies from manifest field', () => {
      let stacks: AssemblyStack[];

      beforeAll(() => {
        const files: Record<string, string> = {
          [`${OUTDIR}/manifest.json`]: makeManifest({
            NetworkStack: {
              templateFile: 'NetworkStack.json',
              outputKeys: ['NetworkId'],
            },
            ServerStack: {
              templateFile: 'ServerStack.json',
              dependencies: ['NetworkStack'],
            },
          }),
          [`${OUTDIR}/NetworkStack.json`]: makeTemplate(
            {
              NetABCDEF01: {
                type: 'Hetzner::Networking::Network',
                properties: { name: 'net' },
              },
            },
            { NetworkId: { value: { ref: 'NetABCDEF01', attr: 'id' } } },
          ),
          [`${OUTDIR}/ServerStack.json`]: makeTemplate({
            SrvXYZ12345: {
              type: 'Hetzner::Compute::Server',
              properties: {
                network_id: {
                  stackRef: 'NetworkStack',
                  outputKey: 'NetworkId',
                },
              },
            },
          }),
        };
        stacks = new CloudAssemblyReader(OUTDIR, makeDeps(files)).read();
      });

      it('NetworkStack has no dependencies', () => {
        const net = stacks.find((s) => s.id === 'NetworkStack');
        expect(net?.dependencies).toEqual([]);
      });

      it('ServerStack dependencies are read directly from the manifest field', () => {
        const srv = stacks.find((s) => s.id === 'ServerStack');
        expect(srv?.dependencies).toEqual(['NetworkStack']);
      });

      it('ServerStack resource properties contain the raw cross-stack token', () => {
        const srv = stacks.find((s) => s.id === 'ServerStack');
        const resource = srv?.resources.find(
          (r) => r.logicalId === 'SrvXYZ12345',
        );
        expect(resource?.properties['network_id']).toEqual({
          stackRef: 'NetworkStack',
          outputKey: 'NetworkId',
        });
      });
    });
  });

  describe('readAssets()', () => {
    it('returns an empty array when the manifest has no cdkx:asset artifacts', () => {
      const manifest = {
        version: MANIFEST_VERSION,
        artifacts: {
          MyStack: {
            type: 'cdkx:stack',
            properties: { templateFile: 'MyStack.json' },
          },
        },
      };
      const files: Record<string, string> = {
        [`${OUTDIR}/manifest.json`]: JSON.stringify(manifest),
        [`${OUTDIR}/MyStack.json`]: makeTemplate(),
      };

      const assets = new CloudAssemblyReader(
        OUTDIR,
        makeDeps(files),
      ).readAssets();

      expect(assets).toEqual([]);
    });

    it('returns AssemblyAsset entries for cdkx:asset artifacts with absolute paths', () => {
      const manifest = {
        version: MANIFEST_VERSION,
        artifacts: {
          'asset.abc123ef': {
            type: 'cdkx:asset',
            properties: {
              hash: 'abc123ef',
              path: 'assets/asset.abc123ef/cloud-init.yaml',
              packaging: 'file',
            },
          },
          MyStack: {
            type: 'cdkx:stack',
            properties: { templateFile: 'MyStack.json' },
          },
        },
      };
      const files: Record<string, string> = {
        [`${OUTDIR}/manifest.json`]: JSON.stringify(manifest),
        [`${OUTDIR}/MyStack.json`]: makeTemplate(),
      };

      const assets: AssemblyAsset[] = new CloudAssemblyReader(
        OUTDIR,
        makeDeps(files),
      ).readAssets();

      expect(assets).toHaveLength(1);
      expect(assets[0]).toEqual({
        id: 'asset.abc123ef',
        hash: 'abc123ef',
        absolutePath: `${OUTDIR}/assets/asset.abc123ef/cloud-init.yaml`,
        packaging: 'file',
      });
    });
  });

  describe('read() with mixed asset + stack artifacts', () => {
    it('ignores cdkx:asset artifacts — only returns stacks', () => {
      const manifest = {
        version: MANIFEST_VERSION,
        artifacts: {
          'asset.x': {
            type: 'cdkx:asset',
            properties: {
              hash: 'x',
              path: 'assets/asset.x/f.txt',
              packaging: 'file',
            },
          },
          MyStack: {
            type: 'cdkx:stack',
            properties: { templateFile: 'MyStack.json' },
          },
        },
      };
      const files: Record<string, string> = {
        [`${OUTDIR}/manifest.json`]: JSON.stringify(manifest),
        [`${OUTDIR}/MyStack.json`]: makeTemplate(),
      };

      const stacks = new CloudAssemblyReader(OUTDIR, makeDeps(files)).read();

      expect(stacks.map((s) => s.id)).toEqual(['MyStack']);
    });
  });
});
