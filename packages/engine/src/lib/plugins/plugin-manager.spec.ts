import { PluginManager, PluginError } from './plugin-manager';
import type { ProviderAdapter, ProviderAdapterFactory } from '../adapter';

// ─── Stub factory ─────────────────────────────────────────────────────────────

class StubFactory implements ProviderAdapterFactory {
  readonly providerId = 'hetzner';
  readonly lastEnv: NodeJS.ProcessEnv[] = [];

  create(env: NodeJS.ProcessEnv): ProviderAdapter {
    this.lastEnv.push(env);
    return {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getOutput: jest.fn(),
    } as unknown as ProviderAdapter;
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PluginManager', () => {
  // ── registeredProviders ───────────────────────────────────────────

  describe('registeredProviders', () => {
    it('returns the list of statically registered provider IDs', () => {
      const ids = PluginManager.registeredProviders();
      expect(ids).toContain('hetzner');
    });
  });

  // ── buildAdapters — happy path ────────────────────────────────────

  describe('buildAdapters', () => {
    it('loads the package, instantiates the factory, and calls create(env)', () => {
      const stubFactory = new StubFactory();
      const fakeModule = { AdapterFactory: class {} };

      // Make the fake constructor return our stub
      Object.defineProperty(fakeModule, 'AdapterFactory', {
        value: class {
          readonly providerId = 'hetzner';
          create(env: NodeJS.ProcessEnv): ProviderAdapter {
            return stubFactory.create(env);
          }
        },
      });

      const manager = new PluginManager({
        requireModule: (id: string) => {
          expect(id).toBe('@cdk-x/hetzner-runtime');
          return fakeModule;
        },
      });

      const env = { HCLOUD_TOKEN: 'test-token' };
      const adapters = manager.buildAdapters(['hetzner'], env);

      expect(adapters).toHaveProperty('hetzner');
      expect(stubFactory.lastEnv).toHaveLength(1);
      expect(stubFactory.lastEnv[0]).toBe(env);
    });

    it('returns one adapter per provider ID', () => {
      const fakeModule = {
        AdapterFactory: class implements ProviderAdapterFactory {
          readonly providerId = 'hetzner';
          create(): ProviderAdapter {
            return {
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              getOutput: jest.fn(),
            } as unknown as ProviderAdapter;
          }
        },
      };

      const manager = new PluginManager({
        requireModule: () => fakeModule,
      });

      const adapters = manager.buildAdapters(['hetzner'], {});
      expect(Object.keys(adapters)).toEqual(['hetzner']);
    });

    it('returns an empty record when given an empty provider list', () => {
      const manager = new PluginManager({
        requireModule: () => {
          throw new Error('should not be called');
        },
      });

      const adapters = manager.buildAdapters([], {});
      expect(adapters).toEqual({});
    });
  });

  // ── buildAdapters — error cases ───────────────────────────────────

  describe('error handling', () => {
    it('throws PluginError for an unknown provider ID', () => {
      const manager = new PluginManager();

      expect(() => manager.buildAdapters(['unknown-cloud'], {})).toThrow(
        PluginError,
      );

      try {
        manager.buildAdapters(['unknown-cloud'], {});
      } catch (err) {
        const pluginErr = err as PluginError;
        expect(pluginErr.providerId).toBe('unknown-cloud');
        expect(pluginErr.message).toContain("Unknown provider 'unknown-cloud'");
        expect(pluginErr.message).toContain('hetzner');
      }
    });

    it('throws PluginError when require() fails', () => {
      const manager = new PluginManager({
        requireModule: () => {
          throw new Error('Cannot find module');
        },
      });

      expect(() => manager.buildAdapters(['hetzner'], {})).toThrow(PluginError);

      try {
        manager.buildAdapters(['hetzner'], {});
      } catch (err) {
        const pluginErr = err as PluginError;
        expect(pluginErr.providerId).toBe('hetzner');
        expect(pluginErr.message).toContain('Failed to load package');
        expect(pluginErr.message).toContain('Cannot find module');
      }
    });

    it('throws PluginError when the module does not export AdapterFactory', () => {
      const manager = new PluginManager({
        requireModule: () => ({ SomeOtherExport: class {} }),
      });

      expect(() => manager.buildAdapters(['hetzner'], {})).toThrow(PluginError);

      try {
        manager.buildAdapters(['hetzner'], {});
      } catch (err) {
        const pluginErr = err as PluginError;
        expect(pluginErr.message).toContain("does not export 'AdapterFactory'");
      }
    });

    it('throws PluginError when AdapterFactory is not a constructor', () => {
      const manager = new PluginManager({
        requireModule: () => ({ AdapterFactory: 'not-a-function' }),
      });

      expect(() => manager.buildAdapters(['hetzner'], {})).toThrow(PluginError);
    });

    it('throws PluginError when instantiated factory has no create method', () => {
      const manager = new PluginManager({
        requireModule: () => ({
          AdapterFactory: class {
            /* no create() */
          },
        }),
      });

      expect(() => manager.buildAdapters(['hetzner'], {})).toThrow(PluginError);

      try {
        manager.buildAdapters(['hetzner'], {});
      } catch (err) {
        const pluginErr = err as PluginError;
        expect(pluginErr.message).toContain('does not implement create()');
      }
    });

    it('propagates factory.create() errors as-is (not wrapped in PluginError)', () => {
      const manager = new PluginManager({
        requireModule: () => ({
          AdapterFactory: class implements ProviderAdapterFactory {
            readonly providerId = 'hetzner';
            create(): ProviderAdapter {
              throw new Error('HCLOUD_TOKEN is not set.');
            }
          },
        }),
      });

      expect(() => manager.buildAdapters(['hetzner'], {})).toThrow(
        'HCLOUD_TOKEN is not set.',
      );
    });
  });

  // ── PluginError ───────────────────────────────────────────────────

  describe('PluginError', () => {
    it('has name "PluginError"', () => {
      const err = new PluginError('test');
      expect(err.name).toBe('PluginError');
    });

    it('stores the provider ID', () => {
      const err = new PluginError('my-provider');
      expect(err.providerId).toBe('my-provider');
    });

    it('uses custom cause when provided', () => {
      const err = new PluginError('hetzner', 'Something went wrong');
      expect(err.message).toBe(
        "Plugin error for provider 'hetzner': Something went wrong",
      );
    });

    it('lists registered providers when no cause is given', () => {
      const err = new PluginError('unknown');
      expect(err.message).toContain('hetzner');
    });
  });
});
