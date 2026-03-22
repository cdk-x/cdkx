import { RuntimeLogger, StabilizationTimeoutError } from '@cdkx-io/core';
import { ServerType } from '@cdkx-io/hetzner';
import { HetznerServerHandler } from './server-handler';
import { HetznerRuntimeContext } from '../../hetzner-runtime-context';
import { HetznerSdk } from '../../hetzner-sdk-facade';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal stub logger that records calls. */
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

/** Fake Hetzner server object matching the SDK response shape. */
function fakeServer(
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: 101,
    name: 'my-server',
    status: 'running',
    labels: { env: 'test' },
    ...overrides,
  };
}

/** Creates an HetznerSdk stub with only the `servers` and `actions` API mocked. */
function stubSdk(overrides?: Partial<HetznerSdk['servers']>): HetznerSdk {
  return {
    actions: {
      getAction: jest
        .fn()
        .mockResolvedValue({ data: { action: { status: 'success' } } }),
    },
    servers: {
      createServer: jest.fn(),
      updateServer: jest.fn(),
      deleteServer: jest.fn(),
      listServers: jest.fn(),
      getServer: jest.fn(),
      ...overrides,
    },
  } as unknown as HetznerSdk;
}

const baseProps = {
  name: 'my-server',
  serverType: ServerType.CX22,
  image: 'ubuntu-22.04',
};

