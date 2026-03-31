import { RuntimeLogger } from '@cdkx-io/core';
import { PrimaryIpAssigneeType, PrimaryIpType } from '@cdkx-io/hetzner';
import { HetznerPrimaryIpHandler } from './primary-ip-handler';
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

function fakePrimaryIp(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    name: 'my-ip',
    type: 'ipv4',
    assignee_type: 'server',
    assignee_id: null,
    auto_delete: false,
    labels: { env: 'test' },
    ip: '1.2.3.4',
    blocked: false,
    created: '2024-01-01T00:00:00Z',
    dns_ptr: [],
    protection: { delete: false },
    datacenter: { id: 1, name: 'fsn1-dc14', description: '', location: {} },
    location: { id: 1, name: 'fsn1' },
    ...overrides,
  };
}

function stubSdk(overrides?: Partial<HetznerSdk['primaryIps']>): HetznerSdk {
  return {
    primaryIps: {
      createPrimaryIp: jest.fn(),
      updatePrimaryIp: jest.fn(),
      deletePrimaryIp: jest.fn(),
      listPrimaryIps: jest.fn(),
      getPrimaryIp: jest.fn(),
      ...overrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerPrimaryIpHandler', () => {
  let handler: HetznerPrimaryIpHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerPrimaryIpHandler();
    logger = stubLogger();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('calls createPrimaryIp with snake_case params', async () => {
      const sdk = stubSdk({
        createPrimaryIp: jest.fn().mockResolvedValue({
          data: { primary_ip: fakePrimaryIp() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-ip',
        type: PrimaryIpType.IPV4,
        assigneeType: PrimaryIpAssigneeType.SERVER,
        location: 'fsn1' as never,
        labels: { env: 'test' },
        autoDelete: false,
      });

      expect(sdk.primaryIps.createPrimaryIp).toHaveBeenCalledWith({
        name: 'my-ip',
        type: 'ipv4',
        assignee_type: 'server',
        location: 'fsn1',
        labels: { env: 'test' },
        auto_delete: false,
      });
    });

    it('returns state with id', async () => {
      const sdk = stubSdk({
        createPrimaryIp: jest.fn().mockResolvedValue({
          data: {
            primary_ip: fakePrimaryIp({
              id: 42,
              name: 'my-ip',
              type: 'ipv4',
              assignee_type: 'server',
              assignee_id: null,
              auto_delete: true,
              labels: { env: 'test' },
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        name: 'my-ip',
        type: PrimaryIpType.IPV4,
        assigneeType: PrimaryIpAssigneeType.SERVER,
      });

      expect(state).toEqual({
        primaryIpId: 42,
        name: 'my-ip',
        type: PrimaryIpType.IPV4,
        assigneeType: PrimaryIpAssigneeType.SERVER,
        assigneeId: null,
        autoDelete: true,
        labels: { env: 'test' },
      });
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        createPrimaryIp: jest.fn().mockResolvedValue({
          data: { primary_ip: fakePrimaryIp() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-ip',
        type: PrimaryIpType.IPV4,
        assigneeType: PrimaryIpAssigneeType.SERVER,
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.primary-ip.create',
        { name: 'my-ip' },
      );
    });

    it('throws when API returns no primary_ip object', async () => {
      const sdk = stubSdk({
        createPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { primary_ip: undefined } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, {
          name: 'my-ip',
          type: PrimaryIpType.IPV4,
          assigneeType: PrimaryIpAssigneeType.SERVER,
        }),
      ).rejects.toThrow(/no primary.ip object/i);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('calls updatePrimaryIp with id and snake_case fields', async () => {
      const sdk = stubSdk({
        updatePrimaryIp: jest.fn().mockResolvedValue({
          data: {
            primary_ip: fakePrimaryIp({ name: 'renamed', auto_delete: true }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        {
          name: 'renamed',
          type: PrimaryIpType.IPV4,
          assigneeType: PrimaryIpAssigneeType.SERVER,
          labels: { a: '1' },
          autoDelete: true,
        },
        {
          primaryIpId: 7,
          name: 'my-ip',
          type: PrimaryIpType.IPV4,
          assigneeType: PrimaryIpAssigneeType.SERVER,
          labels: {},
          autoDelete: false,
        },
      );

      expect(sdk.primaryIps.updatePrimaryIp).toHaveBeenCalledWith(7, {
        name: 'renamed',
        labels: { a: '1' },
        auto_delete: true,
      });
    });

    it('returns updated state', async () => {
      const sdk = stubSdk({
        updatePrimaryIp: jest.fn().mockResolvedValue({
          data: {
            primary_ip: fakePrimaryIp({
              id: 7,
              name: 'renamed',
              labels: { a: '1' },
              auto_delete: true,
              assignee_id: null,
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        {
          name: 'renamed',
          type: PrimaryIpType.IPV4,
          assigneeType: PrimaryIpAssigneeType.SERVER,
          labels: { a: '1' },
          autoDelete: true,
        },
        {
          primaryIpId: 7,
          name: 'my-ip',
          type: PrimaryIpType.IPV4,
          assigneeType: PrimaryIpAssigneeType.SERVER,
          labels: {},
          autoDelete: false,
        },
      );

      expect(state.name).toBe('renamed');
      expect(state.labels).toEqual({ a: '1' });
      expect(state.autoDelete).toBe(true);
    });

    it('throws when API returns no primary_ip object', async () => {
      const sdk = stubSdk({
        updatePrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { primary_ip: null } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.update(
          ctx,
          {
            name: 'x',
            type: PrimaryIpType.IPV4,
            assigneeType: PrimaryIpAssigneeType.SERVER,
          },
          {
            primaryIpId: 1,
            name: 'x',
            type: PrimaryIpType.IPV4,
            assigneeType: PrimaryIpAssigneeType.SERVER,
            labels: {},
            autoDelete: false,
          },
        ),
      ).rejects.toThrow(/no primary.ip object/i);
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('calls deletePrimaryIp with primaryIpId', async () => {
      const sdk = stubSdk({
        deletePrimaryIp: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        primaryIpId: 5,
        name: 'my-ip',
        type: PrimaryIpType.IPV4,
        assigneeType: PrimaryIpAssigneeType.SERVER,
        labels: {},
        autoDelete: false,
      });

      expect(sdk.primaryIps.deletePrimaryIp).toHaveBeenCalledWith(5);
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deletePrimaryIp: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        primaryIpId: 5,
        name: 'my-ip',
        type: PrimaryIpType.IPV4,
        assigneeType: PrimaryIpAssigneeType.SERVER,
        labels: {},
        autoDelete: false,
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.primary-ip.delete',
        { primaryIpId: 5 },
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('finds a primary IP by name', async () => {
      const sdk = stubSdk({
        listPrimaryIps: jest.fn().mockResolvedValue({
          data: { primary_ips: [fakePrimaryIp({ id: 99 })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-ip',
        type: PrimaryIpType.IPV4,
        assigneeType: PrimaryIpAssigneeType.SERVER,
      });

      expect(state.primaryIpId).toBe(99);
      expect(sdk.primaryIps.listPrimaryIps).toHaveBeenCalledWith('my-ip');
    });

    it('throws when primary IP is not found', async () => {
      const sdk = stubSdk({
        listPrimaryIps: jest.fn().mockResolvedValue({
          data: { primary_ips: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          name: 'missing',
          type: PrimaryIpType.IPV4,
          assigneeType: PrimaryIpAssigneeType.SERVER,
        }),
      ).rejects.toThrow(/not found.*missing/i);
    });

    it('defaults labels to empty object when API returns undefined', async () => {
      const sdk = stubSdk({
        listPrimaryIps: jest.fn().mockResolvedValue({
          data: { primary_ips: [fakePrimaryIp({ labels: undefined })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-ip',
        type: PrimaryIpType.IPV4,
        assigneeType: PrimaryIpAssigneeType.SERVER,
      });

      expect(state.labels).toEqual({});
    });
  });
});
