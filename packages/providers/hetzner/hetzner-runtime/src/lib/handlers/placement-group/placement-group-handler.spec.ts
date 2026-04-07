import { RuntimeLogger } from '@cdk-x/core';
import { HetznerPlacementGroupHandler } from './placement-group-handler';
import { HetznerRuntimeContext } from '../../hetzner-runtime-context';
import { HetznerSdk } from '../../hetzner-sdk-facade';
import { PlacementGroupType } from '@cdk-x/hetzner';

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

function fakePlacementGroup(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    name: 'my-group',
    type: 'spread',
    labels: { env: 'test' },
    servers: [10, 20],
    created: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function stubSdk(
  overrides?: Partial<HetznerSdk['placementGroups']>,
): HetznerSdk {
  return {
    placementGroups: {
      createPlacementGroup: jest.fn(),
      updatePlacementGroup: jest.fn(),
      deletePlacementGroup: jest.fn(),
      listPlacementGroups: jest.fn(),
      getPlacementGroup: jest.fn(),
      ...overrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerPlacementGroupHandler', () => {
  let handler: HetznerPlacementGroupHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerPlacementGroupHandler();
    logger = stubLogger();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('calls createPlacementGroup with snake_case params', async () => {
      const sdk = stubSdk({
        createPlacementGroup: jest.fn().mockResolvedValue({
          data: { placement_group: fakePlacementGroup() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-group',
        type: PlacementGroupType.SPREAD,
        labels: { env: 'test' },
      });

      expect(sdk.placementGroups.createPlacementGroup).toHaveBeenCalledWith({
        name: 'my-group',
        type: 'spread',
        labels: { env: 'test' },
      });
    });

    it('returns state with camelCase keys', async () => {
      const sdk = stubSdk({
        createPlacementGroup: jest.fn().mockResolvedValue({
          data: {
            placement_group: fakePlacementGroup({
              id: 42,
              name: 'new-group',
              type: 'spread',
              labels: { a: '1' },
              servers: [5, 6],
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        name: 'new-group',
        type: PlacementGroupType.SPREAD,
      });

      expect(state).toEqual({
        placementGroupId: 42,
        name: 'new-group',
        type: 'spread',
        labels: { a: '1' },
        serverIds: [5, 6],
      });
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        createPlacementGroup: jest.fn().mockResolvedValue({
          data: { placement_group: fakePlacementGroup() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-group',
        type: PlacementGroupType.SPREAD,
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.placement-group.create',
        { name: 'my-group' },
      );
    });

    it('throws when API returns no placement_group object', async () => {
      const sdk = stubSdk({
        createPlacementGroup: jest
          .fn()
          .mockResolvedValue({ data: { placement_group: undefined } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, {
          name: 'x',
          type: PlacementGroupType.SPREAD,
        }),
      ).rejects.toThrow(/no placement.group object/i);
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------
  describe('update', () => {
    const baseState: import('./placement-group-handler').HetznerPlacementGroupState =
      {
        placementGroupId: 1,
        name: 'my-group',
        type: 'spread',
        labels: {},
        serverIds: [],
      };

    it('calls updatePlacementGroup with id and snake_case params', async () => {
      const sdk = stubSdk({
        updatePlacementGroup: jest.fn().mockResolvedValue({
          data: { placement_group: fakePlacementGroup({ name: 'renamed' }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        {
          name: 'renamed',
          type: PlacementGroupType.SPREAD,
          labels: { a: '1' },
        },
        baseState,
      );

      expect(sdk.placementGroups.updatePlacementGroup).toHaveBeenCalledWith(1, {
        name: 'renamed',
        labels: { a: '1' },
      });
    });

    it('returns updated state', async () => {
      const sdk = stubSdk({
        updatePlacementGroup: jest.fn().mockResolvedValue({
          data: {
            placement_group: fakePlacementGroup({
              name: 'renamed',
              labels: { a: '1' },
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        {
          name: 'renamed',
          type: PlacementGroupType.SPREAD,
          labels: { a: '1' },
        },
        baseState,
      );

      expect(state.name).toBe('renamed');
      expect(state.labels).toEqual({ a: '1' });
    });

    it('throws when API returns no placement_group object', async () => {
      const sdk = stubSdk({
        updatePlacementGroup: jest
          .fn()
          .mockResolvedValue({ data: { placement_group: null } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.update(
          ctx,
          { name: 'x', type: PlacementGroupType.SPREAD },
          baseState,
        ),
      ).rejects.toThrow(/no placement.group object/i);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------
  describe('delete', () => {
    it('calls deletePlacementGroup with the placementGroupId', async () => {
      const sdk = stubSdk({
        deletePlacementGroup: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        placementGroupId: 1,
        name: 'my-group',
        type: 'spread',
        labels: {},
        serverIds: [],
      });

      expect(sdk.placementGroups.deletePlacementGroup).toHaveBeenCalledWith(1);
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deletePlacementGroup: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        placementGroupId: 1,
        name: 'my-group',
        type: 'spread',
        labels: {},
        serverIds: [],
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.placement-group.delete',
        { placementGroupId: 1 },
      );
    });
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------
  describe('get', () => {
    it('finds a placement group by name', async () => {
      const sdk = stubSdk({
        listPlacementGroups: jest.fn().mockResolvedValue({
          data: { placement_groups: [fakePlacementGroup({ id: 77 })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-group',
        type: PlacementGroupType.SPREAD,
      });

      expect(state.placementGroupId).toBe(77);
      expect(sdk.placementGroups.listPlacementGroups).toHaveBeenCalledWith(
        undefined,
        'my-group',
      );
    });

    it('throws when placement group is not found', async () => {
      const sdk = stubSdk({
        listPlacementGroups: jest.fn().mockResolvedValue({
          data: { placement_groups: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { name: 'missing', type: PlacementGroupType.SPREAD }),
      ).rejects.toThrow(/not found.*missing/i);
    });

    it('defaults labels to empty object when API returns undefined', async () => {
      const sdk = stubSdk({
        listPlacementGroups: jest.fn().mockResolvedValue({
          data: {
            placement_groups: [fakePlacementGroup({ labels: undefined })],
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-group',
        type: PlacementGroupType.SPREAD,
      });

      expect(state.labels).toEqual({});
    });
  });
});
