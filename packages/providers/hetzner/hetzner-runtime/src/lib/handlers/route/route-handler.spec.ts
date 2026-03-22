import { RuntimeLogger } from '@cdkx-io/core';
import { HetznerRouteHandler } from './route-handler';
import { HetznerRuntimeContext } from '../../hetzner-runtime-context';
import { HetznerSdk } from '../../hetzner-sdk-facade';

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

/** Fake Hetzner route object matching the SDK response shape. */
function fakeRoute(overrides?: Record<string, unknown>) {
  return {
    destination: '10.100.1.0/24',
    gateway: '10.0.1.1',
    ...overrides,
  };
}

/** Creates an HetznerSdk stub with network actions and networks API mocked. */
function stubSdk(
  overrides?: Partial<HetznerSdk['networkActions'] & HetznerSdk['networks']>,
): HetznerSdk {
  return {
    actions: {
      getAction: jest
        .fn()
        .mockResolvedValue({ data: { action: { status: 'success' } } }),
    },
    networkActions: {
      addNetworkRoute: jest.fn(),
      deleteNetworkRoute: jest.fn(),
      ...overrides,
    },
    networks: {
      getNetwork: jest.fn(),
      ...overrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerRouteHandler', () => {
  let handler: HetznerRouteHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerRouteHandler();
    logger = stubLogger();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('calls addNetworkRoute with destination and gateway', async () => {
      const sdk = stubSdk({
        addNetworkRoute: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              routes: [fakeRoute()],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        networkId: 42,
        destination: '10.100.1.0/24',
        gateway: '10.0.1.1',
      });

      expect(sdk.networkActions.addNetworkRoute).toHaveBeenCalledWith(42, {
        destination: '10.100.1.0/24',
        gateway: '10.0.1.1',
      });
    });

    it('returns state with composite physicalId', async () => {
      const sdk = stubSdk({
        addNetworkRoute: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              routes: [
                fakeRoute({
                  destination: '10.100.2.0/24',
                  gateway: '10.0.2.1',
                }),
              ],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        networkId: 42,
        destination: '10.100.2.0/24',
        gateway: '10.0.2.1',
      });

      expect(state).toEqual({
        physicalId: '42/10.100.2.0/24',
        networkId: 42,
        destination: '10.100.2.0/24',
        gateway: '10.0.2.1',
      });
    });

    it('throws when route is not found after creation', async () => {
      const sdk = stubSdk({
        addNetworkRoute: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              routes: [],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, {
          networkId: 42,
          destination: '10.100.1.0/24',
          gateway: '10.0.1.1',
        }),
      ).rejects.toThrow(/Route not found/i);
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        addNetworkRoute: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              routes: [fakeRoute()],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        networkId: 42,
        destination: '10.100.1.0/24',
        gateway: '10.0.1.1',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.route.create',
        { networkId: 42, destination: '10.100.1.0/24', gateway: '10.0.1.1' },
      );
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('throws because routes cannot be updated', async () => {
      await expect(handler.update()).rejects.toThrow(
        /Routes cannot be updated/i,
      );
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('calls deleteNetworkRoute with networkId, destination and gateway', async () => {
      const sdk = stubSdk({
        deleteNetworkRoute: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        physicalId: '42/10.100.1.0/24',
        networkId: 42,
        destination: '10.100.1.0/24',
        gateway: '10.0.1.1',
      });

      expect(sdk.networkActions.deleteNetworkRoute).toHaveBeenCalledWith(42, {
        destination: '10.100.1.0/24',
        gateway: '10.0.1.1',
      });
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deleteNetworkRoute: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        physicalId: '42/10.100.1.0/24',
        networkId: 42,
        destination: '10.100.1.0/24',
        gateway: '10.0.1.1',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.route.delete',
        { physicalId: '42/10.100.1.0/24' },
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('finds a route by networkId and destination', async () => {
      const sdk = stubSdk({
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              routes: [
                fakeRoute({ destination: '10.100.1.0/24' }),
                fakeRoute({
                  destination: '10.100.2.0/24',
                  gateway: '10.0.2.1',
                }),
              ],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        networkId: 42,
        destination: '10.100.2.0/24',
        gateway: '10.0.2.1',
      });

      expect(state.destination).toBe('10.100.2.0/24');
      expect(state.gateway).toBe('10.0.2.1');
      expect(sdk.networks.getNetwork).toHaveBeenCalledWith(42);
    });

    it('throws when route is not found', async () => {
      const sdk = stubSdk({
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              routes: [fakeRoute({ destination: '10.100.1.0/24' })],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          networkId: 42,
          destination: '10.100.99.0/24',
          gateway: '10.0.99.1',
        }),
      ).rejects.toThrow(/Route not found/i);
    });

    it('throws when network is not found', async () => {
      const sdk = stubSdk({
        getNetwork: jest.fn().mockResolvedValue({
          data: { network: undefined },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          networkId: 999,
          destination: '10.100.1.0/24',
          gateway: '10.0.1.1',
        }),
      ).rejects.toThrow(/network not found/i);
    });
  });
});
