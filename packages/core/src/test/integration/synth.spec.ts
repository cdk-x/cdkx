/**
 * Integration test: full synthesis pipeline.
 *
 * This test exercises the entire system end-to-end:
 *   App → Stack → ProviderResource → toJson() → JsonSynthesizer → disk files
 *
 * Each test creates a fresh outdir under /tmp so tests are isolated and repeatable.
 *
 * Output format (since logical-ID hashing was introduced):
 *   Stack JSON is a keyed object { [logicalId]: { type, properties, metadata } }
 *   instead of a plain array.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { App } from '../../lib/app/app.js';
import { Stack } from '../../lib/stack/stack.js';
import { ProviderResource } from '../../lib/provider-resource/provider-resource.js';
import { Lazy } from '../../lib/resolvables/lazy.js';
import { IResolvable, ResolveContext, IResolver, ResolutionContext } from '../../lib/resolvables/resolvables.js';
import { MANIFEST_VERSION } from '../../lib/assembly/cloud-assembly.js';
import { Resource } from '../../lib/resource/resource.js';
import { ResourceAttribute } from '../../lib/resource/resource-attribute.js';
import { TestProvider } from '../helpers/index.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-integration-'));
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/** Helper: get all resource entries from a keyed stack JSON object. */
function resourceValues(json: unknown): Array<{ type: string; properties: Record<string, unknown> }> {
  return Object.values(json as Record<string, unknown>) as Array<{
    type: string;
    properties: Record<string, unknown>;
  }>;
}

afterEach(() => {
  // Nothing to clean up globally — each test cleans its own outdir
});

