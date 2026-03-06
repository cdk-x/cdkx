import { AdapterRegistry } from './adapter-registry.js';
import type { ProviderAdapter, ProviderAdapterFactory } from '@cdkx-io/engine';

function makeFactory(
  providerId: string,
  adapter?: Partial<ProviderAdapter>,
): ProviderAdapterFactory {
  return {
    providerId,
    create: () => adapter as ProviderAdapter,
  };
}

describe('AdapterRegistry', () => {
  describe('register()', () => {
    it('returns this for chaining', () => {
      const registry = new AdapterRegistry();
      const factory = makeFactory('hetzner');
      expect(registry.register(factory)).toBe(registry);
    });

    it('replaces an existing factory when the same providerId is registered twice', () => {
      const registry = new AdapterRegistry();
      const first = makeFactory('hetzner');
      const second = makeFactory('hetzner');
      registry.register(first).register(second);

      const adapters = registry.build(['hetzner'], {});
      // second.create was called, not first.create
      expect(adapters['hetzner']).toBe(second.create({}));
    });
  });

  describe('build()', () => {
    it('returns an empty object when providerIds is empty', () => {
      const registry = new AdapterRegistry().register(makeFactory('hetzner'));
      expect(registry.build([], {})).toEqual({});
    });

    it('returns adapters keyed by provider ID', () => {
      const hetznerAdapter = {} as ProviderAdapter;
      const k8sAdapter = {} as ProviderAdapter;
      const registry = new AdapterRegistry()
        .register(makeFactory('hetzner', hetznerAdapter))
        .register(makeFactory('kubernetes', k8sAdapter));

      const result = registry.build(['hetzner', 'kubernetes'], {});
      expect(result['hetzner']).toBe(hetznerAdapter);
      expect(result['kubernetes']).toBe(k8sAdapter);
    });

    it('passes env to factory.create()', () => {
      const createFn = jest.fn().mockReturnValue({} as ProviderAdapter);
      const factory: ProviderAdapterFactory = {
        providerId: 'hetzner',
        create: createFn,
      };
      const registry = new AdapterRegistry().register(factory);
      const env = { HCLOUD_TOKEN: 'tok123' };

      registry.build(['hetzner'], env);
      expect(createFn).toHaveBeenCalledWith(env);
    });

    it('throws before creating any adapter when a provider has no factory', () => {
      const createFn = jest.fn().mockReturnValue({} as ProviderAdapter);
      const factory: ProviderAdapterFactory = {
        providerId: 'hetzner',
        create: createFn,
      };
      const registry = new AdapterRegistry().register(factory);

      expect(() => registry.build(['hetzner', 'unknown'], {})).toThrow(
        "No adapter factory registered for provider 'unknown'",
      );
      // create() was never called because we throw before building
      expect(createFn).not.toHaveBeenCalled();
    });

    it('error message includes registered provider IDs', () => {
      const registry = new AdapterRegistry().register(makeFactory('hetzner'));

      expect(() => registry.build(['missing'], {})).toThrow('hetzner');
    });

    it('error message says "(none)" when registry is empty', () => {
      const registry = new AdapterRegistry();

      expect(() => registry.build(['hetzner'], {})).toThrow('(none)');
    });
  });
});
