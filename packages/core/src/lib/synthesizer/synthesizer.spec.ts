import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { JsonSynthesizer, IStackRef, ISynthesisSession } from './synthesizer';
import { CycleError } from './cycle-detector';
import { CloudAssemblyBuilder } from '../assembly/cloud-assembly';
import { makeApp, makeStack } from '../../../test/helpers';
import { ProviderResource } from '../provider-resource/provider-resource';
import { StackOutput } from '../stack-output/stack-output';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-synth-test-'));
}

function makeSession(outdir: string): ISynthesisSession {
  return { outdir, assembly: new CloudAssemblyBuilder(outdir) };
}

/** Builds a minimal IStackRef mock. */
function makeStackRef(
  artifactId: string,
  resources: ProviderResource[] = [],
): IStackRef {
  return {
    artifactId,
    displayName: `App/${artifactId}`,
    getProviderResources: () => resources,
    getOutputs: () => [],
    resolveOutputValue: (value: unknown) => value,
  };
}

describe('JsonSynthesizer', () => {
  describe('bind()', () => {
    it('stores the stack reference', () => {
      const synth = new JsonSynthesizer();
      const stackRef = makeStackRef('my-stack');
      synth.bind(stackRef);
      // Access the protected field via cast — we just verify no error thrown
      expect(() => synth.bind(stackRef)).not.toThrow();
    });
  });

  describe('synthesize()', () => {
    it('writes a .json file named after the artifactId', () => {
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'TestStack');
      const session = makeSession(outdir);

      stack.synthesizer.synthesize(session);

      expect(fs.existsSync(path.join(outdir, 'TestStack.json'))).toBe(true);
      fs.rmSync(outdir, { recursive: true });
    });

    it('produces a JSON object keyed by logical ID, one entry per resource', () => {
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'MyStack');
      const r1 = new ProviderResource(stack, 'Res1', {
        type: 'test::TypeA',
        properties: { name: 'a' },
      });
      const r2 = new ProviderResource(stack, 'Res2', {
        type: 'test::TypeB',
        properties: { count: 2 },
      });

      const session = makeSession(outdir);
      stack.synthesizer.synthesize(session);

      const content = JSON.parse(
        fs.readFileSync(path.join(outdir, 'MyStack.json'), 'utf-8'),
      ) as {
        resources: Record<
          string,
          {
            type: string;
            properties: Record<string, unknown>;
            metadata: Record<string, unknown>;
          }
        >;
      };
      expect(Object.keys(content.resources)).toHaveLength(2);
      // Each entry is keyed by its logical ID
      expect(content.resources[r1.logicalId].type).toBe('test::TypeA');
      expect(content.resources[r1.logicalId].properties).toEqual({ name: 'a' });
      expect(content.resources[r2.logicalId].type).toBe('test::TypeB');
      expect(content.resources[r2.logicalId].properties).toEqual({ count: 2 });
      fs.rmSync(outdir, { recursive: true });
    });

    it('produces an empty resources object when the stack has no resources', () => {
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'EmptyStack');
      const session = makeSession(outdir);
      stack.synthesizer.synthesize(session);

      const content = JSON.parse(
        fs.readFileSync(path.join(outdir, 'EmptyStack.json'), 'utf-8'),
      ) as Record<string, unknown>;
      expect(content).toEqual({ resources: {} });
      fs.rmSync(outdir, { recursive: true });
    });

    it('registers the artifact in the CloudAssemblyBuilder', () => {
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'RegStack');
      const session = makeSession(outdir);
      stack.synthesizer.synthesize(session);

      const assembly = session.assembly.buildAssembly();
      const artifact = assembly.getStack('RegStack');
      expect(artifact).toBeDefined();
      expect(artifact?.properties.templateFile).toBe('RegStack.json');
      fs.rmSync(outdir, { recursive: true });
    });

    it('creates the outdir if it does not exist', () => {
      const outdir = path.join(
        os.tmpdir(),
        `cdkx-new-${Math.random().toString(36).slice(2)}`,
      );
      const app = makeApp(outdir);
      const stack = makeStack(app, 'S');
      const session = makeSession(outdir);
      stack.synthesizer.synthesize(session);

      expect(fs.existsSync(outdir)).toBe(true);
      fs.rmSync(outdir, { recursive: true });
    });
  });
});

