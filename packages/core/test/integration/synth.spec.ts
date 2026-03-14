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
import { App } from '../../src/lib/app/app';
import { Stack } from '../../src/lib/stack/stack';
import { ProviderResource } from '../../src/lib/provider-resource/provider-resource';
import { Lazy } from '../../src/lib/resolvables/lazy';
import {
  IResolvable,
  ResolveContext,
} from '../../src/lib/resolvables/resolvables';
import { MANIFEST_VERSION } from '../../src/lib/assembly/cloud-assembly';
import { SynthHelpers, TestResources } from '../helpers';

// ---------------------------------------------------------------------------
// 1. Basic single-stack synthesis
// ---------------------------------------------------------------------------
describe('Single stack — basic synthesis', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = SynthHelpers.tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('writes the stack JSON file to disk', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'MyStack', {});
    TestResources.resource(stack);

    app.synth();

    expect(fs.existsSync(path.join(outdir, 'MyStack.json'))).toBe(true);
  });

  it('stack JSON contains the correct resource shape', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'MyStack', {});
    const resource = TestResources.resource(stack, 'Server');

    app.synth();

    const content = SynthHelpers.readJson(
      path.join(outdir, 'MyStack.json'),
    ) as { resources: Record<string, unknown> };
    expect(Object.keys(content.resources)).toHaveLength(1);
    const entry = content.resources[resource.logicalId] as {
      type: string;
      properties: Record<string, unknown>;
    };
    expect(entry.type).toBe('test::Resource');
    expect(entry.properties).toEqual({ name: 'Server' });
  });

  it('writes manifest.json to disk', () => {
    const app = new App({ outdir });
    new Stack(app, 'MyStack', {});
    app.synth();

    expect(fs.existsSync(path.join(outdir, 'manifest.json'))).toBe(true);
  });

  it('manifest.json has the correct version and stack entry', () => {
    const app = new App({ outdir });
    new Stack(app, 'MyStack', {});
    app.synth();

    const manifest = SynthHelpers.readJson(
      path.join(outdir, 'manifest.json'),
    ) as {
      version: string;
      artifacts: Record<
        string,
        {
          type: string;
          properties: { templateFile: string };
          displayName?: string;
        }
      >;
    };

    expect(manifest.version).toBe(MANIFEST_VERSION);
    expect(Object.keys(manifest.artifacts)).toHaveLength(1);
    expect(manifest.artifacts['MyStack']).toEqual({
      type: 'cdkx:stack',
      properties: { templateFile: 'MyStack.json' },
      displayName: 'MyStack',
    });
  });

  it('empty stack produces an empty resources object', () => {
    const app = new App({ outdir });
    new Stack(app, 'Empty', {});
    app.synth();

    const content = SynthHelpers.readJson(path.join(outdir, 'Empty.json'));
    expect(content).toEqual({ resources: {} });
  });
});

