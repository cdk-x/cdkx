import { Construct } from 'constructs';
import { Stack } from './stack';
import { ProviderResource } from '../provider-resource/provider-resource';
import { makeApp, TestProvider } from '../../../test/helpers';
import { IStackSynthesizer } from '../synthesizer/synthesizer';

describe('Stack', () => {
  describe('Stack.isStack()', () => {
    it('returns true for a Stack instance', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      expect(Stack.isStack(stack)).toBe(true);
    });

    it('returns false for a plain object', () => {
      expect(Stack.isStack({})).toBe(false);
    });

    it('returns false for null', () => {
      expect(Stack.isStack(null)).toBe(false);
    });

    it('returns false for a non-Stack Construct', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      const child = new Construct(stack, 'Child');
      expect(Stack.isStack(child)).toBe(false);
    });
  });

  describe('Stack.of()', () => {
    it('returns the stack when called on the stack itself', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      expect(Stack.of(stack)).toBe(stack);
    });

    it('returns the nearest stack ancestor from a direct child construct', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      const child = new Construct(stack, 'Child');
      expect(Stack.of(child)).toBe(stack);
    });

    it('returns the stack from a deeply nested construct', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      const level1 = new Construct(stack, 'L1');
      const level2 = new Construct(level1, 'L2');
      const level3 = new Construct(level2, 'L3');
      expect(Stack.of(level3)).toBe(stack);
    });

    it('throws if no stack is found in the tree', () => {
      const app = makeApp();
      // App itself is not a Stack
      expect(() => Stack.of(app)).toThrow(
        'No Stack found in the construct tree',
      );
    });
  });

  describe('artifactId', () => {
    it('is derived from node path with slashes replaced by dashes', () => {
      const app = makeApp();
      const stack = new Stack(app, 'my-stack', {
        provider: new TestProvider(),
      });
      // node.path for a direct child of App (root) is 'my-stack'
      expect(stack.artifactId).toBe('my-stack');
    });

    it('uses dashes for nested paths', () => {
      const app = makeApp();
      const parent = new Stack(app, 'parent', { provider: new TestProvider() });
      const child = new Stack(parent, 'child', {
        provider: new TestProvider(),
      });
      expect(child.artifactId).toBe('parent-child');
    });
  });

  describe('providerIdentifier', () => {
    it('delegates to provider.identifier', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', {
        provider: new TestProvider('my-provider'),
      });
      expect(stack.providerIdentifier).toBe('my-provider');
    });
  });

  describe('displayName', () => {
    it('returns the construct id when no stackName is provided', () => {
      const app = makeApp();
      const stack = new Stack(app, 'MyStack', { provider: new TestProvider() });
      expect(stack.displayName).toBe('MyStack');
    });

    it('returns the stackName when explicitly provided', () => {
      const app = makeApp();
      const stack = new Stack(app, 'MyStack', {
        provider: new TestProvider(),
        stackName: 'my-custom-name',
      });
      expect(stack.displayName).toBe('my-custom-name');
    });
  });

  describe('stackName', () => {
    it('defaults to the construct id when not provided', () => {
      const app = makeApp();
      const stack = new Stack(app, 'MyStack', { provider: new TestProvider() });
      expect(stack.stackName).toBe('MyStack');
    });

    it('uses the provided stackName when set', () => {
      const app = makeApp();
      const stack = new Stack(app, 'MyStack', {
        provider: new TestProvider(),
        stackName: 'Production Stack',
      });
      expect(stack.stackName).toBe('Production Stack');
    });

    it('does not affect artifactId when stackName is provided', () => {
      const app = makeApp();
      const stack = new Stack(app, 'MyStack', {
        provider: new TestProvider(),
        stackName: 'Production Stack',
      });
      expect(stack.artifactId).toBe('MyStack');
    });
  });

  describe('description', () => {
    it('is undefined when not provided', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      expect(stack.description).toBeUndefined();
    });

    it('stores the description when provided', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', {
        provider: new TestProvider(),
        description: 'my desc',
      });
      expect(stack.description).toBe('my desc');
    });
  });

  describe('getProviderResources()', () => {
    it('returns an empty array when the stack has no resources', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      expect(stack.getProviderResources()).toEqual([]);
    });

    it('returns direct ProviderResource children', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      const r1 = new ProviderResource(stack, 'R1', { type: 'test::T' });
      const r2 = new ProviderResource(stack, 'R2', { type: 'test::T' });
      const resources = stack.getProviderResources();
      expect(resources).toContain(r1);
      expect(resources).toContain(r2);
      expect(resources).toHaveLength(2);
    });

    it('does NOT include non-ProviderResource constructs', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      new Construct(stack, 'PlainConstruct');
      const resources = stack.getProviderResources();
      expect(resources).toHaveLength(0);
    });

    it('returns ProviderResources nested inside intermediate constructs', () => {
      const app = makeApp();
      const stack = new Stack(app, 'S', { provider: new TestProvider() });
      const group = new Construct(stack, 'Group');
      const nested = new ProviderResource(group, 'Nested', { type: 'test::T' });
      const resources = stack.getProviderResources();
      expect(resources).toContain(nested);
    });
  });

  describe('synthesizer', () => {
    it('uses the provider synthesizer by default', () => {
      const app = makeApp();
      const provider = new TestProvider();
      const expectedSynth = provider.getSynthesizer();
      const stack = new Stack(app, 'S', { provider });
      // Both are JsonSynthesizer instances; check they are the same constructor
      expect(stack.synthesizer.constructor).toBe(expectedSynth.constructor);
    });

    it('uses the overridden synthesizer when provided in props', () => {
      const app = makeApp();
      const mockSynth: IStackSynthesizer = {
        bind: jest.fn(),
        synthesize: jest.fn(),
      };
      const stack = new Stack(app, 'S', {
        provider: new TestProvider(),
        synthesizer: mockSynth,
      });
      expect(stack.synthesizer).toBe(mockSynth);
    });

    it('calls bind() on the synthesizer during construction', () => {
      const app = makeApp();
      const mockSynth: IStackSynthesizer = {
        bind: jest.fn(),
        synthesize: jest.fn(),
      };
      new Stack(app, 'S', {
        provider: new TestProvider(),
        synthesizer: mockSynth,
      });
      expect(mockSynth.bind).toHaveBeenCalledTimes(1);
    });
  });
});
