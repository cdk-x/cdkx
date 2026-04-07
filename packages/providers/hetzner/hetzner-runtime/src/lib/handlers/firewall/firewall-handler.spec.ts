import { RuntimeLogger } from '@cdk-x/core';
import { HetznerFirewallHandler, HetznerFirewallState } from './firewall-handler';
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
): HetznerSdk {
  return {
    firewalls: {
      createFirewall: jest.fn().mockResolvedValue({
        data: { firewall: fakeFirewall(), actions: [] },
      }),
      deleteFirewall: jest.fn().mockResolvedValue({ data: {} }),
      listFirewalls: jest.fn().mockResolvedValue({
        data: { firewalls: [fakeFirewall()] },
      }),
      updateFirewall: jest.fn().mockResolvedValue({ data: { firewall: fakeFirewall() } }),
      ...firewallsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerFirewallHandler', () => {
  let handler: HetznerFirewallHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerFirewallHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls createFirewall with name and labels', async () => {
      const sdk = stubSdk({
        createFirewall: jest.fn().mockResolvedValue({
          data: { firewall: fakeFirewall({ id: 100 }), actions: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-firewall',
        labels: { env: 'test' },
      });

      expect(sdk.firewalls.createFirewall).toHaveBeenCalledWith({
        name: 'my-firewall',
        labels: { env: 'test' },
      });
    });

    it('returns state with firewallId', async () => {
      const sdk = stubSdk({
        createFirewall: jest.fn().mockResolvedValue({
          data: { firewall: fakeFirewall({ id: 100 }), actions: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, { name: 'my-firewall' });

      expect(state).toEqual({ firewallId: 100 });
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { name: 'my-firewall' });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.firewall.create',
        { name: 'my-firewall' },
      );
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    const baseState: HetznerFirewallState = { firewallId: 100 };

    it('calls deleteFirewall with firewallId', async () => {
      const sdk = stubSdk({
        deleteFirewall: jest.fn().mockResolvedValue({ data: {} }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.firewalls.deleteFirewall).toHaveBeenCalledWith(100);
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.firewall.delete',
        { firewallId: 100 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('calls listFirewalls with the firewall name', async () => {
      const sdk = stubSdk({
        listFirewalls: jest.fn().mockResolvedValue({
          data: { firewalls: [fakeFirewall({ id: 100, name: 'my-firewall' })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.get(ctx, { name: 'my-firewall' });

      expect(sdk.firewalls.listFirewalls).toHaveBeenCalledWith(
        undefined,
        'my-firewall',
      );
    });

    it('returns state with firewallId from found firewall', async () => {
      const sdk = stubSdk({
        listFirewalls: jest.fn().mockResolvedValue({
          data: { firewalls: [fakeFirewall({ id: 100, name: 'my-firewall' })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, { name: 'my-firewall' });

      expect(state.firewallId).toBe(100);
    });

    it('throws when firewall is not found', async () => {
      const sdk = stubSdk({
        listFirewalls: jest.fn().mockResolvedValue({ data: { firewalls: [] } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { name: 'missing-firewall' }),
      ).rejects.toThrow(/missing-firewall/);
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    const baseState: HetznerFirewallState = { firewallId: 100 };

    it('calls updateFirewall with firewallId, name, and labels', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'renamed-firewall', labels: { env: 'prod' } },
        baseState,
      );

      expect(sdk.firewalls.updateFirewall).toHaveBeenCalledWith(100, {
        name: 'renamed-firewall',
        labels: { env: 'prod' },
      });
    });

    it('returns state with same firewallId', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { name: 'my-firewall' },
        baseState,
      );

      expect(state).toEqual({ firewallId: 100 });
    });

    it('logs the update operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { name: 'my-firewall' }, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.firewall.update',
        { firewallId: 100 },
      );
    });
  });
});
