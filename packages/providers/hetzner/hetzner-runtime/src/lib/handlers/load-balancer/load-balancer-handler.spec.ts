import { RuntimeLogger } from '@cdkx-io/core';
import { LoadBalancerAlgorithmType, LoadBalancerType } from '@cdkx-io/hetzner';
import {
  HetznerLoadBalancerHandler,
  HetznerLoadBalancerState,
} from './load-balancer-handler';
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

function fakeLb(overrides?: Record<string, unknown>) {
  return {
    id: 10,
    name: 'my-lb',
    load_balancer_type: { name: 'lb11' },
    algorithm: { type: 'round_robin' },
    public_net: { enabled: true, ipv4: {}, ipv6: {} },
    labels: {},
    ...overrides,
  };
}

function fakeAction(overrides?: Record<string, unknown>) {
  return { id: 42, status: 'success', ...overrides };
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
      createLoadBalancer: jest.fn().mockResolvedValue({
        data: { load_balancer: fakeLb() },
      }),
      deleteLoadBalancer: jest.fn().mockResolvedValue({ data: {} }),
      listLoadBalancers: jest.fn().mockResolvedValue({
        data: { load_balancers: [fakeLb()] },
      }),
      updateLoadBalancer: jest.fn().mockResolvedValue({
        data: { load_balancer: fakeLb() },
      }),
      ...lbOverrides,
    },
    loadBalancerActions: {
      attachLoadBalancerToNetwork: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      changeLoadBalancerAlgorithm: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      changeLoadBalancerType: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      enableLoadBalancerPublicInterface: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      disableLoadBalancerPublicInterface: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      ...lbActionsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerLoadBalancerHandler', () => {
  let handler: HetznerLoadBalancerHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerLoadBalancerHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls createLoadBalancer with name, type, and labels', async () => {
      const sdk = stubSdk({
        createLoadBalancer: jest.fn().mockResolvedValue({
          data: { load_balancer: fakeLb({ id: 10 }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-lb',
        loadBalancerType: LoadBalancerType.LB11,
        labels: { env: 'test' },
      });

      expect(sdk.loadBalancers.createLoadBalancer).toHaveBeenCalledWith({
        name: 'my-lb',
        load_balancer_type: 'lb11',
        labels: { env: 'test' },
      });
    });

    it('returns state with loadBalancerId and initial props', async () => {
      const sdk = stubSdk({
        createLoadBalancer: jest.fn().mockResolvedValue({
          data: {
            load_balancer: fakeLb({
              id: 10,
              load_balancer_type: { name: 'lb11' },
              algorithm: { type: 'round_robin' },
              public_net: { enabled: true },
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        name: 'my-lb',
        loadBalancerType: LoadBalancerType.LB11,
      });

      expect(state.loadBalancerId).toBe(10);
      expect(state.loadBalancerType).toBe('lb11');
      expect(state.algorithm).toBe('round_robin');
      expect(state.publicInterface).toBe(true);
    });

    it('does not call attachLoadBalancerToNetwork when networkId is absent', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11 });

      expect(
        sdk.loadBalancerActions.attachLoadBalancerToNetwork,
      ).not.toHaveBeenCalled();
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11 });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.load-balancer.create',
        { name: 'my-lb' },
      );
    });
  });

  describe('create with networkId', () => {
    it('calls attachLoadBalancerToNetwork after create', async () => {
      const sdk = stubSdk({
        createLoadBalancer: jest.fn().mockResolvedValue({
          data: { load_balancer: fakeLb({ id: 10 }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-lb',
        loadBalancerType: LoadBalancerType.LB11,
        networkId: 99,
      });

      expect(
        sdk.loadBalancerActions.attachLoadBalancerToNetwork,
      ).toHaveBeenCalledWith(10, { network: 99 });
    });

    it('polls the action returned by attach', async () => {
      const sdk = stubSdk(
        {
          createLoadBalancer: jest.fn().mockResolvedValue({
            data: { load_balancer: fakeLb({ id: 10 }) },
          }),
        },
        {
          attachLoadBalancerToNetwork: jest.fn().mockResolvedValue({
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
        name: 'my-lb',
        loadBalancerType: LoadBalancerType.LB11,
        networkId: 99,
      });

      expect(sdk.actions.getAction).toHaveBeenCalledWith(77);
    });

    it('throws when attach action fails', async () => {
      const sdk = stubSdk(
        {
          createLoadBalancer: jest.fn().mockResolvedValue({
            data: { load_balancer: fakeLb({ id: 10 }) },
          }),
        },
        {
          attachLoadBalancerToNetwork: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 77, status: 'error' }) },
          }),
        },
        {
          getAction: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 77, status: 'error' }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, {
          name: 'my-lb',
          loadBalancerType: LoadBalancerType.LB11,
          networkId: 99,
        }),
      ).rejects.toThrow(/77/);
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('calls listLoadBalancers with the lb name', async () => {
      const sdk = stubSdk({
        listLoadBalancers: jest.fn().mockResolvedValue({
          data: { load_balancers: [fakeLb({ id: 10, name: 'my-lb' })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.get(ctx, { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11 });

      expect(sdk.loadBalancers.listLoadBalancers).toHaveBeenCalledWith(
        undefined,
        'my-lb',
      );
    });

    it('returns state with loadBalancerId from found lb', async () => {
      const sdk = stubSdk({
        listLoadBalancers: jest.fn().mockResolvedValue({
          data: { load_balancers: [fakeLb({ id: 10, name: 'my-lb' })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-lb',
        loadBalancerType: LoadBalancerType.LB11,
      });

      expect(state.loadBalancerId).toBe(10);
    });

    it('throws when lb is not found', async () => {
      const sdk = stubSdk({
        listLoadBalancers: jest.fn().mockResolvedValue({
          data: { load_balancers: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { name: 'missing-lb', loadBalancerType: LoadBalancerType.LB11 }),
      ).rejects.toThrow(/missing-lb/);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    const baseState: HetznerLoadBalancerState = {
      loadBalancerId: 10,
      loadBalancerType: 'lb11',
    };

    it('calls deleteLoadBalancer with loadBalancerId', async () => {
      const sdk = stubSdk({
        deleteLoadBalancer: jest.fn().mockResolvedValue({ data: {} }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.loadBalancers.deleteLoadBalancer).toHaveBeenCalledWith(10);
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.load-balancer.delete',
        { loadBalancerId: 10 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // update — base (name/labels always)
  // -------------------------------------------------------------------------
  describe('update', () => {
    const baseState: HetznerLoadBalancerState = {
      loadBalancerId: 10,
      loadBalancerType: 'lb11',
      algorithm: 'round_robin',
      publicInterface: true,
    };

    it('always calls updateLoadBalancer with name and labels', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'renamed-lb', labels: { env: 'prod' }, loadBalancerType: LoadBalancerType.LB11 },
        baseState,
      );

      expect(sdk.loadBalancers.updateLoadBalancer).toHaveBeenCalledWith(10, {
        name: 'renamed-lb',
        labels: { env: 'prod' },
      });
    });

    it('returns state preserving loadBalancerId', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11 },
        baseState,
      );

      expect(state.loadBalancerId).toBe(10);
    });

    it('logs the update operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11 },
        baseState,
      );

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.load-balancer.update',
        { loadBalancerId: 10 },
      );
    });

    it('does not call changeLoadBalancerAlgorithm when algorithm is unchanged', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11 },
        baseState,
      );

      expect(
        sdk.loadBalancerActions.changeLoadBalancerAlgorithm,
      ).not.toHaveBeenCalled();
    });

    it('calls changeLoadBalancerAlgorithm when algorithm changes', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        {
          name: 'my-lb',
          loadBalancerType: LoadBalancerType.LB11,
          algorithm: { type: LoadBalancerAlgorithmType.LEAST_CONNECTIONS },
        },
        { ...baseState, algorithm: 'round_robin' },
      );

      expect(
        sdk.loadBalancerActions.changeLoadBalancerAlgorithm,
      ).toHaveBeenCalledWith(10, { type: 'least_connections' });
    });

    it('calls changeLoadBalancerType when type changes', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB21 },
        { ...baseState, loadBalancerType: 'lb11' },
      );

      expect(
        sdk.loadBalancerActions.changeLoadBalancerType,
      ).toHaveBeenCalledWith(10, { load_balancer_type: 'lb21' });
    });

    it('does not call changeLoadBalancerType when type is unchanged', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11 },
        { ...baseState, loadBalancerType: 'lb11' },
      );

      expect(
        sdk.loadBalancerActions.changeLoadBalancerType,
      ).not.toHaveBeenCalled();
    });

    it('calls enableLoadBalancerPublicInterface when publicInterface toggles to true', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11, publicInterface: true },
        { ...baseState, publicInterface: false },
      );

      expect(
        sdk.loadBalancerActions.enableLoadBalancerPublicInterface,
      ).toHaveBeenCalledWith(10);
      expect(
        sdk.loadBalancerActions.disableLoadBalancerPublicInterface,
      ).not.toHaveBeenCalled();
    });

    it('calls disableLoadBalancerPublicInterface when publicInterface toggles to false', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11, publicInterface: false },
        { ...baseState, publicInterface: true },
      );

      expect(
        sdk.loadBalancerActions.disableLoadBalancerPublicInterface,
      ).toHaveBeenCalledWith(10);
      expect(
        sdk.loadBalancerActions.enableLoadBalancerPublicInterface,
      ).not.toHaveBeenCalled();
    });

    it('silently ignores networkId changes (create-only property)', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11, networkId: 999 },
        baseState,
      );

      expect(
        sdk.loadBalancerActions.attachLoadBalancerToNetwork,
      ).not.toHaveBeenCalled();
    });

    it('does not call public interface actions when publicInterface is unchanged', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'my-lb', loadBalancerType: LoadBalancerType.LB11, publicInterface: true },
        { ...baseState, publicInterface: true },
      );

      expect(
        sdk.loadBalancerActions.enableLoadBalancerPublicInterface,
      ).not.toHaveBeenCalled();
      expect(
        sdk.loadBalancerActions.disableLoadBalancerPublicInterface,
      ).not.toHaveBeenCalled();
    });
  });
});
