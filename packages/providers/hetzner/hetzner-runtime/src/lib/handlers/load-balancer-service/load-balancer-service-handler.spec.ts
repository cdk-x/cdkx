import { RuntimeLogger } from '@cdkx-io/core';
import { LoadBalancerServiceProtocol } from '@cdkx-io/hetzner';
import {
  HetznerLoadBalancerServiceHandler,
  HetznerLoadBalancerServiceState,
} from './load-balancer-service-handler';
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

function fakeService(overrides?: Record<string, unknown>) {
  return {
    listen_port: 80,
    destination_port: 8080,
    protocol: 'tcp',
    proxyprotocol: false,
    health_check: {},
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
        data: { load_balancer: { services: [fakeService()] } },
      }),
      ...lbOverrides,
    },
    loadBalancerActions: {
      addLoadBalancerService: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      updateLoadBalancerService: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      deleteLoadBalancerService: jest.fn().mockResolvedValue({
        data: { action: fakeAction() },
      }),
      ...lbActionsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerLoadBalancerServiceHandler', () => {
  let handler: HetznerLoadBalancerServiceHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerLoadBalancerServiceHandler();
    logger = stubLogger();
  });

  const baseState: HetznerLoadBalancerServiceState = {
    physicalId: '10/80',
    loadBalancerId: 10,
    listenPort: 80,
  };

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls addLoadBalancerService with correct body', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        loadBalancerId: 10,
        listenPort: 80,
        destinationPort: 8080,
        protocol: LoadBalancerServiceProtocol.TCP,
        proxyprotocol: false,
      });

      expect(
        sdk.loadBalancerActions.addLoadBalancerService,
      ).toHaveBeenCalledWith(10, {
        listen_port: 80,
        destination_port: 8080,
        protocol: 'tcp',
        proxyprotocol: false,
      });
    });

    it('returns state with physicalId and listenPort', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        loadBalancerId: 10,
        listenPort: 80,
      });

      expect(state.physicalId).toBe('10/80');
      expect(state.loadBalancerId).toBe(10);
      expect(state.listenPort).toBe(80);
    });

    it('polls the action returned by addLoadBalancerService', async () => {
      const sdk = stubSdk(
        undefined,
        {
          addLoadBalancerService: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 55, status: 'success' }) },
          }),
        },
        {
          getAction: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 55, status: 'success' }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { loadBalancerId: 10, listenPort: 80 });

      expect(sdk.actions.getAction).toHaveBeenCalledWith(55);
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { loadBalancerId: 10, listenPort: 80 });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.load-balancer-service.create',
        { loadBalancerId: 10, listenPort: 80 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    it('calls deleteLoadBalancerService with listen_port', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(
        sdk.loadBalancerActions.deleteLoadBalancerService,
      ).toHaveBeenCalledWith(10, { listen_port: 80 });
    });

    it('polls the action returned by deleteLoadBalancerService', async () => {
      const sdk = stubSdk(
        undefined,
        {
          deleteLoadBalancerService: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 66, status: 'success' }) },
          }),
        },
        {
          getAction: jest.fn().mockResolvedValue({
            data: { action: fakeAction({ id: 66, status: 'success' }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(66);
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.load-balancer-service.delete',
        { physicalId: '10/80' },
      );
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('calls getLoadBalancer and finds service by listenPort', async () => {
      const sdk = stubSdk({
        getLoadBalancer: jest.fn().mockResolvedValue({
          data: { load_balancer: { services: [fakeService({ listen_port: 80 })] } },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, { loadBalancerId: 10, listenPort: 80 });

      expect(sdk.loadBalancers.getLoadBalancer).toHaveBeenCalledWith(10);
      expect(state.listenPort).toBe(80);
      expect(state.physicalId).toBe('10/80');
    });

    it('throws when service is not found by listenPort', async () => {
      const sdk = stubSdk({
        getLoadBalancer: jest.fn().mockResolvedValue({
          data: { load_balancer: { services: [] } },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { loadBalancerId: 10, listenPort: 80 }),
      ).rejects.toThrow(/80/);
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    it('calls updateLoadBalancerService with updated props', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        {
          loadBalancerId: 10,
          listenPort: 80,
          destinationPort: 9090,
          protocol: LoadBalancerServiceProtocol.HTTP,
          proxyprotocol: true,
        },
        baseState,
      );

      expect(
        sdk.loadBalancerActions.updateLoadBalancerService,
      ).toHaveBeenCalledWith(10, {
        listen_port: 80,
        destination_port: 9090,
        protocol: 'http',
        proxyprotocol: true,
      });
    });

    it('returns the existing state', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const result = await handler.update(
        ctx,
        { loadBalancerId: 10, listenPort: 80 },
        baseState,
      );

      expect(result).toBe(baseState);
    });

    it('logs the update operation', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { loadBalancerId: 10, listenPort: 80 },
        baseState,
      );

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.load-balancer-service.update',
        { physicalId: '10/80' },
      );
    });
  });
});
