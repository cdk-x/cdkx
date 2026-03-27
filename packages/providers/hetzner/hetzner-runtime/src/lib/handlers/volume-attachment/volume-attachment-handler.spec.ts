import { RuntimeLogger } from '@cdkx-io/core';
import {
  HetznerVolumeAttachmentHandler,
  HetznerVolumeAttachmentState,
} from './volume-attachment-handler';
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

function fakeVolume(overrides?: Record<string, unknown>) {
  return {
    id: 10,
    server: null,
    ...overrides,
  };
}

function stubSdk(
  volumeActionsOverrides?: Partial<HetznerSdk['volumeActions']>,
  volumesOverrides?: Partial<HetznerSdk['volumes']>,
  actionsOverrides?: Partial<HetznerSdk['actions']>,
): HetznerSdk {
  return {
    actions: {
      getAction: jest
        .fn()
        .mockResolvedValue({ data: { action: fakeAction() } }),
      ...actionsOverrides,
    },
    volumeActions: {
      attachVolume: jest.fn(),
      detachVolume: jest.fn(),
      ...volumeActionsOverrides,
    },
    volumes: {
      getVolume: jest
        .fn()
        .mockResolvedValue({ data: { volume: fakeVolume() } }),
      ...volumesOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerVolumeAttachmentHandler', () => {
  let handler: HetznerVolumeAttachmentHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerVolumeAttachmentHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls attachVolume and returns state with volumeId and serverId', async () => {
      const sdk = stubSdk({
        attachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 42 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, { volumeId: 10, serverId: 99 });

      expect(sdk.volumeActions.attachVolume).toHaveBeenCalledWith(10, {
        server: 99,
        automount: undefined,
      });
      expect(state).toEqual({ volumeId: 10, serverId: 99 });
    });

    it('polls the action returned by attachVolume', async () => {
      const sdk = stubSdk({
        attachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 42 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { volumeId: 10, serverId: 99 });

      expect(sdk.actions.getAction).toHaveBeenCalledWith(42);
    });

    it('passes automount to attachVolume when provided', async () => {
      const sdk = stubSdk({
        attachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        volumeId: 10,
        serverId: 99,
        automount: true,
      });

      expect(sdk.volumeActions.attachVolume).toHaveBeenCalledWith(10, {
        server: 99,
        automount: true,
      });
    });

    it('logs the create operation', async () => {
      const sdk = stubSdk({
        attachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { volumeId: 10, serverId: 99 });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.volume-attachment.create',
        { volumeId: 10, serverId: 99 },
      );
    });

    it('throws if the volume is already attached to a server', async () => {
      const sdk = stubSdk(
        {},
        {
          getVolume: jest.fn().mockResolvedValue({
            data: { volume: fakeVolume({ server: 55 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, { volumeId: 10, serverId: 99 }),
      ).rejects.toThrow(/already attached/i);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    const baseState: HetznerVolumeAttachmentState = {
      volumeId: 10,
      serverId: 99,
    };

    it('calls detachVolume with the volumeId', async () => {
      const sdk = stubSdk({
        detachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.volumeActions.detachVolume).toHaveBeenCalledWith(10);
    });

    it('polls the action returned by detachVolume', async () => {
      const sdk = stubSdk({
        detachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(7);
    });

    it('logs the delete operation', async () => {
      const sdk = stubSdk({
        detachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction() } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.volume-attachment.delete',
        { volumeId: 10 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    const baseState: HetznerVolumeAttachmentState = {
      volumeId: 10,
      serverId: 55,
    };

    function stubUpdateSdk() {
      return stubSdk({
        detachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 7 }) } }),
        attachVolume: jest
          .fn()
          .mockResolvedValue({ data: { action: fakeAction({ id: 8 }) } }),
      });
    }

    it('detaches from old server then attaches to new server', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { volumeId: 10, serverId: 99 }, baseState);

      expect(sdk.volumeActions.detachVolume).toHaveBeenCalledWith(10);
      expect(sdk.volumeActions.attachVolume).toHaveBeenCalledWith(10, {
        server: 99,
        automount: undefined,
      });
    });

    it('polls both the detach and attach actions', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { volumeId: 10, serverId: 99 }, baseState);

      expect(sdk.actions.getAction).toHaveBeenCalledWith(7);
      expect(sdk.actions.getAction).toHaveBeenCalledWith(8);
    });

    it('returns state with new serverId', async () => {
      const sdk = stubUpdateSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { volumeId: 10, serverId: 99 },
        baseState,
      );

      expect(state).toEqual({ volumeId: 10, serverId: 99 });
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('calls getVolume and returns state when server matches', async () => {
      const sdk = stubSdk(
        {},
        {
          getVolume: jest.fn().mockResolvedValue({
            data: { volume: fakeVolume({ server: 99 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, { volumeId: 10, serverId: 99 });

      expect(sdk.volumes.getVolume).toHaveBeenCalledWith(10);
      expect(state).toEqual({ volumeId: 10, serverId: 99 });
    });

    it('throws when volume is attached to a different server', async () => {
      const sdk = stubSdk(
        {},
        {
          getVolume: jest.fn().mockResolvedValue({
            data: { volume: fakeVolume({ server: 55 }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { volumeId: 10, serverId: 99 }),
      ).rejects.toThrow(/not attached to server 99/i);
    });

    it('throws when volume is not attached to any server', async () => {
      const sdk = stubSdk(
        {},
        {
          getVolume: jest.fn().mockResolvedValue({
            data: { volume: fakeVolume({ server: null }) },
          }),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { volumeId: 10, serverId: 99 }),
      ).rejects.toThrow(/not attached to server 99/i);
    });
  });
});
