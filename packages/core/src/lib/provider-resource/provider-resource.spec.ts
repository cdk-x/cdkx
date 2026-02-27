import { App } from '../app/app.js';
import { Stack } from '../stack/stack.js';
import { Provider } from '../provider/provider.js';
import { ProviderResource } from './provider-resource.js';
import { RemovalPolicy } from '../removal-policy.js';
import { ProviderDeletionPolicy } from './provider-resource-policy.js';
import { Lazy } from '../resolvables/lazy.js';
import { IResolvable } from '../resolvables/resolvables.js';

class TestProvider extends Provider {
  public readonly identifier = 'test';
}

describe('ProviderResource', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App({ outdir: '/tmp/cdkx-test-provider-resource' });
    stack = new Stack(app, 'TestStack', { provider: new TestProvider() });
  });

  describe('isProviderResource()', () => {
    it('returns true for ProviderResource instances', () => {
      const resource = new ProviderResource(stack, 'Res', { type: 'test::Type' });
      expect(ProviderResource.isProviderResource(resource)).toBe(true);
    });

    it('returns false for non-ProviderResource objects', () => {
      expect(ProviderResource.isProviderResource({})).toBe(false);
      expect(ProviderResource.isProviderResource(null)).toBe(false);
      expect(ProviderResource.isProviderResource('string')).toBe(false);
    });
  });

  describe('applyRemovalPolicy()', () => {
    it('sets DELETE policy for RemovalPolicy.DESTROY', () => {
      const resource = new ProviderResource(stack, 'Res', { type: 'test::Type' });
      resource.applyRemovalPolicy(RemovalPolicy.DESTROY);
      expect(resource.resourceOptions.deletionPolicy).toBe(ProviderDeletionPolicy.DELETE);
      expect(resource.resourceOptions.updateReplacePolicy).toBe(ProviderDeletionPolicy.DELETE);
    });

    it('sets RETAIN policy for RemovalPolicy.RETAIN', () => {
      const resource = new ProviderResource(stack, 'Res', { type: 'test::Type' });
      resource.applyRemovalPolicy(RemovalPolicy.RETAIN);
      expect(resource.resourceOptions.deletionPolicy).toBe(ProviderDeletionPolicy.RETAIN);
    });

    it('defaults to RETAIN when no policy is given', () => {
      const resource = new ProviderResource(stack, 'Res', { type: 'test::Type' });
      resource.applyRemovalPolicy(undefined);
      expect(resource.resourceOptions.deletionPolicy).toBe(ProviderDeletionPolicy.RETAIN);
    });
  });

  describe('toJson()', () => {
    it('returns type and properties shape', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: { name: 'hello', count: 3 },
      });
      const json = resource.toJson();
      expect(json).toEqual({
        type: 'test::Type',
        properties: { name: 'hello', count: 3 },
      });
    });

    it('resolves Lazy values at synthesis time', () => {
      let resolved = false;
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: {
          replicas: Lazy.any({
            produce: () => {
              resolved = true;
              return 5;
            },
          }),
        },
      });
      const json = resource.toJson();
      expect(resolved).toBe(true);
      expect(json).toEqual({ type: 'test::Type', properties: { replicas: 5 } });
    });

    it('resolves IResolvable tokens via ImplicitTokenResolver', () => {
      class MyToken implements IResolvable {
        resolve(): unknown {
          return { ref: 'some-resource', attr: 'id' };
        }
      }

      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties: { id: new MyToken() as any },
      });
      const json = resource.toJson();
      expect(json).toEqual({
        type: 'test::Type',
        properties: { id: { ref: 'some-resource', attr: 'id' } },
      });
    });

    it('strips null values from properties', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: { name: 'hello', optional: null },
      });
      const json = resource.toJson();
      expect(json).toEqual({ type: 'test::Type', properties: { name: 'hello' } });
    });

    it('produces empty properties object when no properties given', () => {
      const resource = new ProviderResource(stack, 'Res', { type: 'test::Type' });
      const json = resource.toJson();
      expect(json).toEqual({ type: 'test::Type', properties: {} });
    });
  });
});
