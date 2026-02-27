import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { JsonSynthesizer, IStackRef, ISynthesisSession } from './synthesizer.js';
import { CloudAssemblyBuilder } from '../assembly/cloud-assembly.js';
import { makeApp, makeStack, TestProvider } from '../../test/helpers/index.js';
import { ProviderResource } from '../provider-resource/provider-resource.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-synth-test-'));
}

function makeSession(outdir: string): ISynthesisSession {
  return { outdir, assembly: new CloudAssemblyBuilder(outdir) };
}

/** Builds a minimal IStackRef mock. */
function makeStackRef(artifactId: string, resources: ProviderResource[] = [], providerIdentifier = 'test'): IStackRef {
  return {
    artifactId,
    providerIdentifier,
    displayName: `App/${artifactId}`,
    getProviderResources: () => resources,
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
      const stack = makeStack(app, 'TestStack', new TestProvider());
      const session = makeSession(outdir);

      stack.synthesizer.synthesize(session);

      expect(fs.existsSync(path.join(outdir, 'TestStack.json'))).toBe(true);
      fs.rmSync(outdir, { recursive: true });
    });

    it('produces a JSON array with one entry per resource', () => {
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'MyStack', new TestProvider());
      new ProviderResource(stack, 'Res1', { type: 'test::TypeA', properties: { name: 'a' } });
      new ProviderResource(stack, 'Res2', { type: 'test::TypeB', properties: { count: 2 } });

      const session = makeSession(outdir);
      stack.synthesizer.synthesize(session);

      const content = JSON.parse(fs.readFileSync(path.join(outdir, 'MyStack.json'), 'utf-8'));
      expect(content).toHaveLength(2);
      expect(content[0]).toEqual({ type: 'test::TypeA', properties: { name: 'a' } });
      expect(content[1]).toEqual({ type: 'test::TypeB', properties: { count: 2 } });
      fs.rmSync(outdir, { recursive: true });
    });

    it('produces an empty array when the stack has no resources', () => {
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'EmptyStack', new TestProvider());
      const session = makeSession(outdir);
      stack.synthesizer.synthesize(session);

      const content = JSON.parse(fs.readFileSync(path.join(outdir, 'EmptyStack.json'), 'utf-8'));
      expect(content).toEqual([]);
      fs.rmSync(outdir, { recursive: true });
    });

    it('registers the artifact in the CloudAssemblyBuilder', () => {
      const outdir = tmpDir();
      const app = makeApp(outdir);
      const stack = makeStack(app, 'RegStack', new TestProvider());
      const session = makeSession(outdir);
      stack.synthesizer.synthesize(session);

      const assembly = session.assembly.buildAssembly();
      const artifact = assembly.getStack('RegStack');
      expect(artifact).toBeDefined();
      expect(artifact?.file).toBe('RegStack.json');
      expect(artifact?.provider).toBe('test');
      fs.rmSync(outdir, { recursive: true });
    });

    it('creates the outdir if it does not exist', () => {
      const outdir = path.join(os.tmpdir(), `cdkx-new-${Math.random().toString(36).slice(2)}`);
      const app = makeApp(outdir);
      const stack = makeStack(app, 'S', new TestProvider());
      const session = makeSession(outdir);
      stack.synthesizer.synthesize(session);

      expect(fs.existsSync(outdir)).toBe(true);
      fs.rmSync(outdir, { recursive: true });
    });
  });
});
