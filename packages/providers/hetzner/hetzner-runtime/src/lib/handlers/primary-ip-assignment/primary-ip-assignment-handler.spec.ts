import { RuntimeLogger } from '@cdkx-io/core';
import {
  HetznerPrimaryIpAssignmentHandler,
  HetznerPrimaryIpAssignmentState,
} from './primary-ip-assignment-handler';
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

function fakePrimaryIp(overrides?: Record<string, unknown>) {
  return {
    id: 10,
    assignee_id: null,
    assignee_type: 'server',
    ...overrides,
  };
}

function stubSdk(
  primaryIpActionsOverrides?: Partial<HetznerSdk['primaryIpActions']>,
  primaryIpsOverrides?: Partial<HetznerSdk['primaryIps']>,
  actionsOverrides?: Partial<HetznerSdk['actions']>,
): HetznerSdk {
  return {
    actions: {
      getAction: jest
        .fn()
        .mockResolvedValue({ data: { action: fakeAction() } }),
      ...actionsOverrides,
    },
    primaryIpActions: {
      assignPrimaryIp: jest.fn(),
      unassignPrimaryIp: jest.fn(),
      ...primaryIpActionsOverrides,
    },
    primaryIps: {
      getPrimaryIp: jest
        .fn()
        .mockResolvedValue({ data: { primary_ip: fakePrimaryIp() } }),
      ...primaryIpsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerPrimaryIpAssignmentHandler', () => {
  let handler: HetznerPrimaryIpAssignmentHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerPrimaryIpAssignmentHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls assignPrimaryIp with primaryIpId, assigneeId and assigneeType', async () => {
      const sdk = stubSdk({
        assignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 42 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        primaryIpId: 10,
        assigneeId: 99,
        assigneeType: 'server',
      });

      expect(sdk.primaryIpActions.assignPrimaryIp).toHaveBeenCalledWith(10, {
        assignee_id: 99,
        assignee_type: 'server',
      });
    });

    it('polls the action returned by assignPrimaryIp', async () => {
      const sdk = stubSdk({
        assignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 42 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        primaryIpId: 10,
        assigneeId: 99,
        assigneeType: 'server',
      });

      expect(sdk.actions.getAction).toHaveBeenCalledWith(42);
    });

    it('returns state with primaryIpId, assigneeId and assigneeType', async () => {
      const sdk = stubSdk({
        assignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        primaryIpId: 10,
        assigneeId: 99,
        assigneeType: 'server',
      });

      expect(state).toEqual({ primaryIpId: 10, assigneeId: 99, assigneeType: 'server' });
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk({
        assignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        primaryIpId: 10,
        assigneeId: 99,
        assigneeType: 'server',
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.primary-ip-assignment.create',
        { primaryIpId: 10, assigneeId: 99, assigneeType: 'server' },
      );
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    const baseState: HetznerPrimaryIpAssignmentState = {
      primaryIpId: 10,
      assigneeId: 99,
      assigneeType: 'server',
    };

    it('calls unassignPrimaryIp with primaryIpId', async () => {
      const sdk = stubSdk({
        unassignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.primaryIpActions.unassignPrimaryIp).toHaveBeenCalledWith(10);
    });

    it('polls the action returned by unassignPrimaryIp', async () => {
      const sdk = stubSdk({
        unassignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(7);
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk({
        unassignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.primary-ip-assignment.delete',
        { primaryIpId: 10 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    const baseState: HetznerPrimaryIpAssignmentState = {
      primaryIpId: 10,
      assigneeId: 55,
      assigneeType: 'server',
    };

    function stubUpdateSdk() {
      return stubSdk({
        unassignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
        assignPrimaryIp: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 8 }) } }),
      });
    }

    it('unassigns from old assignee then assigns to new assignee', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { primaryIpId: 10, assigneeId: 99, assigneeType: 'server' },
        baseState,
      );

      expect(sdk.primaryIpActions.unassignPrimaryIp).toHaveBeenCalledWith(10);
      expect(sdk.primaryIpActions.assignPrimaryIp).toHaveBeenCalledWith(10, {
        assignee_id: 99,
        assignee_type: 'server',
      });
    });

    it('polls both the unassign and assign actions', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { primaryIpId: 10, assigneeId: 99, assigneeType: 'server' },
        baseState,
      );

      expect(sdk.actions.getAction).toHaveBeenCalledWith(7);
      expect(sdk.actions.getAction).toHaveBeenCalledWith(8);
    });

    it('returns state with new assigneeId', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { primaryIpId: 10, assigneeId: 99, assigneeType: 'server' },
        baseState,
      );

      expect(state).toEqual({
        primaryIpId: 10,
        assigneeId: 99,
        assigneeType: 'server',
      });
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('calls getPrimaryIp with primaryIpId', async () => {
      const sdk = stubSdk(
        {},
        {
          getPrimaryIp: jest.fn().mockResolvedValue({
            data: { primary_ip: fakePrimaryIp({ assignee_id: 99 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.get(ctx, {
        primaryIpId: 10,
        assigneeId: 99,
        assigneeType: 'server',
      });

      expect(sdk.primaryIps.getPrimaryIp).toHaveBeenCalledWith(10);
    });

    it('returns state when assignee_id matches', async () => {
      const sdk = stubSdk(
        {},
        {
          getPrimaryIp: jest.fn().mockResolvedValue({
            data: { primary_ip: fakePrimaryIp({ assignee_id: 99 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        primaryIpId: 10,
        assigneeId: 99,
        assigneeType: 'server',
      });

      expect(state).toEqual({
        primaryIpId: 10,
        assigneeId: 99,
        assigneeType: 'server',
      });
    });

    it('throws when primary IP is assigned to a different assignee', async () => {
      const sdk = stubSdk(
        {},
        {
          getPrimaryIp: jest.fn().mockResolvedValue({
            data: { primary_ip: fakePrimaryIp({ assignee_id: 55 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          primaryIpId: 10,
          assigneeId: 99,
          assigneeType: 'server',
        }),
      ).rejects.toThrow(/not assigned to assignee 99/i);
    });

    it('throws when primary IP is not assigned to any resource', async () => {
      const sdk = stubSdk(
        {},
        {
          getPrimaryIp: jest.fn().mockResolvedValue({
            data: { primary_ip: fakePrimaryIp({ assignee_id: null }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          primaryIpId: 10,
          assigneeId: 99,
          assigneeType: 'server',
        }),
      ).rejects.toThrow(/not assigned to assignee 99/i);
    });
  });
});
