import { RuntimeLogger } from '@cdkx-io/core';
import { HetznerNetworkHandler } from './network-handler';
import { HetznerRuntimeContext } from '../hetzner-runtime-context';
import { HetznerSdk } from '../hetzner-sdk-facade';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal stub logger that records calls. */
function stubLogger(): RuntimeLogger {
  const noop = jest.fn();
  const logger: RuntimeLogger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: jest.fn(() => logger),
  };
  return logger;
}

/** Fake Hetzner network object matching the SDK response shape. */
function fakeNetwork(overrides?: Record<string, unknown>) {
  return {
    id: 42,
    name: 'my-net',
    ip_range: '10.0.0.0/8',
    labels: { env: 'test' },
    expose_routes_to_vswitch: false,
    ...overrides,
  };
}

/** Creates an HetznerSdk stub with only the `networks` API mocked. */
function stubSdk(overrides?: Partial<HetznerSdk['networks']>): HetznerSdk {
  return {
    networks: {
      createNetwork: jest.fn(),
      updateNetwork: jest.fn(),
      deleteNetwork: jest.fn(),
      listNetworks: jest.fn(),
      ...overrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerNetworkHandler', () => {
  let handler: HetznerNetworkHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerNetworkHandler();
    logger = stubLogger();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('calls createNetwork with snake_case params', async () => {
      const sdk = stubSdk({
        createNetwork: jest.fn().mockResolvedValue({
          data: { network: fakeNetwork() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-net',
        ipRange: '10.0.0.0/8',
        labels: { env: 'test' },
        exposeRoutesToVswitch: false,
      });

      expect(sdk.networks.createNetwork).toHaveBeenCalledWith({
        name: 'my-net',
        ip_range: '10.0.0.0/8',
        labels: { env: 'test' },
        expose_routes_to_vswitch: false,
      });
    });

    it('returns state with camelCase keys', async () => {
      const sdk = stubSdk({
        createNetwork: jest.fn().mockResolvedValue({
          data: {
            network: fakeNetwork({
              id: 99,
              name: 'new-net',
              ip_range: '10.1.0.0/16',
              labels: {},
              expose_routes_to_vswitch: true,
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        name: 'new-net',
        ipRange: '10.1.0.0/16',
        exposeRoutesToVswitch: true,
      });

      expect(state).toEqual({
        networkId: 99,
        name: 'new-net',
        ipRange: '10.1.0.0/16',
        labels: {},
        exposeRoutesToVswitch: true,
      });
    });

    it('throws when API returns no network object', async () => {
      const sdk = stubSdk({
        createNetwork: jest
          .fn()
          .mockResolvedValue({ data: { network: undefined } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, { name: 'x', ipRange: '10.0.0.0/8' }),
      ).rejects.toThrow(/no network object/i);
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        createNetwork: jest.fn().mockResolvedValue({
          data: { network: fakeNetwork() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-net',
        ipRange: '10.0.0.0/8',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.network.create',
        { name: 'my-net' },
      );
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('calls updateNetwork with snake_case params', async () => {
      const sdk = stubSdk({
        updateNetwork: jest.fn().mockResolvedValue({
          data: { network: fakeNetwork({ name: 'renamed' }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'renamed', ipRange: '10.0.0.0/8' },
        {
          networkId: 42,
          name: 'my-net',
          ipRange: '10.0.0.0/8',
          labels: {},
          exposeRoutesToVswitch: false,
        },
      );

      expect(sdk.networks.updateNetwork).toHaveBeenCalledWith(42, {
        name: 'renamed',
        labels: undefined,
        expose_routes_to_vswitch: undefined,
      });
    });

    it('returns updated state', async () => {
      const sdk = stubSdk({
        updateNetwork: jest.fn().mockResolvedValue({
          data: {
            network: fakeNetwork({ name: 'renamed', labels: { a: '1' } }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { name: 'renamed', ipRange: '10.0.0.0/8', labels: { a: '1' } },
        {
          networkId: 42,
          name: 'old',
          ipRange: '10.0.0.0/8',
          labels: {},
          exposeRoutesToVswitch: false,
        },
      );

      expect(state.name).toBe('renamed');
      expect(state.labels).toEqual({ a: '1' });
    });

    it('throws when API returns no network object', async () => {
      const sdk = stubSdk({
        updateNetwork: jest.fn().mockResolvedValue({ data: { network: null } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.update(
          ctx,
          { name: 'x', ipRange: '10.0.0.0/8' },
          {
            networkId: 1,
            name: 'x',
            ipRange: '10.0.0.0/8',
            labels: {},
            exposeRoutesToVswitch: false,
          },
        ),
      ).rejects.toThrow(/no network object/i);
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('calls deleteNetwork with the networkId', async () => {
      const sdk = stubSdk({
        deleteNetwork: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        networkId: 42,
        name: 'my-net',
        ipRange: '10.0.0.0/8',
        labels: {},
        exposeRoutesToVswitch: false,
      });

      expect(sdk.networks.deleteNetwork).toHaveBeenCalledWith(42);
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deleteNetwork: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        networkId: 42,
        name: 'my-net',
        ipRange: '10.0.0.0/8',
        labels: {},
        exposeRoutesToVswitch: false,
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.network.delete',
        { networkId: 42 },
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('finds a network by name', async () => {
      const sdk = stubSdk({
        listNetworks: jest.fn().mockResolvedValue({
          data: { networks: [fakeNetwork({ id: 77 })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-net',
        ipRange: '10.0.0.0/8',
      });

      expect(state.networkId).toBe(77);
      expect(sdk.networks.listNetworks).toHaveBeenCalledWith(
        undefined,
        'my-net',
      );
    });

    it('throws when network is not found', async () => {
      const sdk = stubSdk({
        listNetworks: jest.fn().mockResolvedValue({
          data: { networks: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { name: 'missing', ipRange: '10.0.0.0/8' }),
      ).rejects.toThrow(/not found.*missing/i);
    });

    it('defaults labels to empty object when API returns undefined', async () => {
      const sdk = stubSdk({
        listNetworks: jest.fn().mockResolvedValue({
          data: {
            networks: [fakeNetwork({ labels: undefined })],
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-net',
        ipRange: '10.0.0.0/8',
      });

      expect(state.labels).toEqual({});
    });
  });
});
