import { RuntimeLogger } from '@cdk-x/core';
import { FloatingIpType, Location } from '@cdk-x/hetzner';
import { HetznerFloatingIpHandler } from './floating-ip-handler';
import { HetznerRuntimeContext } from '../../hetzner-runtime-context';
import { HetznerSdk } from '../../hetzner-sdk-facade';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function fakeFloatingIp(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    name: 'my-ip',
    description: 'test ip',
    type: 'ipv4',
    ip: '1.2.3.4',
    home_location: { id: 1, name: 'fsn1' },
    server: null,
    labels: { env: 'test' },
    blocked: false,
    created: '2024-01-01T00:00:00Z',
    dns_ptr: [],
    protection: { delete: false },
    ...overrides,
  };
}

function stubSdk(overrides?: Partial<HetznerSdk['floatingIps']>): HetznerSdk {
  return {
    floatingIps: {
      createFloatingIp: jest.fn(),
      updateFloatingIp: jest.fn(),
      deleteFloatingIp: jest.fn(),
      listFloatingIps: jest.fn(),
      getFloatingIp: jest.fn(),
      ...overrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerFloatingIpHandler', () => {
  let handler: HetznerFloatingIpHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerFloatingIpHandler();
    logger = stubLogger();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('calls createFloatingIp with snake_case params', async () => {
      const sdk = stubSdk({
        createFloatingIp: jest.fn().mockResolvedValue({
          data: { floating_ip: fakeFloatingIp() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        type: FloatingIpType.IPV4,
        homeLocation: 'fsn1' as never,
        name: 'my-ip',
        description: 'test ip',
        labels: { env: 'test' },
      });

      expect(sdk.floatingIps.createFloatingIp).toHaveBeenCalledWith({
        type: 'ipv4',
        home_location: 'fsn1',
        name: 'my-ip',
        description: 'test ip',
        labels: { env: 'test' },
      });
    });

    it('returns state with floatingIpId', async () => {
      const sdk = stubSdk({
        createFloatingIp: jest.fn().mockResolvedValue({
          data: {
            floating_ip: fakeFloatingIp({
              id: 42,
              name: 'my-ip',
              description: 'test ip',
              type: 'ipv4',
              home_location: { id: 1, name: 'fsn1' },
              labels: { env: 'test' },
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        type: FloatingIpType.IPV4,
        homeLocation: Location.FSN1,
        name: 'my-ip',
      });

      expect(state).toEqual({
        floatingIpId: 42,
        type: FloatingIpType.IPV4,
        name: 'my-ip',
        description: 'test ip',
        homeLocation: 'fsn1',
        labels: { env: 'test' },
      });
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        createFloatingIp: jest.fn().mockResolvedValue({
          data: { floating_ip: fakeFloatingIp() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        type: FloatingIpType.IPV4,
        homeLocation: Location.FSN1,
        name: 'my-ip',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.floating-ip.create',
        { name: 'my-ip' },
      );
    });

    it('throws when API returns no floating_ip object', async () => {
      const sdk = stubSdk({
        createFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { floating_ip: undefined } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, {
          type: FloatingIpType.IPV4,
          homeLocation: Location.FSN1,
        }),
      ).rejects.toThrow(/no floating.ip object/i);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('calls updateFloatingIp with id and snake_case fields', async () => {
      const sdk = stubSdk({
        updateFloatingIp: jest.fn().mockResolvedValue({
          data: {
            floating_ip: fakeFloatingIp({
              name: 'renamed',
              description: 'new',
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        {
          type: FloatingIpType.IPV4,
          homeLocation: Location.FSN1,
          name: 'renamed',
          description: 'new',
          labels: { a: '1' },
        },
        {
          floatingIpId: 7,
          type: FloatingIpType.IPV4,
          homeLocation: Location.FSN1,
          name: 'my-ip',
          description: 'old',
          labels: {},
        },
      );

      expect(sdk.floatingIps.updateFloatingIp).toHaveBeenCalledWith(7, {
        name: 'renamed',
        description: 'new',
        labels: { a: '1' },
      });
    });

    it('returns updated state', async () => {
      const sdk = stubSdk({
        updateFloatingIp: jest.fn().mockResolvedValue({
          data: {
            floating_ip: fakeFloatingIp({
              id: 7,
              name: 'renamed',
              description: 'new',
              labels: { a: '1' },
              home_location: { id: 1, name: 'fsn1' },
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        {
          type: FloatingIpType.IPV4,
          homeLocation: Location.FSN1,
          name: 'renamed',
          description: 'new',
          labels: { a: '1' },
        },
        {
          floatingIpId: 7,
          type: FloatingIpType.IPV4,
          homeLocation: Location.FSN1,
          name: 'my-ip',
          description: 'old',
          labels: {},
        },
      );

      expect(state.name).toBe('renamed');
      expect(state.description).toBe('new');
      expect(state.labels).toEqual({ a: '1' });
    });

    it('throws when API returns no floating_ip object', async () => {
      const sdk = stubSdk({
        updateFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { floating_ip: null } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.update(
          ctx,
          { type: FloatingIpType.IPV4, homeLocation: Location.FSN1, name: 'x' },
          {
            floatingIpId: 1,
            type: FloatingIpType.IPV4,
            homeLocation: Location.FSN1,
            name: 'x',
            labels: {},
          },
        ),
      ).rejects.toThrow(/no floating.ip object/i);
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('calls deleteFloatingIp with floatingIpId', async () => {
      const sdk = stubSdk({
        deleteFloatingIp: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        floatingIpId: 5,
        type: FloatingIpType.IPV4,
        homeLocation: Location.FSN1,
        name: 'my-ip',
        labels: {},
      });

      expect(sdk.floatingIps.deleteFloatingIp).toHaveBeenCalledWith(5);
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deleteFloatingIp: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        floatingIpId: 5,
        type: FloatingIpType.IPV4,
        homeLocation: Location.FSN1,
        name: 'my-ip',
        labels: {},
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.floating-ip.delete',
        { floatingIpId: 5 },
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('finds a floating IP by name', async () => {
      const sdk = stubSdk({
        listFloatingIps: jest.fn().mockResolvedValue({
          data: { floating_ips: [fakeFloatingIp({ id: 99 })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        type: FloatingIpType.IPV4,
        homeLocation: Location.FSN1,
        name: 'my-ip',
      });

      expect(state.floatingIpId).toBe(99);
      expect(sdk.floatingIps.listFloatingIps).toHaveBeenCalledWith('my-ip');
    });

    it('throws when floating IP is not found', async () => {
      const sdk = stubSdk({
        listFloatingIps: jest.fn().mockResolvedValue({
          data: { floating_ips: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          type: FloatingIpType.IPV4,
          homeLocation: Location.FSN1,
          name: 'missing',
        }),
      ).rejects.toThrow(/not found.*missing/i);
    });

    it('defaults labels to empty object when API returns undefined', async () => {
      const sdk = stubSdk({
        listFloatingIps: jest.fn().mockResolvedValue({
          data: {
            floating_ips: [fakeFloatingIp({ labels: undefined })],
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        type: FloatingIpType.IPV4,
        homeLocation: Location.FSN1,
        name: 'my-ip',
      });

      expect(state.labels).toEqual({});
    });
  });
});