// ---------------------------------------------------------------------------
// 1. Basic single-stack synthesis
// ---------------------------------------------------------------------------
describe('Single stack — basic synthesis', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('writes the stack JSON file to disk', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'MyStack', { provider: new TestProvider() });
    new ProviderResource(stack, 'Server', {
      type: 'hetzner::Server',
      properties: { name: 'web-01', serverType: 'cx21' },
    });

    app.synth();

    expect(fs.existsSync(path.join(outdir, 'MyStack.json'))).toBe(true);
  });

  it('stack JSON contains the correct resource shape', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'MyStack', { provider: new TestProvider() });
    const server = new ProviderResource(stack, 'Server', {
      type: 'hetzner::Server',
      properties: { name: 'web-01', serverType: 'cx21' },
    });

    app.synth();

    const content = readJson(path.join(outdir, 'MyStack.json')) as Record<string, unknown>;
    // Output is a keyed object — one key per resource (the logical ID)
    expect(Object.keys(content)).toHaveLength(1);
    const entry = content[server.logicalId] as { type: string; properties: Record<string, unknown> };
    expect(entry.type).toBe('hetzner::Server');
    expect(entry.properties).toEqual({ name: 'web-01', serverType: 'cx21' });
  });

  it('writes manifest.json to disk', () => {
    const app = new App({ outdir });
    new Stack(app, 'MyStack', { provider: new TestProvider() });
    app.synth();

    expect(fs.existsSync(path.join(outdir, 'manifest.json'))).toBe(true);
  });

  it('manifest.json has the correct version and stack entry', () => {
    const app = new App({ outdir });
    new Stack(app, 'MyStack', { provider: new TestProvider('hetzner') });
    app.synth();

    const manifest = readJson(path.join(outdir, 'manifest.json')) as {
      version: string;
      artifacts: Record<
        string,
        {
          type: string;
          provider: string;
          environment: Record<string, unknown>;
          properties: { templateFile: string };
          displayName?: string;
        }
      >;
    };

    expect(manifest.version).toBe(MANIFEST_VERSION);
    expect(Object.keys(manifest.artifacts)).toHaveLength(1);
    expect(manifest.artifacts['MyStack']).toEqual({
      type: 'cdkx:stack',
      provider: 'hetzner',
      environment: {},
      properties: { templateFile: 'MyStack.json' },
      displayName: 'MyStack',
    });
  });

  it('empty stack produces an empty resources object', () => {
    const app = new App({ outdir });
    new Stack(app, 'Empty', { provider: new TestProvider() });
    app.synth();

    const content = readJson(path.join(outdir, 'Empty.json'));
    expect(content).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// 2. Multiple stacks
// ---------------------------------------------------------------------------
describe('Multiple stacks', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('writes a separate JSON file for each stack', () => {
    const app = new App({ outdir });
    const s1 = new Stack(app, 'StackA', { provider: new TestProvider() });
    const s2 = new Stack(app, 'StackB', { provider: new TestProvider() });
    new ProviderResource(s1, 'R1', { type: 'T', properties: { stack: 'a' } });
    new ProviderResource(s2, 'R2', { type: 'T', properties: { stack: 'b' } });
    app.synth();

    expect(fs.existsSync(path.join(outdir, 'StackA.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'StackB.json'))).toBe(true);
  });

  it('manifest lists all stacks', () => {
    const app = new App({ outdir });
    new Stack(app, 'StackA', { provider: new TestProvider() });
    new Stack(app, 'StackB', { provider: new TestProvider() });
    app.synth();

    const manifest = readJson(path.join(outdir, 'manifest.json')) as { artifacts: Record<string, unknown> };
    const ids = Object.keys(manifest.artifacts).sort();
    expect(ids).toEqual(['StackA', 'StackB']);
  });

  it('each stack file contains only its own resources', () => {
    const app = new App({ outdir });
    const s1 = new Stack(app, 'StackA', { provider: new TestProvider() });
    const s2 = new Stack(app, 'StackB', { provider: new TestProvider() });
    new ProviderResource(s1, 'Res', { type: 'T', properties: { owner: 'stack-a' } });
    new ProviderResource(s2, 'Res', { type: 'T', properties: { owner: 'stack-b' } });
    app.synth();

    const a = resourceValues(readJson(path.join(outdir, 'StackA.json')));
    const b = resourceValues(readJson(path.join(outdir, 'StackB.json')));
    expect(a[0].properties['owner']).toBe('stack-a');
    expect(b[0].properties['owner']).toBe('stack-b');
  });
});

// ---------------------------------------------------------------------------
// 3. Token resolution — Lazy
// ---------------------------------------------------------------------------
describe('Lazy token resolution', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('resolves a Lazy value at synthesis time', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'S', { provider: new TestProvider() });

    let computed = false;
    new ProviderResource(stack, 'R', {
      type: 'T',
      properties: {
        replicas: Lazy.any({
          produce: () => {
            computed = true;
            return 3;
          },
        }),
      },
    });

    // NOT called yet
    expect(computed).toBe(false);

    app.synth();

    expect(computed).toBe(true);
    const content = resourceValues(readJson(path.join(outdir, 'S.json')));
    expect(content[0].properties['replicas']).toBe(3);
  });

  it('resolves a Lazy that references a value set after construction', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'S', { provider: new TestProvider() });

    let lateValue = 0;
    new ProviderResource(stack, 'R', {
      type: 'T',
      properties: { count: Lazy.any({ produce: () => lateValue }) },
    });

    // Set the value AFTER resource construction — before synth
    lateValue = 42;

    app.synth();

    const content = resourceValues(readJson(path.join(outdir, 'S.json')));
    expect(content[0].properties['count']).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// 4. Token resolution — IResolvable
// ---------------------------------------------------------------------------
describe('IResolvable token resolution', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('resolves an IResolvable token via ImplicitTokenResolver', () => {
    class SecretRef implements IResolvable {
      constructor(private readonly name: string) {}
      resolve(_ctx: ResolveContext): unknown {
        return { secretKeyRef: { name: this.name, key: 'value' } };
      }
    }

    const app = new App({ outdir });
    const stack = new Stack(app, 'S', { provider: new TestProvider() });
    new ProviderResource(stack, 'R', {
      type: 'T',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: { password: new SecretRef('my-secret') as any },
    });

    app.synth();

    const content = resourceValues(readJson(path.join(outdir, 'S.json')));
    expect(content[0].properties['password']).toEqual({ secretKeyRef: { name: 'my-secret', key: 'value' } });
  });

  it('resolves a Lazy → IResolvable chain', () => {
    class NameToken implements IResolvable {
      resolve(_ctx: ResolveContext): unknown {
        return 'resolved-name';
      }
    }

    const app = new App({ outdir });
    const stack = new Stack(app, 'S', { provider: new TestProvider() });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lazy = Lazy.any({ produce: () => new NameToken() as any });
    new ProviderResource(stack, 'R', {
      type: 'T',
      properties: { name: lazy },
    });

    app.synth();

    const content = resourceValues(readJson(path.join(outdir, 'S.json')));
    expect(content[0].properties['name']).toBe('resolved-name');
  });

  it('provides the correct provider identifier to IResolvable.resolve()', () => {
    let capturedProvider: string | undefined;
    class ProviderSpyToken implements IResolvable {
      resolve(ctx: ResolveContext): unknown {
        capturedProvider = ctx.provider;
        return 'x';
      }
    }

    const app = new App({ outdir });
    const stack = new Stack(app, 'S', { provider: new TestProvider('kubernetes') });
    new ProviderResource(stack, 'R', {
      type: 'T',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: { x: new ProviderSpyToken() as any },
    });

    app.synth();

    expect(capturedProvider).toBe('kubernetes');
  });
});

// ---------------------------------------------------------------------------
// 5. Null / undefined stripping
// ---------------------------------------------------------------------------
describe('Null and undefined stripping during synthesis', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('strips null property values from the output', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'S', { provider: new TestProvider() });
    new ProviderResource(stack, 'R', {
      type: 'T',
      properties: { name: 'hello', optional: null },
    });
    app.synth();

    const content = resourceValues(readJson(path.join(outdir, 'S.json')));
    expect(content[0].properties).not.toHaveProperty('optional');
    expect(content[0].properties['name']).toBe('hello');
  });
});

