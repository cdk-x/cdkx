import { RuntimeLogger } from '@cdk-x/core';
import {
  HetznerFloatingIpAssignmentHandler,
  HetznerFloatingIpAssignmentState,
} from './floating-ip-assignment-handler';
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

function fakeAction(overrides?: Record<string, unknown>) {
  return { id: 42, status: 'success', ...overrides };
}

function fakeFloatingIp(overrides?: Record<string, unknown>) {
  return {
    id: 10,
    server: null,
    ...overrides,
  };
}

function stubSdk(
  floatingIpActionsOverrides?: Partial<HetznerSdk['floatingIpActions']>,
  floatingIpsOverrides?: Partial<HetznerSdk['floatingIps']>,
  actionsOverrides?: Partial<HetznerSdk['actions']>,
): HetznerSdk {
  return {
    actions: {
      getAction: jest
        .fn()
        .mockResolvedValue({ data: { action: fakeAction() } }),
      ...actionsOverrides,
    },
    floatingIpActions: {
      assignFloatingIp: jest.fn(),
      unassignFloatingIp: jest.fn(),
      ...floatingIpActionsOverrides,
    },
    floatingIps: {
      getFloatingIp: jest
        .fn()
        .mockResolvedValue({ data: { floating_ip: fakeFloatingIp() } }),
      ...floatingIpsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerFloatingIpAssignmentHandler', () => {
  let handler: HetznerFloatingIpAssignmentHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerFloatingIpAssignmentHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls assignFloatingIp with floatingIpId and serverId', async () => {
      const sdk = stubSdk({
        assignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 42 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { floatingIpId: 10, serverId: 99 });

      expect(sdk.floatingIpActions.assignFloatingIp).toHaveBeenCalledWith(10, {
        server: 99,
      });
    });

    it('polls the action returned by assignFloatingIp', async () => {
      const sdk = stubSdk({
        assignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 42 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { floatingIpId: 10, serverId: 99 });

      expect(sdk.actions.getAction).toHaveBeenCalledWith(42);
    });

    it('returns state with floatingIpId and serverId', async () => {
      const sdk = stubSdk({
        assignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        floatingIpId: 10,
        serverId: 99,
      });

      expect(state).toEqual({ floatingIpId: 10, serverId: 99 });
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk({
        assignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { floatingIpId: 10, serverId: 99 });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.floating-ip-assignment.create',
        { floatingIpId: 10, serverId: 99 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    const baseState: HetznerFloatingIpAssignmentState = {
      floatingIpId: 10,
      serverId: 99,
    };

    it('calls unassignFloatingIp with floatingIpId', async () => {
      const sdk = stubSdk({
        unassignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.floatingIpActions.unassignFloatingIp).toHaveBeenCalledWith(10);
    });

    it('polls the action returned by unassignFloatingIp', async () => {
      const sdk = stubSdk({
        unassignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(7);
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk({
        unassignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.floating-ip-assignment.delete',
        { floatingIpId: 10 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    const baseState: HetznerFloatingIpAssignmentState = {
      floatingIpId: 10,
      serverId: 55,
    };

    function stubUpdateSdk() {
      return stubSdk({
        unassignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
        assignFloatingIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 8 }) } }),
      });
    }

    it('unassigns from old server then assigns to new server', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { floatingIpId: 10, serverId: 99 }, baseState);

      expect(sdk.floatingIpActions.unassignFloatingIp).toHaveBeenCalledWith(10);
      expect(sdk.floatingIpActions.assignFloatingIp).toHaveBeenCalledWith(10, {
        server: 99,
      });
    });

    it('polls both the unassign and assign actions', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { floatingIpId: 10, serverId: 99 }, baseState);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(7);
      expect(sdk.actions.getAction).toHaveBeenCalledWith(8);
    });

    it('returns state with new serverId', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { floatingIpId: 10, serverId: 99 },
        baseState,
      );

      expect(state).toEqual({ floatingIpId: 10, serverId: 99 });
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('calls getFloatingIp with floatingIpId', async () => {
      const sdk = stubSdk(
        {},
        {
          getFloatingIp: jest.fn().mockResolvedValue({
            data: { floating_ip: fakeFloatingIp({ server: 99 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.get(ctx, { floatingIpId: 10, serverId: 99 });

      expect(sdk.floatingIps.getFloatingIp).toHaveBeenCalledWith(10);
    });

    it('returns state when server matches', async () => {
      const sdk = stubSdk(
        {},
        {
          getFloatingIp: jest.fn().mockResolvedValue({
            data: { floating_ip: fakeFloatingIp({ server: 99 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, { floatingIpId: 10, serverId: 99 });

      expect(state).toEqual({ floatingIpId: 10, serverId: 99 });
    });

    it('throws when floating IP is assigned to a different server', async () => {
      const sdk = stubSdk(
        {},
        {
          getFloatingIp: jest.fn().mockResolvedValue({
            data: { floating_ip: fakeFloatingIp({ server: 55 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { floatingIpId: 10, serverId: 99 }),
      ).rejects.toThrow(/not assigned to server 99/i);
    });

    it('throws when floating IP is not assigned to any server', async () => {
      const sdk = stubSdk(
        {},
        {
          getFloatingIp: jest.fn().mockResolvedValue({
            data: { floating_ip: fakeFloatingIp({ server: null }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { floatingIpId: 10, serverId: 99 }),
      ).rejects.toThrow(/not assigned to server 99/i);
    });
  });
});
