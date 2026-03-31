import { RuntimeLogger } from '@cdkx-io/core';
import {
  FirewallRuleDirection,
  FirewallRuleProtocol,
} from '@cdkx-io/hetzner';
import {
  HetznerFirewallRulesHandler,
  HetznerFirewallRulesState,
} from './firewall-rules-handler';
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
      setFirewallRules: jest
        .fn()
        .mockResolvedValue({ data: { actions: [] } }),
      ...firewallActionsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerFirewallRulesHandler', () => {
  let handler: HetznerFirewallRulesHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerFirewallRulesHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls setFirewallRules with firewallId and mapped rules', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        firewallId: 100,
        rules: [
          {
            direction: FirewallRuleDirection.IN,
            protocol: FirewallRuleProtocol.TCP,
            port: '22',
            sourceIps: ['0.0.0.0/0'],
          },
        ],
      });

      expect(sdk.firewallActions.setFirewallRules).toHaveBeenCalledWith(100, {
        rules: [
          {
            description: undefined,
            direction: 'in',
            protocol: 'tcp',
            port: '22',
            source_ips: ['0.0.0.0/0'],
            destination_ips: undefined,
          },
        ],
      });
    });

    it('calls setFirewallRules with empty rules when rules is omitted', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { firewallId: 100 });

      expect(sdk.firewallActions.setFirewallRules).toHaveBeenCalledWith(100, {
        rules: [],
      });
    });

    it('polls each action returned by setFirewallRules', async () => {
      const sdk = stubSdk(undefined, {
        setFirewallRules: jest
          .fn()
          .mockResolvedValue({
            data: { actions: [fakeAction({ id: 55 }), fakeAction({ id: 56 })] },
          }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { firewallId: 100 });

      expect(sdk.actions.getAction).toHaveBeenCalledWith(55);
      expect(sdk.actions.getAction).toHaveBeenCalledWith(56);
    });

    it('returns state with firewallId', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, { firewallId: 100 });

      expect(state).toEqual({ firewallId: 100 });
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { firewallId: 100 });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.firewall-rules.create',
        { firewallId: 100 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    const baseState: HetznerFirewallRulesState = { firewallId: 100 };

    it('calls setFirewallRules with the new rules', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        {
          firewallId: 100,
          rules: [
            {
              direction: FirewallRuleDirection.IN,
              protocol: FirewallRuleProtocol.TCP,
              port: '443',
            },
          ],
        },
        baseState,
      );

      expect(sdk.firewallActions.setFirewallRules).toHaveBeenCalledWith(100, {
        rules: [
          {
            description: undefined,
            direction: 'in',
            protocol: 'tcp',
            port: '443',
            source_ips: undefined,
            destination_ips: undefined,
          },
        ],
      });
    });

    it('returns updated state with firewallId', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { firewallId: 100 },
        baseState,
      );

      expect(state).toEqual({ firewallId: 100 });
    });

    it('logs the update operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { firewallId: 100 }, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.firewall-rules.update',
        { firewallId: 100 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    it('calls setFirewallRules with empty array to clear rules', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, { firewallId: 100 });

      expect(sdk.firewallActions.setFirewallRules).toHaveBeenCalledWith(100, {
        rules: [],
      });
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, { firewallId: 100 });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.firewall-rules.delete',
        { firewallId: 100 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('calls getFirewall with firewallId', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.get(ctx, { firewallId: 100 });

      expect(sdk.firewalls.getFirewall).toHaveBeenCalledWith(100);
    });

    it('returns state with firewallId', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, { firewallId: 100 });

      expect(state).toEqual({ firewallId: 100 });
    });
  });
});