// ─── Cycle detection at synthesis time ───────────────────────────────────────

describe('app.synth() cycle detection', () => {
  it('throws CycleError when two stacks import each other (A → B → A)', () => {
    const outdir = tmpDir();
    const app = makeApp(outdir);

    const stackA = makeStack(app, 'StackA');
    const stackB = makeStack(app, 'StackB');

    // Declare outputs on each stack
    const outputA = new StackOutput(stackA, 'OutputA', { value: 'valueA' });
    const outputB = new StackOutput(stackB, 'OutputB', { value: 'valueB' });

    // Stack A imports B's output → A depends on B
    new ProviderResource(stackA, 'ResA', {
      type: 'test::Res',
      properties: { dep: outputB.importValue() },
    });

    // Stack B imports A's output → B depends on A (cycle!)
    new ProviderResource(stackB, 'ResB', {
      type: 'test::Res',
      properties: { dep: outputA.importValue() },
    });

    expect(() => app.synth()).toThrow(CycleError);
    fs.rmSync(outdir, { recursive: true });
  });

  it('names both stacks in the CycleError message', () => {
    const outdir = tmpDir();
    const app = makeApp(outdir);

    const stackA = makeStack(app, 'StackA');
    const stackB = makeStack(app, 'StackB');

    const outputA = new StackOutput(stackA, 'OutputA', { value: 'v' });
    const outputB = new StackOutput(stackB, 'OutputB', { value: 'v' });

    new ProviderResource(stackA, 'ResA', {
      type: 'test::Res',
      properties: { dep: outputB.importValue() },
    });
    new ProviderResource(stackB, 'ResB', {
      type: 'test::Res',
      properties: { dep: outputA.importValue() },
    });

    let err: CycleError | undefined;
    try {
      app.synth();
    } catch (e) {
      err = e as CycleError;
    }

    expect(err).toBeInstanceOf(CycleError);
    if (!(err instanceof CycleError)) return;
    expect(err.cycleNodes).toContain(stackA.artifactId);
    expect(err.cycleNodes).toContain(stackB.artifactId);
    fs.rmSync(outdir, { recursive: true });
  });

  it('writes no output files when a cycle is detected', () => {
    const outdir = tmpDir();
    const app = makeApp(outdir);

    const stackA = makeStack(app, 'StackA');
    const stackB = makeStack(app, 'StackB');

    const outputA = new StackOutput(stackA, 'OutputA', { value: 'v' });
    const outputB = new StackOutput(stackB, 'OutputB', { value: 'v' });

    new ProviderResource(stackA, 'ResA', {
      type: 'test::Res',
      properties: { dep: outputB.importValue() },
    });
    new ProviderResource(stackB, 'ResB', {
      type: 'test::Res',
      properties: { dep: outputA.importValue() },
    });

    expect(() => app.synth()).toThrow(CycleError);

    // No template files or manifest should be written
    const files = fs.readdirSync(outdir);
    expect(files).toHaveLength(0);

    fs.rmSync(outdir, { recursive: true });
  });

  it('synth succeeds and writes files for a valid acyclic cross-stack ref', () => {
    const outdir = tmpDir();
    const app = makeApp(outdir);

    const stackA = makeStack(app, 'StackA');
    const stackB = makeStack(app, 'StackB');

    // Only B depends on A (no cycle)
    const outputA = new StackOutput(stackA, 'OutputA', { value: 'v' });
    new ProviderResource(stackB, 'ResB', {
      type: 'test::Res',
      properties: { dep: outputA.importValue() },
    });

    expect(() => app.synth()).not.toThrow();

    expect(fs.existsSync(path.join(outdir, 'StackA.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'StackB.json'))).toBe(true);
    expect(fs.existsSync(path.join(outdir, 'manifest.json'))).toBe(true);
    fs.rmSync(outdir, { recursive: true });
  });
});
