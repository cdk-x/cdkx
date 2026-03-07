import { App } from '../app/app';
import { Stack } from '../stack/stack';
import { Provider } from '../provider/provider';
import { ProviderResource } from './provider-resource';
import { RemovalPolicy } from '../removal-policy';
import { ProviderDeletionPolicy } from './provider-resource-policy';
import { Lazy } from '../resolvables/lazy';
import { IResolvable } from '../resolvables/resolvables';
import { PropertyValue } from '../constants';

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
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
      });
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
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
      });
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
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
      });
      resource.applyRemovalPolicy(RemovalPolicy.DESTROY);
      expect(resource.resourceOptions.deletionPolicy).toBe(
        ProviderDeletionPolicy.DELETE,
      );
      expect(resource.resourceOptions.updateReplacePolicy).toBe(
        ProviderDeletionPolicy.DELETE,
      );
    });

    it('sets RETAIN policy for RemovalPolicy.RETAIN', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
      });
      resource.applyRemovalPolicy(RemovalPolicy.RETAIN);
      expect(resource.resourceOptions.deletionPolicy).toBe(
        ProviderDeletionPolicy.RETAIN,
      );
    });

    it('defaults to RETAIN when no policy is given', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
      });
      resource.applyRemovalPolicy(undefined);
      expect(resource.resourceOptions.deletionPolicy).toBe(
        ProviderDeletionPolicy.RETAIN,
      );
    });
  });

  describe('getAtt()', () => {
    it('returns an IResolvable that resolves to { ref, attr }', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
      });
      const token = resource.getAtt('networkId');
      expect(
        token.resolve(
          undefined as unknown as Parameters<IResolvable['resolve']>[0],
        ),
      ).toEqual({
        ref: resource.logicalId,
        attr: 'networkId',
      });
    });

    it('captures the logicalId at call time', () => {
      const resource = new ProviderResource(stack, 'Server', {
        type: 'test::Type',
      });
      const idToken = resource.getAtt('id');
      const nameToken = resource.getAtt('name');
      const resolved1 = idToken.resolve(
        undefined as unknown as Parameters<IResolvable['resolve']>[0],
      ) as Record<string, unknown>;
      const resolved2 = nameToken.resolve(
        undefined as unknown as Parameters<IResolvable['resolve']>[0],
      ) as Record<string, unknown>;
      expect(resolved1.ref).toBe(resource.logicalId);
      expect(resolved1.attr).toBe('id');
      expect(resolved2.ref).toBe(resource.logicalId);
      expect(resolved2.attr).toBe('name');
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
      expect((entry.properties as Record<string, unknown>).id).toEqual({
        ref: 'some-resource',
        attr: 'id',
      });
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
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
      });
      const json = resource.toJson();
      const entry = json[resource.logicalId] as Record<string, unknown>;
      expect(entry.properties).toEqual({});
    });

    it('uses renderProperties() override when subclass overrides it', () => {
      class MyL1 extends ProviderResource {
        public name = 'from-member';
        public count = 42;

        constructor() {
          super(stack, 'MyL1', { type: 'test::MyType' });
        }

        protected override renderProperties(): Record<string, PropertyValue> {
          return { name: this.name, count: this.count } as Record<
            string,
            PropertyValue
          >;
        }
      }

      const l1 = new MyL1();
      l1.name = 'mutated';

      const json = l1.toJson();
      const entry = json[l1.logicalId] as Record<string, unknown>;
      expect((entry.properties as Record<string, unknown>).name).toBe(
        'mutated',
      );
      expect((entry.properties as Record<string, unknown>).count).toBe(42);
    });
  });

  describe('dependsOn in toJson()', () => {
    it('omits dependsOn when there are no dependencies', () => {
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: { name: 'hello' },
      });
      const entry = resource.toJson()[resource.logicalId] as Record<
        string,
        unknown
      >;
      expect(entry['dependsOn']).toBeUndefined();
    });

    it('emits dependsOn from explicit addDependency() call', () => {
      const dep = new ProviderResource(stack, 'Dep', { type: 'test::Type' });
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
      });
      resource.addDependency(dep);

      const entry = resource.toJson()[resource.logicalId] as Record<
        string,
        unknown
      >;
      expect(entry['dependsOn']).toEqual([dep.logicalId]);
    });

    it('emits dependsOn from { ref, attr } token in properties', () => {
      const dep = new ProviderResource(stack, 'Dep', { type: 'test::Type' });
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties: { networkId: dep.getAtt('networkId') as any },
      });

      const entry = resource.toJson()[resource.logicalId] as Record<
        string,
        unknown
      >;
      expect(entry['dependsOn']).toEqual([dep.logicalId]);
    });

    it('deduplicates when addDependency() and token reference the same resource', () => {
      const dep = new ProviderResource(stack, 'Dep', { type: 'test::Type' });
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties: { networkId: dep.getAtt('networkId') as any },
      });
      resource.addDependency(dep); // explicit + implicit → should appear once

      const entry = resource.toJson()[resource.logicalId] as Record<
        string,
        unknown
      >;
      const dependsOn = entry['dependsOn'] as string[];
      expect(dependsOn).toHaveLength(1);
      expect(dependsOn).toContain(dep.logicalId);
    });

    it('collects refs from tokens nested inside objects and arrays', () => {
      const depA = new ProviderResource(stack, 'DepA', { type: 'test::Type' });
      const depB = new ProviderResource(stack, 'DepB', { type: 'test::Type' });
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: {
          // token nested inside an object
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          nested: { subProp: depA.getAtt('id') as any },
          // token inside an array
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          list: [depB.getAtt('name') as any],
        },
      });

      const entry = resource.toJson()[resource.logicalId] as Record<
        string,
        unknown
      >;
      const dependsOn = entry['dependsOn'] as string[];
      expect(dependsOn).toHaveLength(2);
      expect(dependsOn).toContain(depA.logicalId);
      expect(dependsOn).toContain(depB.logicalId);
    });

    it('emits dependsOn combining addDependency() and multiple tokens', () => {
      const depA = new ProviderResource(stack, 'DepA', { type: 'test::Type' });
      const depB = new ProviderResource(stack, 'DepB', { type: 'test::Type' });
      const depC = new ProviderResource(stack, 'DepC', { type: 'test::Type' });
      const resource = new ProviderResource(stack, 'Res', {
        type: 'test::Type',
        properties: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          networkId: depA.getAtt('networkId') as any,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subnetId: depB.getAtt('subnetId') as any,
        },
      });
      resource.addDependency(depC); // a third explicit dep with no token

      const entry = resource.toJson()[resource.logicalId] as Record<
        string,
        unknown
      >;
      const dependsOn = entry['dependsOn'] as string[];
      expect(dependsOn).toHaveLength(3);
      expect(dependsOn).toContain(depA.logicalId);
      expect(dependsOn).toContain(depB.logicalId);
      expect(dependsOn).toContain(depC.logicalId);
    });
  });
});
