import { RuntimeLogger } from '@cdkx-io/core';
import { HetznerSubnetHandler } from './subnet-handler';
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

/** Fake Hetzner subnet object matching the SDK response shape. */
function fakeSubnet(overrides?: Record<string, unknown>) {
  return {
    type: 'cloud',
    ip_range: '10.0.1.0/24',
    network_zone: 'eu-central',
    gateway: '10.0.1.1',
    vswitch_id: null,
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
      addNetworkSubnet: jest.fn(),
      deleteNetworkSubnet: jest.fn(),
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

describe('HetznerSubnetHandler', () => {
  let handler: HetznerSubnetHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerSubnetHandler();
    logger = stubLogger();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('calls addNetworkSubnet with snake_case params', async () => {
      const sdk = stubSdk({
        addNetworkSubnet: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              subnets: [fakeSubnet()],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        networkId: 42,
        type: 'cloud',
        networkZone: 'eu-central',
        ipRange: '10.0.1.0/24',
      });

      expect(sdk.networkActions.addNetworkSubnet).toHaveBeenCalledWith(42, {
        type: 'cloud',
        network_zone: 'eu-central',
        ip_range: '10.0.1.0/24',
        vswitch_id: undefined,
      });
    });

    it('returns state with composite physicalId', async () => {
      const sdk = stubSdk({
        addNetworkSubnet: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              subnets: [
                fakeSubnet({
                  type: 'server',
                  ip_range: '10.0.2.0/24',
                  network_zone: 'us-east',
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
        type: 'server',
        networkZone: 'us-east',
        ipRange: '10.0.2.0/24',
      });

      expect(state).toEqual({
        physicalId: '42/10.0.2.0/24',
        networkId: 42,
        type: 'server',
        networkZone: 'us-east',
        ipRange: '10.0.2.0/24',
        gateway: '10.0.2.1',
        vswitchId: undefined,
      });
    });

    it('finds auto-assigned subnet by type and zone when ipRange not provided', async () => {
      const sdk = stubSdk({
        addNetworkSubnet: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              subnets: [
                fakeSubnet({
                  type: 'cloud',
                  ip_range: '10.0.1.0/24',
                  network_zone: 'eu-central',
                }),
                fakeSubnet({
                  type: 'server',
                  ip_range: '10.0.2.0/24',
                  network_zone: 'eu-central',
                }),
              ],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        networkId: 42,
        type: 'server',
        networkZone: 'eu-central',
        // No ipRange - should auto-detect
      });

      expect(state.ipRange).toBe('10.0.2.0/24');
    });

    it('throws when subnet is not found after creation', async () => {
      const sdk = stubSdk({
        addNetworkSubnet: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              subnets: [],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, {
          networkId: 42,
          type: 'cloud',
          networkZone: 'eu-central',
          ipRange: '10.0.1.0/24',
        }),
      ).rejects.toThrow(/Subnet not found/i);
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        addNetworkSubnet: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              subnets: [fakeSubnet()],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        networkId: 42,
        type: 'cloud',
        networkZone: 'eu-central',
        ipRange: '10.0.1.0/24',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.subnet.create',
        { networkId: 42, ipRange: '10.0.1.0/24' },
      );
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('throws because subnets cannot be updated', async () => {
      await expect(handler.update()).rejects.toThrow(
        /Subnets cannot be updated/i,
      );
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('calls deleteNetworkSubnet with networkId and ipRange', async () => {
      const sdk = stubSdk({
        deleteNetworkSubnet: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        physicalId: '42/10.0.1.0/24',
        networkId: 42,
        type: 'cloud',
        networkZone: 'eu-central',
        ipRange: '10.0.1.0/24',
      });

      expect(sdk.networkActions.deleteNetworkSubnet).toHaveBeenCalledWith(42, {
        ip_range: '10.0.1.0/24',
      });
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deleteNetworkSubnet: jest
          .fn()
          .mockResolvedValue({ data: { action: { id: 123 } } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        physicalId: '42/10.0.1.0/24',
        networkId: 42,
        type: 'cloud',
        networkZone: 'eu-central',
        ipRange: '10.0.1.0/24',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.subnet.delete',
        { physicalId: '42/10.0.1.0/24' },
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('finds a subnet by networkId and ipRange', async () => {
      const sdk = stubSdk({
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              subnets: [
                fakeSubnet({ ip_range: '10.0.1.0/24', type: 'cloud' }),
                fakeSubnet({ ip_range: '10.0.2.0/24', type: 'server' }),
              ],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        networkId: 42,
        type: 'server',
        networkZone: 'eu-central',
        ipRange: '10.0.2.0/24',
      });

      expect(state.ipRange).toBe('10.0.2.0/24');
      expect(state.type).toBe('server');
      expect(sdk.networks.getNetwork).toHaveBeenCalledWith(42);
    });

    it('throws when subnet is not found', async () => {
      const sdk = stubSdk({
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              subnets: [fakeSubnet({ ip_range: '10.0.1.0/24' })],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          networkId: 42,
          type: 'cloud',
          networkZone: 'eu-central',
          ipRange: '10.0.99.0/24',
        }),
      ).rejects.toThrow(/Subnet not found/i);
    });

    it('throws when ipRange is not provided', async () => {
      const sdk = stubSdk({
        getNetwork: jest.fn().mockResolvedValue({
          data: {
            network: {
              id: 42,
              subnets: [fakeSubnet()],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          networkId: 42,
          type: 'cloud',
          networkZone: 'eu-central',
          // ipRange is undefined
        }),
      ).rejects.toThrow(/ipRange is required/i);
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
          type: 'cloud',
          networkZone: 'eu-central',
          ipRange: '10.0.1.0/24',
        }),
      ).rejects.toThrow(/network not found/i);
    });
  });
});
