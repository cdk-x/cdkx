import { RuntimeLogger } from '@cdk-x/core';
import { HetznerVolumeHandler } from './volume-handler';
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

function fakeVolume(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    name: 'my-volume',
    size: 50,
    location: { name: 'fsn1' },
    format: 'ext4',
    labels: { env: 'test' },
    status: 'available',
    ...overrides,
  };
}

function stubSdk(
  volumeOverrides?: Partial<HetznerSdk['volumes']>,
  volumeActionsOverrides?: Partial<HetznerSdk['volumeActions']>,
): HetznerSdk {
  return {
    volumes: {
      createVolume: jest.fn(),
      deleteVolume: jest.fn(),
      getVolume: jest.fn(),
      listVolumes: jest.fn(),
      updateVolume: jest.fn(),
      ...volumeOverrides,
    },
    volumeActions: {
      resizeVolume: jest.fn(),
      ...volumeActionsOverrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerVolumeHandler', () => {
  let handler: HetznerVolumeHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerVolumeHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls createVolume with snake_case params and returns state', async () => {
      const sdk = stubSdk({
        createVolume: jest.fn().mockResolvedValue({
          data: { volume: fakeVolume() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        name: 'my-volume',
        size: 50,
        location: 'fsn1',
        format: 'ext4',
        labels: { env: 'test' },
      });

      expect(sdk.volumes.createVolume).toHaveBeenCalledWith({
        name: 'my-volume',
        size: 50,
        location: 'fsn1',
        format: 'ext4',
        labels: { env: 'test' },
      });
      expect(state).toEqual({
        volumeId: 1,
        name: 'my-volume',
        size: 50,
        location: 'fsn1',
        format: 'ext4',
        labels: { env: 'test' },
      });
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        createVolume: jest.fn().mockResolvedValue({
          data: { volume: fakeVolume() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { name: 'my-volume', size: 50 });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.volume.create',
        { name: 'my-volume' },
      );
    });

    it('throws when API returns no volume object', async () => {
      const sdk = stubSdk({
        createVolume: jest
          .fn()
          .mockResolvedValue({ data: { volume: undefined } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, { name: 'x', size: 10 }),
      ).rejects.toThrow(/no volume object/i);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    const baseState: import('./volume-handler').HetznerVolumeState = {
      volumeId: 1,
      name: 'my-volume',
      size: 50,
      location: 'fsn1',
      labels: {},
    };

    it('calls deleteVolume with the volumeId', async () => {
      const sdk = stubSdk({
        deleteVolume: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(sdk.volumes.deleteVolume).toHaveBeenCalledWith(1);
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deleteVolume: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, baseState);

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.volume.delete',
        { volumeId: 1 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('finds a volume by name via listVolumes', async () => {
      const sdk = stubSdk({
        listVolumes: jest.fn().mockResolvedValue({
          data: { volumes: [fakeVolume({ id: 99 })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, { name: 'my-volume', size: 50 });

      expect(state.volumeId).toBe(99);
      expect(sdk.volumes.listVolumes).toHaveBeenCalledWith(
        undefined,
        undefined,
        'my-volume',
      );
    });

    it('throws when volume is not found', async () => {
      const sdk = stubSdk({
        listVolumes: jest.fn().mockResolvedValue({ data: { volumes: [] } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { name: 'missing', size: 10 }),
      ).rejects.toThrow(/not found.*missing/i);
    });

    it('defaults labels to empty object when API returns undefined', async () => {
      const sdk = stubSdk({
        listVolumes: jest.fn().mockResolvedValue({
          data: { volumes: [fakeVolume({ labels: undefined })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, { name: 'my-volume', size: 50 });

      expect(state.labels).toEqual({});
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    const baseState: import('./volume-handler').HetznerVolumeState = {
      volumeId: 1,
      name: 'my-volume',
      size: 50,
      location: 'fsn1',
      labels: {},
    };

    it('calls updateVolume with name and labels', async () => {
      const sdk = stubSdk({
        updateVolume: jest.fn().mockResolvedValue({
          data: { volume: fakeVolume({ name: 'renamed', labels: { a: '1' } }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'renamed', size: 50, labels: { a: '1' } },
        baseState,
      );

      expect(sdk.volumes.updateVolume).toHaveBeenCalledWith(1, {
        name: 'renamed',
        labels: { a: '1' },
      });
    });

    it('calls resizeVolume when size increases', async () => {
      const sdk = stubSdk(
        {
          updateVolume: jest.fn().mockResolvedValue({
            data: { volume: fakeVolume({ size: 100 }) },
          }),
        },
        {
          resizeVolume: jest.fn().mockResolvedValue(undefined),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { name: 'my-volume', size: 100 }, baseState);

      expect(sdk.volumeActions.resizeVolume).toHaveBeenCalledWith(1, {
        size: 100,
      });
    });

    it('does not call resizeVolume when size is unchanged', async () => {
      const sdk = stubSdk(
        {
          updateVolume: jest.fn().mockResolvedValue({
            data: { volume: fakeVolume() },
          }),
        },
        {
          resizeVolume: jest.fn(),
        },
      );
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(ctx, { name: 'my-volume', size: 50 }, baseState);

      expect(sdk.volumeActions.resizeVolume).not.toHaveBeenCalled();
    });

    it('throws when size decreases (resize-down not supported)', async () => {
      const sdk = stubSdk();
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.update(ctx, { name: 'my-volume', size: 20 }, baseState),
      ).rejects.toThrow(/resize-down is not supported/i);
    });
  });
});
