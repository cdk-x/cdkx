import { RuntimeLogger } from '@cdkx-io/core';
import {
  HetznerFirewallAttachmentHandler,
  HetznerFirewallAttachmentState,
} from './firewall-attachment-handler';
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
  return { id: 1, status: 'success', ...overrides };
}

function fakeFirewall(overrides?: Record<string, unknown>) {
  return {
    id: 100,
    name: 'my-firewall',
    labels: {},
    rules: [],
    applied_to: [],
    ...overrides,
  };
}

function stubSdk(
  firewallsOverrides?: Partial<HetznerSdk['firewalls']>,
  firewallActionsOverrides?: Partial<HetznerSdk['firewallActions']>,
  actionsOverrides?: Partial<HetznerSdk['actions']>,
): HetznerSdk {
  return {
    actions: {
      getAction: jest
        .fn()
        .mockResolvedValue({ data: { action: fakeAction() } }),
      ...actionsOverrides,
    },
    firewalls: {
      getFirewall: jest
        .fn()
        .mockResolvedValue({ data: { firewall: fakeFirewall() } }),
      ...firewallsOverrides,
    },
    firewallActions: {
      applyFirewallToResources: jest
        .fn()
        .mockResolvedValue({ data: { actions: [] } }),
      removeFirewallFromResources: jest
        .fn()
        .mockResolvedValue({ data: { actions: [] } }),
      ...firewallActionsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerFirewallAttachmentHandler', () => {
  let handler: HetznerFirewallAttachmentHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerFirewallAttachmentHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create — server
  // -------------------------------------------------------------------------
  describe('create (server)', () => {
    it('calls applyFirewallToResources with type=server and server.id', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { firewallId: 100, serverId: 7 });

      expect(
        sdk.firewallActions.applyFirewallToResources,
      ).toHaveBeenCalledWith(100, {
        apply_to: [{ type: 'server', server: { id: 7 } }],
      });
    });

    it('returns state with physicalId, firewallId, serverId', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, { firewallId: 100, serverId: 7 });

      expect(state).toEqual({
        physicalId: '100/server/7',
        firewallId: 100,
        serverId: 7,
        labelSelector: undefined,
      });
    });

    it('polls actions returned by applyFirewallToResources', async () => {
      const sdk = stubSdk(undefined, {
        applyFirewallToResources: jest
          .fn()
          .mockResolvedValue({ data: { actions: [fakeAction({ id: 42 })] } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { firewallId: 100, serverId: 7 });

      expect(sdk.actions.getAction).toHaveBeenCalledWith(42);
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { firewallId: 100, serverId: 7 });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.firewall-attachment.create',
        { firewallId: 100 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // create — label_selector
  // -------------------------------------------------------------------------
  describe('create (label_selector)', () => {
    it('calls applyFirewallToResources with type=label_selector and selector', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        firewallId: 100,
        labelSelector: 'env=prod',
      });

      expect(
        sdk.firewallActions.applyFirewallToResources,
      ).toHaveBeenCalledWith(100, {
        apply_to: [
          { type: 'label_selector', label_selector: { selector: 'env=prod' } },
        ],
      });
    });

    it('returns state with physicalId encoding label_selector', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        firewallId: 100,
        labelSelector: 'env=prod',
      });

      expect(state).toEqual({
        physicalId: '100/label_selector/env=prod',
        firewallId: 100,
        serverId: undefined,
        labelSelector: 'env=prod',
      });
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('throws — attachments cannot be updated', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);
      const state: HetznerFirewallAttachmentState = {
        physicalId: '100/server/7',
        firewallId: 100,
        serverId: 7,
        labelSelector: undefined,
      };

      await expect(
        handler.update(ctx, { firewallId: 100, serverId: 7 }, state),
      ).rejects.toThrow(/cannot be updated/);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    it('calls removeFirewallFromResources for a server attachment', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);
      const state: HetznerFirewallAttachmentState = {
        physicalId: '100/server/7',
        firewallId: 100,
        serverId: 7,
        labelSelector: undefined,
      };

      await handler.delete(ctx, state);

      expect(
        sdk.firewallActions.removeFirewallFromResources,
      ).toHaveBeenCalledWith(100, {
        remove_from: [{ type: 'server', server: { id: 7 } }],
      });
    });

    it('calls removeFirewallFromResources for a label_selector attachment', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);
      const state: HetznerFirewallAttachmentState = {
        physicalId: '100/label_selector/env=prod',
        firewallId: 100,
        serverId: undefined,
        labelSelector: 'env=prod',
      };

      await handler.delete(ctx, state);

      expect(
        sdk.firewallActions.removeFirewallFromResources,
      ).toHaveBeenCalledWith(100, {
        remove_from: [
          { type: 'label_selector', label_selector: { selector: 'env=prod' } },
        ],
      });
    });

    it('polls actions returned by removeFirewallFromResources', async () => {
      const sdk = stubSdk(undefined, {
        removeFirewallFromResources: jest
          .fn()
          .mockResolvedValue({ data: { actions: [fakeAction({ id: 99 })] } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);
      const state: HetznerFirewallAttachmentState = {
        physicalId: '100/server/7',
        firewallId: 100,
        serverId: 7,
        labelSelector: undefined,
      };

      await handler.delete(ctx, state);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(99);
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);
      const state: HetznerFirewallAttachmentState = {
        physicalId: '100/server/7',
        firewallId: 100,
        serverId: 7,
        labelSelector: undefined,
      };

      await handler.delete(ctx, state);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.firewall-attachment.delete',
        { firewallId: 100, physicalId: '100/server/7' },
      );
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('returns state for a server attachment found in applied_to', async () => {
      const sdk = stubSdk({
        getFirewall: jest.fn().mockResolvedValue({
          data: {
            firewall: fakeFirewall({
              applied_to: [{ type: 'server', server: { id: 7 } }],
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, { firewallId: 100, serverId: 7 });

      expect(state).toEqual({
        physicalId: '100/server/7',
        firewallId: 100,
        serverId: 7,
        labelSelector: undefined,
      });
    });

    it('returns state for a label_selector attachment found in applied_to', async () => {
      const sdk = stubSdk({
        getFirewall: jest.fn().mockResolvedValue({
          data: {
            firewall: fakeFirewall({
              applied_to: [
                {
                  type: 'label_selector',
                  label_selector: { selector: 'env=prod' },
                },
              ],
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        firewallId: 100,
        labelSelector: 'env=prod',
      });

      expect(state).toEqual({
        physicalId: '100/label_selector/env=prod',
        firewallId: 100,
        serverId: undefined,
        labelSelector: 'env=prod',
      });
    });

    it('throws when the attachment is not found', async () => {
      const sdk = stubSdk({
        getFirewall: jest.fn().mockResolvedValue({
          data: { firewall: fakeFirewall({ applied_to: [] }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { firewallId: 100, serverId: 7 }),
      ).rejects.toThrow(/not found/);
    });
  });
});