// ---------------------------------------------------------------------------
// 2. stackName
// ---------------------------------------------------------------------------
describe('stackName', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = SynthHelpers.tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('manifest displayName defaults to the construct id when stackName is not provided', () => {
    const app = new App({ outdir });
    new Stack(app, 'MyStack', {});
    app.synth();

    const manifest = SynthHelpers.readJson(
      path.join(outdir, 'manifest.json'),
    ) as {
      artifacts: Record<string, { displayName?: string }>;
    };
    expect(manifest.artifacts['MyStack'].displayName).toBe('MyStack');
  });

  it('manifest displayName uses stackName when provided', () => {
    const app = new App({ outdir });
    new Stack(app, 'MyStack', {
      stackName: 'Production Stack',
    });
    app.synth();

    const manifest = SynthHelpers.readJson(
      path.join(outdir, 'manifest.json'),
    ) as {
      artifacts: Record<
        string,
        { displayName?: string; properties: { templateFile: string } }
      >;
    };
    // artifactId (manifest key and file name) is still derived from construct id
    expect(manifest.artifacts['MyStack']).toBeDefined();
    expect(manifest.artifacts['MyStack'].displayName).toBe('Production Stack');
    expect(manifest.artifacts['MyStack'].properties.templateFile).toBe(
      'MyStack.json',
    );
  });

  it('output file name is always derived from the construct id, not stackName', () => {
    const app = new App({ outdir });
    new Stack(app, 'MyStack', {
      stackName: 'Production Stack',
    });
    app.synth();

    expect(fs.existsSync(path.join(outdir, 'MyStack.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'Production Stack.json'))).toBe(
      false,
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Multiple stacks
// ---------------------------------------------------------------------------
describe('Multiple stacks', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = SynthHelpers.tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('writes a separate JSON file for each stack', () => {
    const app = new App({ outdir });
    const s1 = new Stack(app, 'StackA', {});
    const s2 = new Stack(app, 'StackB', {});
    TestResources.resource(s1, 'R1');
    TestResources.resource(s2, 'R2');
    app.synth();

    expect(fs.existsSync(path.join(outdir, 'StackA.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'StackB.json'))).toBe(true);
  });

  it('manifest lists all stacks', () => {
    const app = new App({ outdir });
    new Stack(app, 'StackA', {});
    new Stack(app, 'StackB', {});
    app.synth();

    const manifest = SynthHelpers.readJson(
      path.join(outdir, 'manifest.json'),
    ) as {
      artifacts: Record<string, unknown>;
    };
    expect(Object.keys(manifest.artifacts).sort()).toEqual([
      'StackA',
      'StackB',
    ]);
  });

  it('each stack file contains only its own resources', () => {
    const app = new App({ outdir });
    const s1 = new Stack(app, 'StackA', {});
    const s2 = new Stack(app, 'StackB', {});
    new ProviderResource(s1, 'Res', {
      type: 'test::Resource',
      properties: { owner: 'stack-a' },
    });
    new ProviderResource(s2, 'Res', {
      type: 'test::Resource',
      properties: { owner: 'stack-b' },
    });
    app.synth();

    const a = SynthHelpers.resourceValues(
      SynthHelpers.readJson(path.join(outdir, 'StackA.json')),
    );
    const b = SynthHelpers.resourceValues(
      SynthHelpers.readJson(path.join(outdir, 'StackB.json')),
    );
    expect(a[0].properties['owner']).toBe('stack-a');
    expect(b[0].properties['owner']).toBe('stack-b');
  });
});

// ---------------------------------------------------------------------------
// 4. Token resolution — Lazy
// ---------------------------------------------------------------------------
describe('Lazy token resolution', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = SynthHelpers.tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('resolves a Lazy value at synthesis time', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'S', {});

    let computed = false;
    new ProviderResource(stack, 'R', {
      type: 'test::Resource',
      properties: {
        value: Lazy.any({
          produce: () => {
            computed = true;
            return 42;
          },
        }),
      },
    });

    expect(computed).toBe(false);
    app.synth();

    expect(computed).toBe(true);
    const content = SynthHelpers.resourceValues(
      SynthHelpers.readJson(path.join(outdir, 'S.json')),
    );
    expect(content[0].properties['value']).toBe(42);
  });

  it('resolves a Lazy that references a value set after construction', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'S', {});

    let lateValue = 0;
    new ProviderResource(stack, 'R', {
      type: 'test::Resource',
      properties: { count: Lazy.any({ produce: () => lateValue }) },
    });

    lateValue = 42;
    app.synth();

    const content = SynthHelpers.resourceValues(
      SynthHelpers.readJson(path.join(outdir, 'S.json')),
    );
    expect(content[0].properties['count']).toBe(42);
  });

  it('uses TestResources.resourceWithLazy helper', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'S', {});
    TestResources.resourceWithLazy(stack);
    app.synth();

    const content = SynthHelpers.resourceValues(
      SynthHelpers.readJson(path.join(outdir, 'S.json')),
    );
    expect(content[0].properties['value']).toBe('lazy-resolved');
  });
});

// ---------------------------------------------------------------------------
// 5. Token resolution — IResolvable
// ---------------------------------------------------------------------------
describe('IResolvable token resolution', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = SynthHelpers.tmpDir();
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
    const stack = new Stack(app, 'S', {});
    new ProviderResource(stack, 'R', {
      type: 'test::Resource',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: { password: new SecretRef('my-secret') as any },
    });

    app.synth();

    const content = SynthHelpers.resourceValues(
      SynthHelpers.readJson(path.join(outdir, 'S.json')),
    );
    expect(content[0].properties['password']).toEqual({
      secretKeyRef: { name: 'my-secret', key: 'value' },
    });
  });

  it('resolves a Lazy → IResolvable chain', () => {
    class NameToken implements IResolvable {
      resolve(_ctx: ResolveContext): unknown {
        return 'resolved-name';
      }
    }

    const app = new App({ outdir });
    const stack = new Stack(app, 'S', {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lazy = Lazy.any({ produce: () => new NameToken() as any });
    new ProviderResource(stack, 'R', {
      type: 'test::Resource',
      properties: { name: lazy },
    });

    app.synth();

    const content = SynthHelpers.resourceValues(
      SynthHelpers.readJson(path.join(outdir, 'S.json')),
    );
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
    const stack = new Stack(app, 'S', {});
    new ProviderResource(stack, 'R', {
      type: 'Kubernetes::Resource::Deployment',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      properties: { x: new ProviderSpyToken() as any },
    });

    app.synth();

    // Provider is now extracted from the resource type (Provider::Domain::Resource)
    expect(capturedProvider).toBe('kubernetes');
  });
});

// ---------------------------------------------------------------------------
// 6. Null / undefined stripping
// ---------------------------------------------------------------------------
describe('Null and undefined stripping during synthesis', () => {
  let outdir: string;

  beforeEach(() => {
    outdir = SynthHelpers.tmpDir();
  });
  afterEach(() => fs.rmSync(outdir, { recursive: true }));

  it('strips null property values from the output', () => {
    const app = new App({ outdir });
    const stack = new Stack(app, 'S', {});
    TestResources.resourceWithNull(stack);
    app.synth();

    const content = SynthHelpers.resourceValues(
      SynthHelpers.readJson(path.join(outdir, 'S.json')),
    );
    expect(content[0].properties).not.toHaveProperty('optional');
    expect(content[0].properties['name']).toBe('NullResource');
  });
});

