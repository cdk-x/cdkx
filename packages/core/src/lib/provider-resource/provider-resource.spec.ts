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

  describe('logicalId', () => {
    it('is computed from the node path using makeUniqueId', () => {
      const resource = new ProviderResource(stack, 'Res', { type: 'test::Type' });
      // node.path = 'TestStack/Res' → makeUniqueId(['TestStack', 'Res'])
      expect(resource.logicalId).toBe('TestStackRes4FFF4668');
    });

    it('is stable — same path always produces the same logical ID', () => {
      const r1 = new ProviderResource(stack, 'Stable', { type: 'test::Type' });
      expect(r1.logicalId).toBe(r1.logicalId);
    });

    it('produces different logical IDs for different construct paths', () => {
      const r1 = new ProviderResource(stack, 'ResA', { type: 'test::Type' });
      const r2 = new ProviderResource(stack, 'ResB', { type: 'test::Type' });
      expect(r1.logicalId).not.toBe(r2.logicalId);
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
    it('returns a keyed object with logicalId as the key', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: { name: 'hello', count: 3 },
      });
      const json = resource.toJson();
      // key must be the logical ID
      expect(Object.keys(json)).toEqual([resource.logicalId]);
    });

    it('contains type, properties and metadata inside the keyed entry', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: { name: 'hello', count: 3 },
      });
      const json = resource.toJson();
      const entry = json[resource.logicalId] as Record<string, unknown>;
      expect(entry.type).toBe('test::Type');
      expect(entry.properties).toEqual({ name: 'hello', count: 3 });
      expect(entry.metadata).toEqual({ 'cdkx:path': 'TestStack/Res' });
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
      const entry = json[resource.logicalId] as Record<string, unknown>;
      expect((entry.properties as Record<string, unknown>).replicas).toBe(5);
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
      const entry = json[resource.logicalId] as Record<string, unknown>;
      expect((entry.properties as Record<string, unknown>).id).toEqual({ ref: 'some-resource', attr: 'id' });
    });

    it('strips null values from properties', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: { name: 'hello', optional: null },
      });
      const json = resource.toJson();
      const entry = json[resource.logicalId] as Record<string, unknown>;
      expect(entry.properties).toEqual({ name: 'hello' });
    });

    it('produces empty properties object when no properties given', () => {
      const resource = new ProviderResource(stack, 'Res', { type: 'test::Type' });
      const json = resource.toJson();
      const entry = json[resource.logicalId] as Record<string, unknown>;
      expect(entry.properties).toEqual({});
    });
  });
});
