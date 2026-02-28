import { Construct } from 'constructs';
import { App } from './app.js';
import { Stack } from '../stack/stack.js';
import { IStackSynthesizer, ISynthesisSession } from '../synthesizer/synthesizer.js';
import { IResolver, ResolutionContext } from '../resolvables/resolvables.js';
import { makeApp, makeStack, TestProvider, SpyProvider } from '../../test/helpers/index.js';

describe('App', () => {
  describe('App.isApp()', () => {
    it('returns true for an App instance', () => {
      expect(App.isApp(makeApp())).toBe(true);
    });

    it('returns false for a Stack', () => {
      const app = makeApp();
      const stack = makeStack(app);
      expect(App.isApp(stack)).toBe(false);
    });

    it('returns false for null', () => {
      expect(App.isApp(null)).toBe(false);
    });

    it('returns false for a plain object', () => {
      expect(App.isApp({})).toBe(false);
    });
  });

  describe('App.of()', () => {
    it('returns the app when called on the app itself', () => {
      const app = makeApp();
      expect(App.of(app)).toBe(app);
    });

    it('returns the app from a direct Stack child', () => {
      const app = makeApp();
      const stack = makeStack(app);
      expect(App.of(stack)).toBe(app);
    });

    it('returns the app from a deeply nested construct', () => {
      const app = makeApp();
      const stack = makeStack(app);
      const l1 = new Construct(stack, 'L1');
      const l2 = new Construct(l1, 'L2');
      expect(App.of(l2)).toBe(app);
    });

    it('throws if the construct is not rooted in an App', () => {
      // A construct with no App ancestor
      const orphan = new Construct(undefined as never, 'orphan');
      expect(() => App.of(orphan)).toThrow('No App found in the construct tree');
    });
  });

  describe('outdir', () => {
    it('defaults to "cdkx.out"', () => {
      const app = new App();
      expect(app.outdir).toBe('cdkx.out');
    });

    it('uses the provided outdir', () => {
      const app = makeApp('/tmp/my-outdir');
      expect(app.outdir).toBe('/tmp/my-outdir');
    });
  });

  describe('getResolverPipeline()', () => {
    it('returns a ResolverPipeline for a provider', () => {
      const app = makeApp();
      const provider = new TestProvider();
      const pipeline = app.getResolverPipeline(provider);
      expect(pipeline).toBeDefined();
      expect(typeof pipeline.resolve).toBe('function');
    });

    it('returns the same cached instance on repeated calls for the same provider', () => {
      const app = makeApp();
      const provider = new TestProvider();
      const p1 = app.getResolverPipeline(provider);
      const p2 = app.getResolverPipeline(provider);
      expect(p1).toBe(p2);
    });

    it('returns different pipelines for providers with different identifiers', () => {
      const app = makeApp();
      const p1 = app.getResolverPipeline(new TestProvider('alpha'));
      const p2 = app.getResolverPipeline(new TestProvider('beta'));
      expect(p1).not.toBe(p2);
    });

    it('calls provider.getResolvers() only once (cached)', () => {
      const app = makeApp();
      const spy = new SpyProvider();
      app.getResolverPipeline(spy);
      app.getResolverPipeline(spy);
      expect(spy.getResolversCalled).toBe(1);
    });

    it('includes global resolvers in the pipeline', () => {
      const resolved: string[] = [];
      const globalResolver: IResolver = {
        resolve(ctx: ResolutionContext) {
          if (ctx.value === 'trigger') {
            resolved.push('global');
            ctx.replaceValue('done');
          }
        },
      };
      const app = new App({ resolvers: [globalResolver] });
      const stack = makeStack(app);
      const pipeline = app.getResolverPipeline(stack.provider);
      pipeline.resolve([], 'trigger', {}, 'test');
      expect(resolved).toContain('global');
    });
  });

  describe('synth()', () => {
    it('returns a CloudAssembly', () => {
      const app = makeApp();
      const assembly = app.synth();
      expect(assembly).toBeDefined();
      expect(typeof assembly.stacks).toBe('object');
    });

    it('produces an empty stacks list when there are no stacks', () => {
      const app = makeApp();
      const assembly = app.synth();
      expect(assembly.stacks).toEqual([]);
    });

    it('calls synthesize() on each Stack', () => {
      const app = makeApp();
      const mockSynth: IStackSynthesizer = { bind: jest.fn(), synthesize: jest.fn() };
      new Stack(app, 'S1', { provider: new TestProvider(), synthesizer: mockSynth });
      new Stack(app, 'S2', { provider: new TestProvider(), synthesizer: mockSynth });
      app.synth();
      expect(mockSynth.synthesize).toHaveBeenCalledTimes(2);
    });

    it('registers each stack in the returned assembly', () => {
      const app = makeApp();
      makeStack(app, 'StackA');
      makeStack(app, 'StackB');
      const assembly = app.synth();
      const ids = Object.keys(assembly.manifest.artifacts);
      expect(ids).toContain('StackA');
      expect(ids).toContain('StackB');
    });

    it('does NOT call synthesize() on non-Stack constructs', () => {
      const app = makeApp();
      const mockSynth: IStackSynthesizer = { bind: jest.fn(), synthesize: jest.fn() };
      // Add a plain Construct — not a Stack
      new Construct(app, 'PlainNode');
      // Also add a real Stack to confirm synth IS called for stacks
      new Stack(app, 'S', { provider: new TestProvider(), synthesizer: mockSynth });
      app.synth();
      expect(mockSynth.synthesize).toHaveBeenCalledTimes(1);
    });

    it('passes the session outdir to each synthesizer', () => {
      const app = makeApp('/tmp/test-outdir-app');
      const capturedSessions: ISynthesisSession[] = [];
      const captureSynth: IStackSynthesizer = {
        bind: jest.fn(),
        synthesize: (session) => capturedSessions.push(session),
      };
      new Stack(app, 'S', { provider: new TestProvider(), synthesizer: captureSynth });
      app.synth();
      expect(capturedSessions[0].outdir).toBe('/tmp/test-outdir-app');
    });
  });
});
