import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Construct } from 'constructs';
import { App } from './app';
import { Stack } from '../stack/stack';
import { Asset } from '../asset/asset';
import {
  IStackSynthesizer,
  ISynthesisSession,
} from '../synthesizer/synthesizer';
import { IResolver, ResolutionContext } from '../resolvables/resolvables';
import {
  makeApp,
  makeStack,
  TestProvider,
  SpyProvider,
} from '../../../test/helpers';

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
      expect(() => App.of(orphan)).toThrow(
        'No App found in the construct tree',
      );
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
      const pipeline = app.getResolverPipeline(new TestProvider('test'));
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
      const mockSynth: IStackSynthesizer = {
        bind: jest.fn(),
        synthesize: jest.fn(),
      };
      new Stack(app, 'S1', {
        synthesizer: mockSynth,
      });
      new Stack(app, 'S2', {
        synthesizer: mockSynth,
      });
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
      const mockSynth: IStackSynthesizer = {
        bind: jest.fn(),
        synthesize: jest.fn(),
      };
      // Add a plain Construct — not a Stack
      new Construct(app, 'PlainNode');
      // Also add a real Stack to confirm synth IS called for stacks
      new Stack(app, 'S', {
        synthesizer: mockSynth,
      });
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
      new Stack(app, 'S', {
        synthesizer: captureSynth,
      });
      app.synth();
      expect(capturedSessions[0].outdir).toBe('/tmp/test-outdir-app');
    });

    describe('asset synthesis (Phase 0)', () => {
      function tmpFile(name: string, contents: string): string {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-app-asset-'));
        const filePath = path.join(dir, name);
        fs.writeFileSync(filePath, contents, 'utf-8');
        return filePath;
      }

      it('stages assets and registers cdkx:asset artifacts before stack synthesis', () => {
        const outdir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-synth-'),
        );
        const app = new App({ outdir });
        const stack = new Stack(app, 'S');
        const sourcePath = tmpFile('cloud-init.yaml', 'users: []');
        const asset = new Asset(stack, 'CloudInit', { path: sourcePath });

        const assembly = app.synth();

        const stagedFile = path.join(
          outdir,
          'assets',
          `asset.${asset.assetHash}`,
          'cloud-init.yaml',
        );
        expect(fs.existsSync(stagedFile)).toBe(true);

        const artifactId = `asset.${asset.assetHash}`;
        expect(assembly.manifest.artifacts[artifactId]).toEqual({
          type: 'cdkx:asset',
          properties: {
            hash: asset.assetHash,
            path: `assets/asset.${asset.assetHash}/cloud-init.yaml`,
            packaging: 'file',
          },
        });
      });

      it('collects assets nested beneath a Stack, not only direct children', () => {
        const outdir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-nested-'),
        );
        const app = new App({ outdir });
        const stack = new Stack(app, 'S');
        const l1 = new Construct(stack, 'L1');
        const sourcePath = tmpFile('data.txt', 'nested');
        const asset = new Asset(l1, 'Nested', { path: sourcePath });

        app.synth();

        const stagedFile = path.join(
          outdir,
          'assets',
          `asset.${asset.assetHash}`,
          'data.txt',
        );
        expect(fs.existsSync(stagedFile)).toBe(true);
      });

      it('stages assets before stack synthesizers run (assets visible on disk during stack synth)', () => {
        const outdir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-order-'),
        );
        const app = new App({ outdir });
        const sourcePath = tmpFile('f.yaml', 'x');
        const asset = new Asset(new Stack(app, 'AssetStack'), 'A', {
          path: sourcePath,
        });

        let stagedDuringStackSynth = false;
        const observingSynth: IStackSynthesizer = {
          bind: () => undefined,
          synthesize: (session) => {
            const expectedDir = path.join(
              session.outdir,
              'assets',
              `asset.${asset.assetHash}`,
            );
            stagedDuringStackSynth = fs.existsSync(expectedDir);
            session.assembly.addArtifact({
              id: 'ObservingStack',
              templateFile: 'ObservingStack.json',
            });
            session.assembly.writeFile('ObservingStack.json', '{}');
          },
        };
        new Stack(app, 'ObservingStack', { synthesizer: observingSynth });

        app.synth();

        expect(stagedDuringStackSynth).toBe(true);
      });

      it('stages directory assets: mirrors the tree and registers packaging:"directory"', () => {
        const outdir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-dir-synth-'),
        );
        const app = new App({ outdir });
        const stack = new Stack(app, 'S');

        const sourceDir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-dir-src-'),
        );
        fs.writeFileSync(path.join(sourceDir, 'top.txt'), 'top', 'utf-8');
        fs.mkdirSync(path.join(sourceDir, 'inner'));
        fs.writeFileSync(path.join(sourceDir, 'inner', 'x.txt'), 'x', 'utf-8');

        const asset = new Asset(stack, 'Role', { directoryPath: sourceDir });

        const assembly = app.synth();

        const stagedDir = path.join(
          outdir,
          'assets',
          `asset.${asset.assetHash}`,
        );
        expect(fs.readFileSync(path.join(stagedDir, 'top.txt'), 'utf-8')).toBe(
          'top',
        );
        expect(
          fs.readFileSync(path.join(stagedDir, 'inner', 'x.txt'), 'utf-8'),
        ).toBe('x');

        const artifactId = `asset.${asset.assetHash}`;
        expect(assembly.manifest.artifacts[artifactId]).toEqual({
          type: 'cdkx:asset',
          properties: {
            hash: asset.assetHash,
            path: `assets/asset.${asset.assetHash}`,
            packaging: 'directory',
          },
        });
      });

      it('deduplicates directory assets with identical content into a single artifact', () => {
        const outdir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-dir-dedup-'),
        );
        const app = new App({ outdir });
        const stack = new Stack(app, 'S');

        const sourceA = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-dir-a-'),
        );
        fs.writeFileSync(path.join(sourceA, 'same.txt'), 'payload', 'utf-8');
        const sourceB = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-dir-b-'),
        );
        fs.writeFileSync(path.join(sourceB, 'same.txt'), 'payload', 'utf-8');

        const assetA = new Asset(stack, 'A', { directoryPath: sourceA });
        const assetB = new Asset(stack, 'B', { directoryPath: sourceB });

        const assembly = app.synth();

        expect(assetA.assetHash).toBe(assetB.assetHash);
        const assetArtifactCount = Object.values(
          assembly.manifest.artifacts,
        ).filter((a) => a.type === 'cdkx:asset').length;
        expect(assetArtifactCount).toBe(1);
      });

      it('deduplicates assets with the same hash into a single artifact', () => {
        const outdir = fs.mkdtempSync(
          path.join(os.tmpdir(), 'cdkx-app-dedup-'),
        );
        const app = new App({ outdir });
        const stack = new Stack(app, 'S');
        const sourceA = tmpFile('a.txt', 'same');
        const sourceB = tmpFile('a.txt', 'same');
        const assetA = new Asset(stack, 'A', { path: sourceA });
        new Asset(stack, 'B', { path: sourceB });

        const assembly = app.synth();

        expect(assetA.assetHash).toBeDefined();
        const artifactId = `asset.${assetA.assetHash}`;
        expect(assembly.manifest.artifacts[artifactId]).toBeDefined();
        const assetArtifactCount = Object.values(
          assembly.manifest.artifacts,
        ).filter((a) => a.type === 'cdkx:asset').length;
        expect(assetArtifactCount).toBe(1);
      });
    });
  });
});