// ---------------------------------------------------------------------------
// 7. Unresolved token detection
// ---------------------------------------------------------------------------
describe('Unresolved token detection', () => {
  it('throws during synthesis when a class instance survives resolution', () => {
    const outdir = SynthHelpers.tmpDir();
    try {
      class UnresolvedToken {
        // Does NOT implement IResolvable — no resolve() method
        public value = 'oops';
      }

      const app = new App({ outdir });
      const stack = new Stack(app, 'S', {});
      new ProviderResource(stack, 'R', {
        type: 'test::Resource',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties: { bad: new UnresolvedToken() as any },
      });

      expect(() => app.synth()).toThrow(
        "Unresolved token of type 'UnresolvedToken' found during synthesis",
      );
    } finally {
      if (fs.existsSync(outdir)) fs.rmSync(outdir, { recursive: true });
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Visual synth output — written to .cdkx.out/ at workspace root
// ---------------------------------------------------------------------------
describe('Visual synth output', () => {
  it('produces a multi-stack output with cross-resource references in .cdkx.out/', () => {
    // Resolve workspace root: this file is 5 levels deep from root
    // packages/core/test/integration/synth.spec.ts
    const outdir = path.resolve(__dirname, '../../../../../.cdkx.out');

    const app = new App({ outdir });

    // ── Stack A — cross-resource references and null stripping ─────────────
    const stackA = new Stack(app, 'StackA', {});

    // Source resource — another resource will reference its logicalId
    const source = TestResources.resource(stackA, 'Source');

    // Dependent resource — references Source via a plain { ref, attr } object
    // (same shape ResourceAttribute would produce at synthesis time)
    new ProviderResource(stackA, 'Dependent', {
      type: 'test::Resource',
      properties: {
        name: 'Dependent',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref: { ref: source.logicalId, attr: 'id' } as any,
      },
    });

    // Null-stripping: optional prop set to null should be absent in output
    TestResources.resourceWithNull(stackA, 'WithNull');

    // ── Stack B — lazy resolution ───────────────────────────────────────────
    const stackB = new Stack(app, 'StackB', {});

    // Lazy resource — value resolved at synthesis time
    TestResources.resourceWithLazy(stackB, 'WithLazy');

    app.synth();

    // ── Assertions ──────────────────────────────────────────────────────────
    expect(fs.existsSync(path.join(outdir, 'StackA.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'StackB.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'manifest.json'))).toBe(true);

    // Manifest lists both stacks
    const manifest = SynthHelpers.readJson(
      path.join(outdir, 'manifest.json'),
    ) as {
      artifacts: Record<string, unknown>;
    };
    expect(Object.keys(manifest.artifacts).sort()).toEqual([
      'StackA',
      'StackB',
    ]);

    type ResourceEntry = {
      type: string;
      properties: Record<string, unknown>;
      metadata: Record<string, unknown>;
    };

    // ── Stack A assertions ──────────────────────────────────────────────────
    const aOut = (
      SynthHelpers.readJson(path.join(outdir, 'StackA.json')) as {
        resources: Record<string, ResourceEntry>;
      }
    ).resources;

    // Source resource present, keyed by its hashed logicalId
    const sourceEntry = aOut[source.logicalId];
    expect(sourceEntry).toBeDefined();
    expect(sourceEntry.type).toBe('test::Resource');
    expect(sourceEntry.metadata['cdkx:path']).toBe('StackA/Source');

    // Dependent resource has the cross-reference pointing to source's logicalId
    const dependentEntry = Object.values(aOut).find(
      (r) => r.properties['name'] === 'Dependent',
    );
    expect(dependentEntry).toBeDefined();
    expect(dependentEntry?.properties['ref']).toEqual({
      ref: source.logicalId,
      attr: 'id',
    });

    // Null property was stripped
    const nullEntry = Object.values(aOut).find(
      (r) => r.metadata['cdkx:path'] === 'StackA/WithNull',
    );
    expect(nullEntry).toBeDefined();
    expect(nullEntry?.properties).not.toHaveProperty('optional');

    // ── Stack B assertions ──────────────────────────────────────────────────
    const bOut = (
      SynthHelpers.readJson(path.join(outdir, 'StackB.json')) as {
        resources: Record<string, ResourceEntry>;
      }
    ).resources;

    // Lazy value was resolved at synthesis time
    const lazyEntry = Object.values(bOut).find(
      (r) => r.metadata['cdkx:path'] === 'StackB/WithLazy',
    );
    expect(lazyEntry).toBeDefined();
    expect(lazyEntry?.properties['value']).toBe('lazy-resolved');
  });
});
