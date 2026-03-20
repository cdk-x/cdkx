import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';
import { EventBus } from '../events/event-bus';
import { EngineEvent } from '../events/engine-event';
import { StatePersistence, StatePersistenceDeps } from './state-persistence';
import { EngineStateManager } from './engine-state-manager';

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeNullPersistence(): StatePersistence {
  const deps: StatePersistenceDeps = {
    mkdirSync: () => undefined,
    writeFileSync: () => undefined,
    existsSync: () => false,
    readFileSync: () => '{}',
    unlinkSync: () => undefined,
  };
  return new StatePersistence('/fake/outdir', deps);
}

function makeManager(
  bus?: EventBus<EngineEvent>,
  persistence?: StatePersistence,
): EngineStateManager {
  return new EngineStateManager(
    bus ?? new EventBus<EngineEvent>(),
    persistence ?? makeNullPersistence(),
  );
}

const STACK_ID = 'MyStack';
const LOGICAL_ID = 'MyServer1A2B3C4D';
const RESOURCE_TYPE = 'Hetzner::Compute::Server';

// ─── EngineStateManager ───────────────────────────────────────────────────────

describe('EngineStateManager', () => {
  describe('initial state', () => {
    it('starts with an empty stacks map', () => {
      const manager = makeManager();
      expect(manager.getState().stacks).toEqual({});
    });

    it('accepts an initial state via constructor', () => {
      const bus = new EventBus<EngineEvent>();
      const persistence = makeNullPersistence();
      const manager = new EngineStateManager(bus, persistence, {
        stacks: {
          [STACK_ID]: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {},
          },
        },
      });

      expect(manager.getStackState(STACK_ID)?.status).toBe(
        StackStatus.CREATE_COMPLETE,
      );
    });
  });

  // ── initStack ──────────────────────────────────────────────────────────────

  describe('initStack()', () => {
    it('creates the stack with CREATE_IN_PROGRESS status', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);

      expect(manager.getStackState(STACK_ID)?.status).toBe(
        StackStatus.CREATE_IN_PROGRESS,
      );
    });

    it('initialises resources as an empty map', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);

      expect(manager.getStackState(STACK_ID)?.resources).toEqual({});
    });

    it('emits a CREATE_IN_PROGRESS stack event', () => {
      const bus = new EventBus<EngineEvent>();
      const events: EngineEvent[] = [];
      bus.subscribe((e) => events.push(e));

      const manager = makeManager(bus);
      manager.initStack(STACK_ID);

      expect(events).toHaveLength(1);
      expect(events[0].resourceStatus).toBe(StackStatus.CREATE_IN_PROGRESS);
      expect(events[0].stackId).toBe(STACK_ID);
      expect(events[0].logicalResourceId).toBe(STACK_ID);
      expect(events[0].resourceType).toBe('cdkx::stack');
    });

    it('includes the reason in the emitted event when provided', () => {
      const bus = new EventBus<EngineEvent>();
      const events: EngineEvent[] = [];
      bus.subscribe((e) => events.push(e));

      const manager = makeManager(bus);
      manager.initStack(STACK_ID, { reason: 'Starting deployment' });

      expect(events[0].resourceStatusReason).toBe('Starting deployment');
    });

    it('throws if the stack is already registered', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);

      expect(() => manager.initStack(STACK_ID)).toThrow(
        `Stack '${STACK_ID}' is already registered`,
      );
    });

    it('calls persistence.save after the transition', () => {
      const saved: unknown[] = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_, data) => saved.push(JSON.parse(data)),
        existsSync: () => false,
        readFileSync: () => '{}',
        unlinkSync: () => undefined,
      };
      const persistence = new StatePersistence('/out', deps);

      const manager = makeManager(undefined, persistence);
      manager.initStack(STACK_ID);

      expect(saved).toHaveLength(1);
    });
  });

  // ── transitionStack ────────────────────────────────────────────────────────

  describe('transitionStack()', () => {
    it('updates the stack status', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.transitionStack(STACK_ID, StackStatus.CREATE_COMPLETE);

      expect(manager.getStackState(STACK_ID)?.status).toBe(
        StackStatus.CREATE_COMPLETE,
      );
    });

    it('preserves existing resources when transitioning stack status', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, { name: 'x' });
      manager.transitionStack(STACK_ID, StackStatus.CREATE_COMPLETE);

      expect(
        manager.getStackState(STACK_ID)?.resources[LOGICAL_ID],
      ).toBeDefined();
    });

    it('emits an event for each transition', () => {
      const bus = new EventBus<EngineEvent>();
      const statuses: (StackStatus | ResourceStatus)[] = [];
      bus.subscribe((e) => statuses.push(e.resourceStatus));

      const manager = makeManager(bus);
      manager.initStack(STACK_ID);
      manager.transitionStack(STACK_ID, StackStatus.CREATE_COMPLETE);

      expect(statuses).toEqual([
        StackStatus.CREATE_IN_PROGRESS,
        StackStatus.CREATE_COMPLETE,
      ]);
    });

    it('throws if the stack is not registered', () => {
      const manager = makeManager();

      expect(() =>
        manager.transitionStack('Unknown', StackStatus.CREATE_COMPLETE),
      ).toThrow(`Stack 'Unknown' is not registered`);
    });

    it('supports the full create rollback lifecycle', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.transitionStack(STACK_ID, StackStatus.CREATE_FAILED);
      manager.transitionStack(STACK_ID, StackStatus.ROLLBACK_IN_PROGRESS);
      manager.transitionStack(STACK_ID, StackStatus.ROLLBACK_COMPLETE);

      expect(manager.getStackState(STACK_ID)?.status).toBe(
        StackStatus.ROLLBACK_COMPLETE,
      );
    });
  });

  // ── initResource ───────────────────────────────────────────────────────────

  describe('initResource()', () => {
    beforeEach(() => {
      // initStack is a prerequisite for all resource tests
    });

    it('creates the resource with CREATE_IN_PROGRESS status', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {
        name: 'web',
      });

      expect(manager.getResourceState(STACK_ID, LOGICAL_ID)?.status).toBe(
        ResourceStatus.CREATE_IN_PROGRESS,
      );
    });

    it('stores the initial properties on the resource state', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {
        name: 'web',
        serverType: 'cx21',
      });

      expect(
        manager.getResourceState(STACK_ID, LOGICAL_ID)?.properties,
      ).toEqual({ name: 'web', serverType: 'cx21' });
    });

    it('does not set physicalId initially', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {});

      expect(
        manager.getResourceState(STACK_ID, LOGICAL_ID)?.physicalId,
      ).toBeUndefined();
    });

    it('emits a CREATE_IN_PROGRESS resource event', () => {
      const bus = new EventBus<EngineEvent>();
      const events: EngineEvent[] = [];
      bus.subscribe((e) => events.push(e));

      const manager = makeManager(bus);
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {});

      const resourceEvent = events.find(
        (e) => e.logicalResourceId === LOGICAL_ID,
      );
      expect(resourceEvent?.resourceStatus).toBe(
        ResourceStatus.CREATE_IN_PROGRESS,
      );
      expect(resourceEvent?.resourceType).toBe(RESOURCE_TYPE);
    });

    it('throws if the stack is not registered', () => {
      const manager = makeManager();

      expect(() =>
        manager.initResource('Unknown', LOGICAL_ID, RESOURCE_TYPE, {}),
      ).toThrow(`Stack 'Unknown' is not registered`);
    });

    it('throws if the resource logical ID is already registered', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {});

      expect(() =>
        manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {}),
      ).toThrow(`Resource '${LOGICAL_ID}' is already registered`);
    });
  });

  // ── transitionResource ─────────────────────────────────────────────────────

  describe('transitionResource()', () => {
    function setupWithResource(
      bus?: EventBus<EngineEvent>,
    ): EngineStateManager {
      const manager = makeManager(bus);
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {
        name: 'web',
      });
      return manager;
    }

    it('updates the resource status', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        { physicalId: '42' },
      );

      expect(manager.getResourceState(STACK_ID, LOGICAL_ID)?.status).toBe(
        ResourceStatus.CREATE_COMPLETE,
      );
    });

    it('records physicalId when provided on CREATE_COMPLETE', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        { physicalId: '12345' },
      );

      expect(manager.getResourceState(STACK_ID, LOGICAL_ID)?.physicalId).toBe(
        '12345',
      );
    });

    it('preserves existing physicalId when not overridden', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        { physicalId: '99' },
      );
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.UPDATE_IN_PROGRESS,
      );

      expect(manager.getResourceState(STACK_ID, LOGICAL_ID)?.physicalId).toBe(
        '99',
      );
    });

    it('updates properties when provided', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.UPDATE_COMPLETE,
        { properties: { name: 'web-updated' } },
      );

      expect(
        manager.getResourceState(STACK_ID, LOGICAL_ID)?.properties,
      ).toEqual({ name: 'web-updated' });
    });

    it('emits a resource event with the physicalResourceId when set', () => {
      const bus = new EventBus<EngineEvent>();
      const events: EngineEvent[] = [];
      bus.subscribe((e) => events.push(e));

      const manager = setupWithResource(bus);
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        { physicalId: 'srv-999' },
      );

      const event = events.find(
        (e) => e.resourceStatus === ResourceStatus.CREATE_COMPLETE,
      );
      expect(event?.physicalResourceId).toBe('srv-999');
    });

    it('includes the reason in the emitted event', () => {
      const bus = new EventBus<EngineEvent>();
      const events: EngineEvent[] = [];
      bus.subscribe((e) => events.push(e));

      const manager = setupWithResource(bus);
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_FAILED,
        { reason: 'quota exceeded' },
      );

      const event = events.find(
        (e) => e.resourceStatus === ResourceStatus.CREATE_FAILED,
      );
      expect(event?.resourceStatusReason).toBe('quota exceeded');
    });

    it('does not set physicalResourceId in the event when not provided', () => {
      const bus = new EventBus<EngineEvent>();
      const events: EngineEvent[] = [];
      bus.subscribe((e) => events.push(e));

      const manager = setupWithResource(bus);
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_FAILED,
      );

      const event = events.find(
        (e) => e.resourceStatus === ResourceStatus.CREATE_FAILED,
      );
      expect(event?.physicalResourceId).toBeUndefined();
    });

    it('throws if the stack is not registered', () => {
      const manager = makeManager();

      expect(() =>
        manager.transitionResource(
          'Unknown',
          LOGICAL_ID,
          RESOURCE_TYPE,
          ResourceStatus.CREATE_COMPLETE,
        ),
      ).toThrow(`Stack 'Unknown' is not registered`);
    });

    it('throws if the resource is not registered', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);

      expect(() =>
        manager.transitionResource(
          STACK_ID,
          'UnknownResource',
          RESOURCE_TYPE,
          ResourceStatus.CREATE_COMPLETE,
        ),
      ).toThrow(`Resource 'UnknownResource' is not registered`);
    });

    it('supports the full update rollback lifecycle', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        { physicalId: '1' },
      );
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.UPDATE_IN_PROGRESS,
      );
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.UPDATE_FAILED,
        { reason: 'API error' },
      );
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.UPDATE_ROLLBACK_IN_PROGRESS,
      );
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.UPDATE_ROLLBACK_COMPLETE,
      );

      expect(manager.getResourceState(STACK_ID, LOGICAL_ID)?.status).toBe(
        ResourceStatus.UPDATE_ROLLBACK_COMPLETE,
      );
    });
  });

  // ── getState ───────────────────────────────────────────────────────────────

  describe('getState()', () => {
    it('reflects all stacks and resources in the current state', () => {
      const manager = makeManager();
      manager.initStack('StackA');
      manager.initStack('StackB');
      manager.initResource('StackA', LOGICAL_ID, RESOURCE_TYPE, {});

      const state = manager.getState();
      expect(Object.keys(state.stacks)).toEqual(['StackA', 'StackB']);
      expect(state.stacks['StackA'].resources[LOGICAL_ID]).toBeDefined();
    });
  });

  // ── removeResource ────────────────────────────────────────────────────────

  describe('removeResource()', () => {
    function setupWithCompleteResource(): EngineStateManager {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {
        name: 'web',
      });
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        { physicalId: '42' },
      );
      return manager;
    }

    it('removes the resource from the stack state', () => {
      const manager = setupWithCompleteResource();
      manager.removeResource(STACK_ID, LOGICAL_ID);

      expect(manager.getResourceState(STACK_ID, LOGICAL_ID)).toBeUndefined();
    });

    it('persists state after removal', () => {
      const saved: string[] = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_, data) => saved.push(data),
        existsSync: () => false,
        readFileSync: () => '{}',
        unlinkSync: () => undefined,
      };
      const persistence = new StatePersistence('/out', deps);
      const bus = new EventBus<EngineEvent>();
      const manager = new EngineStateManager(bus, persistence);
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {});
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        { physicalId: '1' },
      );
      const savesBefore = saved.length;

      manager.removeResource(STACK_ID, LOGICAL_ID);

      expect(saved.length).toBe(savesBefore + 1);
      const last = JSON.parse(saved[saved.length - 1]) as {
        stacks: Record<string, { resources: Record<string, unknown> }>;
      };
      expect(last.stacks[STACK_ID].resources[LOGICAL_ID]).toBeUndefined();
    });

    it('throws if the stack is not registered', () => {
      const manager = makeManager();
      expect(() => manager.removeResource('Unknown', LOGICAL_ID)).toThrow(
        `Stack 'Unknown' is not registered`,
      );
    });

    it('throws if the resource is not registered', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      expect(() => manager.removeResource(STACK_ID, 'UnknownResource')).toThrow(
        `Resource 'UnknownResource' is not registered`,
      );
    });
  });

  // ── lastAppliedProperties ─────────────────────────────────────────────────

  describe('lastAppliedProperties', () => {
    function setupWithResource(
      bus?: EventBus<EngineEvent>,
    ): EngineStateManager {
      const manager = makeManager(bus);
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {
        name: 'web',
      });
      return manager;
    }

    it('is undefined until CREATE_COMPLETE', () => {
      const manager = setupWithResource();

      expect(
        manager.getResourceState(STACK_ID, LOGICAL_ID)?.lastAppliedProperties,
      ).toBeUndefined();
    });

    it('is set when transitioning to CREATE_COMPLETE', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        {
          physicalId: '42',
          lastAppliedProperties: { name: 'web', serverType: 'cx21' },
        },
      );

      expect(
        manager.getResourceState(STACK_ID, LOGICAL_ID)?.lastAppliedProperties,
      ).toEqual({ name: 'web', serverType: 'cx21' });
    });

    it('is updated when transitioning to UPDATE_COMPLETE', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        {
          physicalId: '42',
          lastAppliedProperties: { name: 'web' },
        },
      );
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.UPDATE_COMPLETE,
        {
          lastAppliedProperties: { name: 'web-v2', serverType: 'cx31' },
        },
      );

      expect(
        manager.getResourceState(STACK_ID, LOGICAL_ID)?.lastAppliedProperties,
      ).toEqual({ name: 'web-v2', serverType: 'cx31' });
    });

    it('is preserved when transitioning to UPDATE_IN_PROGRESS', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        {
          physicalId: '42',
          lastAppliedProperties: { name: 'web' },
        },
      );
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.UPDATE_IN_PROGRESS,
      );

      expect(
        manager.getResourceState(STACK_ID, LOGICAL_ID)?.lastAppliedProperties,
      ).toEqual({ name: 'web' });
    });

    it('is preserved when transitioning to DELETE_IN_PROGRESS', () => {
      const manager = setupWithResource();
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        {
          physicalId: '42',
          lastAppliedProperties: { name: 'web' },
        },
      );
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.DELETE_IN_PROGRESS,
      );

      expect(
        manager.getResourceState(STACK_ID, LOGICAL_ID)?.lastAppliedProperties,
      ).toEqual({ name: 'web' });
    });

    it('is serialised to and deserialised from persisted state', () => {
      const saved: string[] = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_, data) => saved.push(data),
        existsSync: () => false,
        readFileSync: () => '{}',
        unlinkSync: () => undefined,
      };
      const persistence = new StatePersistence('/out', deps);
      const manager = makeManager(undefined, persistence);
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {
        name: 'web',
      });
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        {
          physicalId: '1',
          lastAppliedProperties: { name: 'web', serverType: 'cx21' },
        },
      );

      const persisted = JSON.parse(saved[saved.length - 1]) as {
        stacks: Record<
          string,
          {
            resources: Record<
              string,
              { lastAppliedProperties?: Record<string, unknown> }
            >;
          }
        >;
      };
      expect(
        persisted.stacks[STACK_ID].resources[LOGICAL_ID].lastAppliedProperties,
      ).toEqual({ name: 'web', serverType: 'cx21' });
    });

    it('loads without error from state files that lack lastAppliedProperties', () => {
      const legacyState = JSON.stringify({
        stacks: {
          [STACK_ID]: {
            status: 'CREATE_COMPLETE',
            resources: {
              [LOGICAL_ID]: {
                status: 'CREATE_COMPLETE',
                type: RESOURCE_TYPE,
                physicalId: '7',
                properties: { name: 'legacy' },
              },
            },
          },
        },
      });
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: () => undefined,
        existsSync: () => true,
        readFileSync: () => legacyState,
        unlinkSync: () => undefined,
      };
      const persistence = new StatePersistence('/out', deps);
      const loaded = persistence.load();

      expect(loaded).not.toBeNull();
      expect(
        loaded?.stacks[STACK_ID]?.resources[LOGICAL_ID]?.lastAppliedProperties,
      ).toBeUndefined();
    });
  });

  // ── initResource stores type ───────────────────────────────────────────────

  describe('ResourceState.type', () => {
    it('stores the resource type when initResource is called', () => {
      const manager = makeManager();
      manager.initStack(STACK_ID);
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {});

      expect(manager.getResourceState(STACK_ID, LOGICAL_ID)?.type).toBe(
        RESOURCE_TYPE,
      );
    });
  });

  // ── persistence integration ────────────────────────────────────────────────

  describe('persistence integration', () => {
    it('saves state after every transition', () => {
      let saveCount = 0;
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: () => {
          saveCount += 1;
        },
        existsSync: () => false,
        readFileSync: () => '{}',
        unlinkSync: () => undefined,
      };
      const persistence = new StatePersistence('/out', deps);
      const manager = makeManager(undefined, persistence);

      manager.initStack(STACK_ID); // save 1
      manager.initResource(STACK_ID, LOGICAL_ID, RESOURCE_TYPE, {}); // save 2
      manager.transitionResource(
        STACK_ID,
        LOGICAL_ID,
        RESOURCE_TYPE,
        ResourceStatus.CREATE_COMPLETE,
        { physicalId: '1' },
      ); // save 3
      manager.transitionStack(STACK_ID, StackStatus.CREATE_COMPLETE); // save 4

      expect(saveCount).toBe(4);
    });

    it('persists the full current state on each save', () => {
      const saved: string[] = [];
      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_, data) => saved.push(data),
        existsSync: () => false,
        readFileSync: () => '{}',
        unlinkSync: () => undefined,
      };
      const persistence = new StatePersistence('/out', deps);
      const manager = makeManager(undefined, persistence);

      manager.initStack(STACK_ID);
      manager.transitionStack(STACK_ID, StackStatus.CREATE_COMPLETE);

      const last = JSON.parse(saved[saved.length - 1]) as {
        stacks: Record<string, { status: string }>;
      };
      expect(last.stacks[STACK_ID].status).toBe(StackStatus.CREATE_COMPLETE);
    });
  });
});