// ---------------------------------------------------------------------------
// 6. Unresolved token detection
// ---------------------------------------------------------------------------
describe('Unresolved token detection', () => {
  it('throws during synthesis when a class instance survives resolution', () => {
    const outdir = tmpDir();
    try {
      class UnresolvedToken {
        // Does NOT implement IResolvable — no resolve() method
        public value = 'oops';
      }

      const app = new App({ outdir });
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      new ProviderResource(stack, 'R', {
        type: 'T',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties: { bad: new UnresolvedToken() as any },
      });

      expect(() => app.synth()).toThrow("Unresolved token of type 'UnresolvedToken' found during synthesis");
    } finally {
      if (fs.existsSync(outdir)) fs.rmSync(outdir, { recursive: true });
    }
  });
});

// ---------------------------------------------------------------------------
// 7. Custom global resolver
// ---------------------------------------------------------------------------
describe('Custom global resolver', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('intercepts matching values in all stacks via app-level resolver', () => {
    // Replace any string matching '{{env:NAME}}' with 'prod'
    const envResolver: IResolver = {
      resolve(ctx: ResolutionContext) {
        if (typeof ctx.value === 'string' && ctx.value.startsWith('{{env:')) {
          ctx.replaceValue('prod');
        }
      },
    };

    const app = new App({ outdir, resolvers: [envResolver] });
    const s1 = new Stack(app, 'S1', { provider: new TestProvider() });
    const s2 = new Stack(app, 'S2', { provider: new TestProvider() });
    new ProviderResource(s1, 'R', { type: 'T', properties: { env: '{{env:NODE_ENV}}' } });
    new ProviderResource(s2, 'R', { type: 'T', properties: { env: '{{env:STAGE}}' } });
    app.synth();

    const c1 = resourceValues(readJson(path.join(outdir, 'S1.json')));
    const c2 = resourceValues(readJson(path.join(outdir, 'S2.json')));
    expect(c1[0].properties['env']).toBe('prod');
    expect(c2[0].properties['env']).toBe('prod');
  });
});

