/**
 * Integration test: full synthesis pipeline.
 *
 * This test exercises the entire system end-to-end:
 *   App → Stack → ProviderResource → toJson() → JsonSynthesizer → disk files
 *
 * Each test creates a fresh outdir under /tmp so tests are isolated and repeatable.
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
import { TestProvider } from '../helpers/index.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-integration-'));
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
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
    new ProviderResource(stack, 'Server', {
      type: 'hetzner::Server',
      properties: { name: 'web-01', serverType: 'cx21' },
    });

    app.synth();

    const content = readJson(path.join(outdir, 'MyStack.json')) as unknown[];
    expect(content).toEqual([
      {
        type: 'hetzner::Server',
        properties: { name: 'web-01', serverType: 'cx21' },
      },
    ]);
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
      stacks: Array<{ id: string; file: string; provider: string; displayName: string }>;
    };

    expect(manifest.version).toBe(MANIFEST_VERSION);
    expect(manifest.stacks).toHaveLength(1);
    expect(manifest.stacks[0]).toEqual({
      id: 'MyStack',
      file: 'MyStack.json',
      provider: 'hetzner',
      displayName: 'MyStack',
    });
  });

  it('empty stack produces an empty resources array', () => {
    const app = new App({ outdir });
    new Stack(app, 'Empty', { provider: new TestProvider() });
    app.synth();

    const content = readJson(path.join(outdir, 'Empty.json'));
    expect(content).toEqual([]);
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

    const manifest = readJson(path.join(outdir, 'manifest.json')) as { stacks: Array<{ id: string }> };
    const ids = manifest.stacks.map((s) => s.id).sort();
    expect(ids).toEqual(['StackA', 'StackB']);
  });

  it('each stack file contains only its own resources', () => {
    const app = new App({ outdir });
    const s1 = new Stack(app, 'StackA', { provider: new TestProvider() });
    const s2 = new Stack(app, 'StackB', { provider: new TestProvider() });
    new ProviderResource(s1, 'Res', { type: 'T', properties: { owner: 'stack-a' } });
    new ProviderResource(s2, 'Res', { type: 'T', properties: { owner: 'stack-b' } });
    app.synth();

    const a = readJson(path.join(outdir, 'StackA.json')) as Array<{ properties: { owner: string } }>;
    const b = readJson(path.join(outdir, 'StackB.json')) as Array<{ properties: { owner: string } }>;
    expect(a[0].properties.owner).toBe('stack-a');
    expect(b[0].properties.owner).toBe('stack-b');
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
    const content = readJson(path.join(outdir, 'S.json')) as Array<{ properties: { replicas: number } }>;
    expect(content[0].properties.replicas).toBe(3);
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

    const content = readJson(path.join(outdir, 'S.json')) as Array<{ properties: { count: number } }>;
    expect(content[0].properties.count).toBe(42);
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

    const content = readJson(path.join(outdir, 'S.json')) as Array<{
      properties: { password: { secretKeyRef: { name: string; key: string } } };
    }>;
    expect(content[0].properties.password).toEqual({ secretKeyRef: { name: 'my-secret', key: 'value' } });
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

    const content = readJson(path.join(outdir, 'S.json')) as Array<{ properties: { name: string } }>;
    expect(content[0].properties.name).toBe('resolved-name');
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

    const content = readJson(path.join(outdir, 'S.json')) as Array<{ properties: Record<string, unknown> }>;
    expect(content[0].properties).not.toHaveProperty('optional');
    expect(content[0].properties.name).toBe('hello');
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

    const c1 = readJson(path.join(outdir, 'S1.json')) as Array<{ properties: { env: string } }>;
    const c2 = readJson(path.join(outdir, 'S2.json')) as Array<{ properties: { env: string } }>;
    expect(c1[0].properties.env).toBe('prod');
    expect(c2[0].properties.env).toBe('prod');
  });
});
