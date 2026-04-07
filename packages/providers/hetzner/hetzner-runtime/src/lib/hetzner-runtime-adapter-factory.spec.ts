import type { RuntimeLogger } from '@cdk-x/core';
import { RuntimeAdapter } from '@cdk-x/engine';
import {
  HetznerRuntimeAdapterFactory,
  HetznerRuntimeAdapterFactoryDeps,
} from './hetzner-runtime-adapter-factory';
import { HetznerProviderRuntime } from './hetzner-provider-runtime';
import type { HetznerSdk } from './hetzner-sdk-facade';

// ─── Helpers ────────────────────────────────────────────────────────────────

function stubSdk(): HetznerSdk {
  return {
    actions: {},
    certificates: {},
    firewalls: {},
    floatingIps: {},
    loadBalancers: {},
    networkActions: {},
    networks: {},
    placementGroups: {},
    primaryIps: {},
    servers: {},
    sshKeys: {},
    volumes: {},
  } as unknown as HetznerSdk;
}

function stubLogger(): RuntimeLogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function defaultDeps(
  overrides: Partial<HetznerRuntimeAdapterFactoryDeps> = {},
): HetznerRuntimeAdapterFactoryDeps {
  return {
    createSdk: jest.fn().mockReturnValue(stubSdk()),
    createRuntime: jest.fn().mockReturnValue(new HetznerProviderRuntime()),
    createLogger: jest.fn().mockReturnValue(stubLogger()),
    resourceConfigs: {
      'Hetzner::Networking::Network': { physicalIdKey: 'networkId' },
    },
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('HetznerRuntimeAdapterFactory', () => {
  describe('providerId', () => {
    it('is "hetzner"', () => {
      const factory = new HetznerRuntimeAdapterFactory();
      expect(factory.providerId).toBe('hetzner');
    });
  });

  describe('create()', () => {
    it('throws when HCLOUD_TOKEN is not set', () => {
      const factory = new HetznerRuntimeAdapterFactory(defaultDeps());

      expect(() => factory.create({})).toThrow(
        /HCLOUD_TOKEN environment variable is not set/,
      );
    });

    it('throws when HCLOUD_TOKEN is empty string', () => {
      const factory = new HetznerRuntimeAdapterFactory(defaultDeps());

      expect(() => factory.create({ HCLOUD_TOKEN: '' })).toThrow(
        /HCLOUD_TOKEN environment variable is not set/,
      );
    });

    it('returns a RuntimeAdapter', () => {
      const deps = defaultDeps();
      const factory = new HetznerRuntimeAdapterFactory(deps);

      const adapter = factory.create({ HCLOUD_TOKEN: 'test-token' });

      expect(adapter).toBeInstanceOf(RuntimeAdapter);
    });

    it('passes the API token to createSdk', () => {
      const deps = defaultDeps();
      const factory = new HetznerRuntimeAdapterFactory(deps);

      factory.create({ HCLOUD_TOKEN: 'my-secret-token' });

      expect(deps.createSdk).toHaveBeenCalledWith({
        apiToken: 'my-secret-token',
      });
    });

    it('uses injected createRuntime', () => {
      const deps = defaultDeps();
      const factory = new HetznerRuntimeAdapterFactory(deps);

      factory.create({ HCLOUD_TOKEN: 'tok' });

      expect(deps.createRuntime).toHaveBeenCalledTimes(1);
    });

    it('uses injected createLogger', () => {
      const deps = defaultDeps();
      const factory = new HetznerRuntimeAdapterFactory(deps);

      factory.create({ HCLOUD_TOKEN: 'tok' });

      expect(deps.createLogger).toHaveBeenCalledTimes(1);
    });

    it('uses default HetznerSdkFactory.create when createSdk is not injected', () => {
      // Omit createSdk — factory should use the real HetznerSdkFactory.create.
      // Since we cannot call the real SDK without network, we verify it
      // does not throw when token is present and the real factory is invoked.
      const deps = defaultDeps({ createSdk: undefined });
      const factory = new HetznerRuntimeAdapterFactory(deps);

      // Real HetznerSdkFactory.create returns an SDK object — no network call.
      const adapter = factory.create({ HCLOUD_TOKEN: 'tok' });
      expect(adapter).toBeInstanceOf(RuntimeAdapter);
    });

    it('uses default HetznerProviderRuntime when createRuntime is not injected', () => {
      const deps = defaultDeps({ createRuntime: undefined });
      const factory = new HetznerRuntimeAdapterFactory(deps);

      const adapter = factory.create({ HCLOUD_TOKEN: 'tok' });
      expect(adapter).toBeInstanceOf(RuntimeAdapter);
    });

    it('uses NoopLogger when createLogger is not injected', () => {
      const deps = defaultDeps({ createLogger: undefined });
      const factory = new HetznerRuntimeAdapterFactory(deps);

      const adapter = factory.create({ HCLOUD_TOKEN: 'tok' });
      expect(adapter).toBeInstanceOf(RuntimeAdapter);
    });

    it('uses default RESOURCE_CONFIGS when resourceConfigs is not injected', () => {
      const deps = defaultDeps({ resourceConfigs: undefined });
      const factory = new HetznerRuntimeAdapterFactory(deps);

      const adapter = factory.create({ HCLOUD_TOKEN: 'tok' });
      expect(adapter).toBeInstanceOf(RuntimeAdapter);
    });

    it('works with no deps at all (all defaults)', () => {
      const factory = new HetznerRuntimeAdapterFactory();

      const adapter = factory.create({ HCLOUD_TOKEN: 'tok' });
      expect(adapter).toBeInstanceOf(RuntimeAdapter);
    });
  });
});