const baseState = {
  serverId: 101,
  name: 'my-server',
  serverType: ServerType.CX22,
  image: 'ubuntu-22.04',
  labels: {},
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerServerHandler', () => {
  let handler: HetznerServerHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerServerHandler();
    logger = stubLogger();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('calls createServer with snake_case params', async () => {
      const sdk = stubSdk({
        createServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer() },
        }),
        getServer: jest
          .fn()
          .mockResolvedValue({ data: { server: fakeServer() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);
      ctx.stabilizeConfig = { intervalMs: 0, timeoutMs: 5000 };

      await handler.create(ctx, {
        name: 'my-server',
        serverType: ServerType.CX22,
        image: 'ubuntu-22.04',
        startAfterCreate: true,
        sshKeys: ['my-key'],
        labels: { env: 'test' },
      });

      expect(sdk.servers.createServer).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'my-server',
          server_type: 'cx22',
          image: 'ubuntu-22.04',
          start_after_create: true,
          ssh_keys: ['my-key'],
          labels: { env: 'test' },
        }),
      );
    });

    it('waits until server reaches running status', async () => {
      const getServer = jest
        .fn()
        .mockResolvedValueOnce({
          data: { server: fakeServer({ status: 'initializing' }) },
        })
        .mockResolvedValueOnce({
          data: { server: fakeServer({ status: 'starting' }) },
        })
        .mockResolvedValueOnce({
          data: { server: fakeServer({ status: 'running' }) },
        });

      const sdk = stubSdk({
        createServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer({ status: 'initializing' }) },
        }),
        getServer,
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);
      ctx.stabilizeConfig = { intervalMs: 0, timeoutMs: 5000 };

      await handler.create(ctx, baseProps);

      expect(getServer).toHaveBeenCalledTimes(3);
    });

    it('returns without error when server is immediately running', async () => {
      const sdk = stubSdk({
        createServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer() },
        }),
        getServer: jest
          .fn()
          .mockResolvedValue({ data: { server: fakeServer() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);
      ctx.stabilizeConfig = { intervalMs: 0, timeoutMs: 5000 };

      const state = await handler.create(ctx, baseProps);

      expect(state.serverId).toBe(101);
    });

    it('throws immediately when server enters an unexpected terminal status', async () => {
      const sdk = stubSdk({
        createServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer({ status: 'initializing' }) },
        }),
        getServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer({ status: 'off' }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);
      ctx.stabilizeConfig = { intervalMs: 0, timeoutMs: 5000 };

      await expect(handler.create(ctx, baseProps)).rejects.toThrow(
        /unexpected status.*off/i,
      );
    });

    it('throws StabilizationTimeoutError when server does not reach running within timeout', async () => {
      const sdk = stubSdk({
        createServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer({ status: 'initializing' }) },
        }),
        getServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer({ status: 'initializing' }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);
      ctx.stabilizeConfig = { intervalMs: 0, timeoutMs: 0 };

      await expect(handler.create(ctx, baseProps)).rejects.toThrow(
        StabilizationTimeoutError,
      );
    });

    it('throws when API returns no server object', async () => {
      const sdk = stubSdk({
        createServer: jest
          .fn()
          .mockResolvedValue({ data: { server: undefined } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(handler.create(ctx, baseProps)).rejects.toThrow(
        /no server object/i,
      );
    });

    it('returns state with camelCase keys', async () => {
      const sdk = stubSdk({
        createServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer({ id: 202, labels: {} }) },
        }),
        getServer: jest
          .fn()
          .mockResolvedValue({ data: { server: fakeServer({ id: 202 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);
      ctx.stabilizeConfig = { intervalMs: 0, timeoutMs: 5000 };

      const state = await handler.create(ctx, {
        ...baseProps,
        labels: { env: 'prod' },
      });

      expect(state).toMatchObject({
        serverId: 202,
        name: 'my-server',
        serverType: 'cx22',
        image: 'ubuntu-22.04',
      });
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('calls updateServer with snake_case params', async () => {
      const sdk = stubSdk({
        updateServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer({ name: 'renamed' }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { ...baseProps, name: 'renamed' }, baseState);

      expect(sdk.servers.updateServer).toHaveBeenCalledWith(
        101,
        expect.objectContaining({ name: 'renamed' }),
      );
    });

    it('returns updated state', async () => {
      const sdk = stubSdk({
        updateServer: jest.fn().mockResolvedValue({
          data: { server: fakeServer({ name: 'renamed', labels: { a: '1' } }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { ...baseProps, name: 'renamed', labels: { a: '1' } },
        baseState,
      );

      expect(state.name).toBe('renamed');
      expect(state.labels).toEqual({ a: '1' });
    });

    it('throws when API returns no server object', async () => {
      const sdk = stubSdk({
        updateServer: jest.fn().mockResolvedValue({ data: { server: null } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(handler.update(ctx, baseProps, baseState)).rejects.toThrow(
        /no server object/i,
      );
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('calls deleteServer with the serverId', async () => {
      const sdk = stubSdk({
        deleteServer: jest
          .fn()
          .mockResolvedValue({
            data: { action: { id: 99, status: 'running' } },
          }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.servers.deleteServer).toHaveBeenCalledWith(101);
    });

    it('polls the deletion action until success before resolving', async () => {
      const sdk = stubSdk({
        deleteServer: jest
          .fn()
          .mockResolvedValue({
            data: { action: { id: 99, status: 'running' } },
          }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(99);
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deleteServer: jest
          .fn()
          .mockResolvedValue({
            data: { action: { id: 99, status: 'running' } },
          }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.server.delete',
        { serverId: 101 },
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('finds a server by name', async () => {
      const sdk = stubSdk({
        listServers: jest.fn().mockResolvedValue({
          data: { servers: [fakeServer({ id: 77 })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, baseProps);

      expect(state.serverId).toBe(77);
      expect(sdk.servers.listServers).toHaveBeenCalledWith('my-server');
    });

    it('throws when server is not found', async () => {
      const sdk = stubSdk({
        listServers: jest.fn().mockResolvedValue({
          data: { servers: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(handler.get(ctx, baseProps)).rejects.toThrow(
        /not found.*my-server/i,
      );
    });

    it('defaults labels to empty object when API returns undefined', async () => {
      const sdk = stubSdk({
        listServers: jest.fn().mockResolvedValue({
          data: { servers: [fakeServer({ labels: undefined })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, baseProps);

      expect(state.labels).toEqual({});
    });
  });
});