// ---------------------------------------------------------------------------
// 8. Visual synth output — written to .cdkx.out/ at workspace root
//    Exercises cross-resource references (ResourceAttribute → hashed logicalId),
//    Lazy values, IResolvable tokens, null stripping, and a custom IResolver —
//    all in one realistic multi-stack scenario.
// ---------------------------------------------------------------------------
describe('Visual synth output', () => {
  // Minimal L2 constructs defined once for the whole suite.
  // Convention: always set this.node.defaultChild = l1 so that
  // ResourceAttribute.resolve() can find the L1's logicalId.

  // HetznerServer — L2 that exposes a `serverId` cross-reference token
  class HetznerServer extends Resource {
    public readonly l1: ProviderResource;

    constructor(scope: Stack, id: string, props: { name: string; serverType: string; location: string }) {
      super(scope, id);
      this.l1 = new ProviderResource(this, 'Resource', {
        type: 'hetzner::Server',
        properties: {
          name: props.name,
          serverType: props.serverType,
          location: props.location,
        },
      });
      this.node.defaultChild = this.l1;
    }

    /** Cross-reference token: resolves to { ref: "<l1.logicalId>", attr: "id" } */
    get serverId(): ResourceAttribute {
      return new ResourceAttribute(this, 'id');
    }
  }

  // HetznerFloatingIp — L2 that can reference a server via ResourceAttribute
  class HetznerFloatingIp extends Resource {
    constructor(
      scope: Stack,
      id: string,
      props: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        description: any; // accepts Lazy, plain string, or any token
        homeLocation: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serverId?: any; // accepts a ResourceAttribute token
      },
    ) {
      super(scope, id);
      const l1 = new ProviderResource(this, 'Resource', {
        type: 'hetzner::FloatingIp',
        properties: {
          description: props.description,
          type: 'ipv4',
          homeLocation: props.homeLocation,
          ...(props.serverId !== undefined ? { serverId: props.serverId } : {}),
          optionalTag: null, // always stripped
        },
      });
      this.node.defaultChild = l1;
    }
  }

  // KubernetesDeployment — L2 exposing a `deploymentRef` cross-reference token
  class KubernetesDeployment extends Resource {
    private replicaCount = 1;
    public readonly l1: ProviderResource;

    constructor(scope: Stack, id: string, props: { name: string; image: string }) {
      super(scope, id);
      this.l1 = new ProviderResource(this, 'Resource', {
        type: 'kubernetes::Deployment',
        properties: {
          name: props.name,
          namespace: 'default',
          // Lazy: captures `this.replicaCount` — caller can update it before synth
          replicas: Lazy.any({ produce: () => this.replicaCount }),
          image: props.image,
        },
      });
      this.node.defaultChild = this.l1;
    }

    setReplicas(n: number) {
      this.replicaCount = n;
    }

    /** Cross-reference token: resolves to { ref: "<l1.logicalId>", attr: "name" } */
    get deploymentRef(): ResourceAttribute {
      return new ResourceAttribute(this, 'name');
    }
  }

  // KubernetesService — references the deployment by name via ResourceAttribute
  class KubernetesService extends Resource {
    constructor(
      scope: Stack,
      id: string,
      props: {
        name: string;
        port: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetDeployment?: any;
      },
    ) {
      super(scope, id);
      const l1 = new ProviderResource(this, 'Resource', {
        type: 'kubernetes::Service',
        properties: {
          name: props.name,
          namespace: 'default',
          type: 'ClusterIP',
          port: props.port,
          ...(props.targetDeployment !== undefined ? { targetDeployment: props.targetDeployment } : {}),
        },
      });
      this.node.defaultChild = l1;
    }
  }

  it('produces a realistic multi-stack output with cross-resource references in .cdkx.out/', () => {
    // Resolve workspace root: this file is 5 levels deep from root
    // packages/core/src/test/integration/synth.spec.ts
    const outdir = path.resolve(__dirname, '../../../../../.cdkx.out');

    // Custom resolver: rewrites '{{env:*}}' placeholders — applied to all stacks
    const envResolver: IResolver = {
      resolve(ctx: ResolutionContext) {
        if (typeof ctx.value === 'string' && ctx.value.startsWith('{{env:') && ctx.value.endsWith('}}')) {
          const varName = ctx.value.slice(6, -2);
          ctx.replaceValue(process.env[varName] ?? `<${varName}>`);
        }
      },
    };

    const app = new App({ outdir, resolvers: [envResolver] });

    // ── Hetzner stack ───────────────────────────────────────────────────────
    const hetzner = new Stack(app, 'HetznerStack', { provider: new TestProvider('hetzner') });

    const webServer = new HetznerServer(hetzner, 'WebServer', {
      name: 'web-01',
      serverType: 'cx21',
      location: 'nbg1',
    });

    // FloatingIp references WebServer.serverId — a ResourceAttribute cross-ref
    new HetznerFloatingIp(hetzner, 'FloatingIp', {
      description: Lazy.any({ produce: () => 'floating-ip-for-web-01' }),
      homeLocation: 'nbg1',
      serverId: webServer.serverId, // ← cross-reference token
    });

    new ProviderResource(hetzner, 'Firewall', {
      type: 'hetzner::Firewall',
      properties: {
        name: 'web-firewall',
        // env resolver will expand this at synthesis time
        region: '{{env:HETZNER_REGION}}',
        rules: [
          { direction: 'in', protocol: 'tcp', port: '80', sourceIps: ['0.0.0.0/0'] },
          { direction: 'in', protocol: 'tcp', port: '443', sourceIps: ['0.0.0.0/0'] },
        ],
      },
    });

    // ── Kubernetes stack ────────────────────────────────────────────────────
    const kubernetes = new Stack(app, 'KubernetesStack', { provider: new TestProvider('kubernetes') });

    const deployment = new KubernetesDeployment(kubernetes, 'WebDeployment', {
      name: 'web',
      image: 'nginx:1.25',
    });
    // Set replica count AFTER construction — Lazy captures it at synth time
    deployment.setReplicas(3);

    // Service references the deployment by name via ResourceAttribute
    new KubernetesService(kubernetes, 'WebService', {
      name: 'web-svc',
      port: 80,
      targetDeployment: deployment.deploymentRef, // ← cross-reference token
    });

    app.synth();

    // ── Assertions ──────────────────────────────────────────────────────────
    // Files exist
    expect(fs.existsSync(path.join(outdir, 'HetznerStack.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'KubernetesStack.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'manifest.json'))).toBe(true);

    // Manifest lists both stacks
    const manifest = JSON.parse(fs.readFileSync(path.join(outdir, 'manifest.json'), 'utf-8')) as {
      artifacts: Record<string, unknown>;
    };
    expect(Object.keys(manifest.artifacts).sort()).toEqual(['HetznerStack', 'KubernetesStack']);

    // Hetzner stack — keyed object
    type ResourceEntry = { type: string; properties: Record<string, unknown>; metadata: Record<string, unknown> };
    const hetznerOut = JSON.parse(fs.readFileSync(path.join(outdir, 'HetznerStack.json'), 'utf-8')) as Record<
      string,
      ResourceEntry
    >;

    // WebServer entry is keyed by its hashed logicalId
    const webServerEntry = hetznerOut[webServer.l1.logicalId];
    expect(webServerEntry).toBeDefined();
    expect(webServerEntry.type).toBe('hetzner::Server');
    expect(webServerEntry.metadata['cdkx:path']).toBe('HetznerStack/WebServer/Resource');

    // FloatingIp.serverId cross-ref points to the WebServer L1's logicalId
    const floatingIpEntry = Object.values(hetznerOut).find((r) => r.type === 'hetzner::FloatingIp');
    expect(floatingIpEntry).toBeDefined();
    expect(floatingIpEntry?.properties['serverId']).toEqual({
      ref: webServer.l1.logicalId, // ← hashed logical ID of the L1
      attr: 'id',
    });
    // null optionalTag was stripped
    expect(floatingIpEntry?.properties).not.toHaveProperty('optionalTag');
    // Lazy description resolved
    expect(floatingIpEntry?.properties['description']).toBe('floating-ip-for-web-01');

    // env resolver expanded the placeholder (no HETZNER_REGION env in CI → fallback)
    const firewallEntry = Object.values(hetznerOut).find((r) => r.type === 'hetzner::Firewall');
    expect(firewallEntry).toBeDefined();
    expect(typeof firewallEntry?.properties['region']).toBe('string');
    expect(firewallEntry?.properties['region']).not.toContain('{{env:');

    // Kubernetes stack
    const k8sOut = JSON.parse(fs.readFileSync(path.join(outdir, 'KubernetesStack.json'), 'utf-8')) as Record<
      string,
      ResourceEntry
    >;

    // Deployment entry — Lazy replicas resolved to the post-construction value
    const depEntry = k8sOut[deployment.l1.logicalId];
    expect(depEntry).toBeDefined();
    expect(depEntry.properties['replicas']).toBe(3);
    expect(depEntry.metadata['cdkx:path']).toBe('KubernetesStack/WebDeployment/Resource');

    // Service.targetDeployment cross-ref points to Deployment L1's logicalId
    const svcEntry = Object.values(k8sOut).find((r) => r.type === 'kubernetes::Service');
    expect(svcEntry).toBeDefined();
    expect(svcEntry?.properties['targetDeployment']).toEqual({
      ref: deployment.l1.logicalId, // ← hashed logical ID of the L1
      attr: 'name',
    });
  });
});
