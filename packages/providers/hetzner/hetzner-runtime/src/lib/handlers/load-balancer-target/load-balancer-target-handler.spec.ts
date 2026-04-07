import { RuntimeLogger } from '@cdk-x/core';
import { LoadBalancerTargetType } from '@cdk-x/hetzner';
import {
  HetznerLoadBalancerTargetHandler,
  HetznerLoadBalancerTargetState,
} from './load-balancer-target-handler';
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

function fakeTarget(overrides?: Record<string, unknown>) {
  return {
    type: 'server',
    server: { id: 99 },
    use_private_ip: false,
    ...overrides,
  };
}

function stubSdk(
  lbOverrides?: Partial<HetznerSdk['loadBalancers']>,
  lbActionsOverrides?: Partial<HetznerSdk['loadBalancerActions']>,
  actionsOverrides?: Partial<HetznerSdk['actions']>,
): HetznerSdk {
  return {
    actions: {
      getAction: jest.fn().mockResolvedValue({ data: { action: fakeAction() } }),
      ...actionsOverrides,
    },
    loadBalancers: {
      getLoadBalancer: jest.fn().mockResolvedValue({
        data: { load_balancer: { targets: [fakeTarget()] } },
      }),
      ...lbOverrides,
    },
    loadBalancerActions: {
      addLoadBalancerTarget: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      removeLoadBalancerTarget: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      ...lbActionsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerLoadBalancerTargetHandler', () => {
  let handler: HetznerLoadBalancerTargetHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerLoadBalancerTargetHandler();
    logger = stubLogger();
  });

  const baseState: HetznerLoadBalancerTargetState = {
    physicalId: '10/server/99',
    loadBalancerId: 10,
    type: 'server',
    serverId: 99,
  };

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls addLoadBalancerTarget for a server target', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.SERVER,
        serverId: 99,
      });

      expect(
        sdk.loadBalancerActions.addLoadBalancerTarget,
      ).toHaveBeenCalledWith(10, {
        type: 'server',
        server: { id: 99 },
      });
    });

    it('returns physicalId for a server target', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.SERVER,
        serverId: 99,
      });

      expect(state.physicalId).toBe('10/server/99');
      expect(state.loadBalancerId).toBe(10);
      expect(state.type).toBe('server');
      expect(state.serverId).toBe(99);
    });

    it('calls addLoadBalancerTarget for a label_selector target', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.LABEL_SELECTOR,
        labelSelector: 'role=web',
      });

      expect(
        sdk.loadBalancerActions.addLoadBalancerTarget,
      ).toHaveBeenCalledWith(10, {
        type: 'label_selector',
        label_selector: { selector: 'role=web' },
      });
    });

    it('returns physicalId for a label_selector target', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.LABEL_SELECTOR,
        labelSelector: 'role=web',
      });

      expect(state.physicalId).toBe('10/label_selector/role=web');
    });

    it('calls addLoadBalancerTarget for an ip target', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.IP,
        ip: '1.2.3.4',
      });

      expect(
        sdk.loadBalancerActions.addLoadBalancerTarget,
      ).toHaveBeenCalledWith(10, {
        type: 'ip',
        ip: { ip: '1.2.3.4' },
      });
    });

    it('returns physicalId for an ip target', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.IP,
        ip: '1.2.3.4',
      });

      expect(state.physicalId).toBe('10/ip/1.2.3.4');
    });

    it('passes use_private_ip when set', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.SERVER,
        serverId: 99,
        usePrivateIp: true,
      });

      expect(
        sdk.loadBalancerActions.addLoadBalancerTarget,
      ).toHaveBeenCalledWith(10, {
        type: 'server',
        server: { id: 99 },
        use_private_ip: true,
      });
    });

    it('polls the action returned by addLoadBalancerTarget', async () => {
      const sdk = stubSdk(
        undefined,
        {
          addLoadBalancerTarget: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 77, status: 'success' }) },
          }),
        },
        {
          getAction: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 77, status: 'success' }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.SERVER,
        serverId: 99,
      });

      expect(sdk.actions.getAction).toHaveBeenCalledWith(77);
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.SERVER,
        serverId: 99,
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.load-balancer-target.create',
        { loadBalancerId: 10, type: 'server' },
      );
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    it('calls removeLoadBalancerTarget for a server target', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(
        sdk.loadBalancerActions.removeLoadBalancerTarget,
      ).toHaveBeenCalledWith(10, {
        type: 'server',
        server: { id: 99 },
      });
    });

    it('calls removeLoadBalancerTarget for a label_selector target', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        physicalId: '10/label_selector/role=web',
        loadBalancerId: 10,
        type: 'label_selector',
        labelSelector: 'role=web',
      });

      expect(
        sdk.loadBalancerActions.removeLoadBalancerTarget,
      ).toHaveBeenCalledWith(10, {
        type: 'label_selector',
        label_selector: { selector: 'role=web' },
      });
    });

    it('polls the action returned by removeLoadBalancerTarget', async () => {
      const sdk = stubSdk(
        undefined,
        {
          removeLoadBalancerTarget: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 88, status: 'success' }) },
          }),
        },
        {
          getAction: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 88, status: 'success' }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(88);
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.load-balancer-target.delete',
        { physicalId: '10/server/99' },
      );
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('calls getLoadBalancer and finds server target by id', async () => {
      const sdk = stubSdk({
        getLoadBalancer: jest.fn().mockResolvedValue({
          data: {
            load_balancer: {
              targets: [fakeTarget({ type: 'server', server: { id: 99 } })],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.SERVER,
        serverId: 99,
      });

      expect(sdk.loadBalancers.getLoadBalancer).toHaveBeenCalledWith(10);
      expect(state.physicalId).toBe('10/server/99');
    });

    it('throws when server target is not found', async () => {
      const sdk = stubSdk({
        getLoadBalancer: jest.fn().mockResolvedValue({
          data: { load_balancer: { targets: [] } },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, {
          loadBalancerId: 10,
          type: LoadBalancerTargetType.SERVER,
          serverId: 99,
        }),
      ).rejects.toThrow(/99/);
    });

    it('finds label_selector target by selector', async () => {
      const sdk = stubSdk({
        getLoadBalancer: jest.fn().mockResolvedValue({
          data: {
            load_balancer: {
              targets: [
                {
                  type: 'label_selector',
                  label_selector: { selector: 'role=web' },
                },
              ],
            },
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        loadBalancerId: 10,
        type: LoadBalancerTargetType.LABEL_SELECTOR,
        labelSelector: 'role=web',
      });

      expect(state.physicalId).toBe('10/label_selector/role=web');
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('throws an invariant error — engine does delete+create instead', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.update(
          ctx,
          { loadBalancerId: 10, type: LoadBalancerTargetType.SERVER, serverId: 99 },
          baseState,
        ),
      ).rejects.toThrow(/invariant/i);
    });
  });
});
