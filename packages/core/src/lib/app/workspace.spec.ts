import { Construct } from 'constructs';
import { Workspace } from './workspace';
import { App } from './app';
import { Stack } from '../stack/stack';
import { makeStack } from '../../../test/helpers';

describe('Workspace', () => {
  describe('instanceof App', () => {
    it('is recognized as an App by App.isApp()', () => {
      const workspace = new Workspace();
      expect(App.isApp(workspace)).toBe(true);
    });

    it('is an instance of App', () => {
      const workspace = new Workspace();
      expect(workspace).toBeInstanceOf(App);
    });

    it('is an instance of Workspace', () => {
      const workspace = new Workspace();
      expect(workspace).toBeInstanceOf(Workspace);
    });
  });

  describe('App.of()', () => {
    it('resolves the workspace from a direct Stack child', () => {
      const workspace = new Workspace();
      const stack = makeStack(workspace);
      expect(App.of(stack)).toBe(workspace);
    });

    it('resolves the workspace from a deeply nested construct', () => {
      const workspace = new Workspace();
      const stack = makeStack(workspace);
      const l1 = new Construct(stack, 'L1');
      const l2 = new Construct(l1, 'L2');
      expect(App.of(l2)).toBe(workspace);
    });
  });

  describe('outdir', () => {
    it('defaults to "cdkx.out"', () => {
      const workspace = new Workspace();
      expect(workspace.outdir).toBe('cdkx.out');
    });

    it('forwards a custom outdir from props', () => {
      const workspace = new Workspace({ outdir: '/tmp/my-workspace' });
      expect(workspace.outdir).toBe('/tmp/my-workspace');
    });
  });

  describe('synth()', () => {
    it('returns a CloudAssembly', () => {
      const workspace = new Workspace();
      const assembly = workspace.synth();
      expect(assembly).toBeDefined();
      expect(typeof assembly.stacks).toBe('object');
    });

    it('synthesizes stacks added under the workspace', () => {
      const workspace = new Workspace();
      makeStack(workspace, 'StackA');
      makeStack(workspace, 'StackB');
      const assembly = workspace.synth();
      const ids = Object.keys(assembly.manifest.artifacts);
      expect(ids).toContain('StackA');
      expect(ids).toContain('StackB');
    });
  });

  describe('Stack.of() interop', () => {
    it('Stack.of() does not mistake Workspace for a Stack', () => {
      const workspace = new Workspace();
      expect(() => Stack.of(workspace)).toThrow(
        'No Stack found in the construct tree',
      );
    });
  });
});
