import { DeploymentEngine } from './deployment-engine';
import { DeploymentPlanner } from '../planner/deployment-planner';
import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';
import { EventBus } from '../events/event-bus';
import { EngineEvent } from '../events/engine-event';
import { EngineStateManager } from '../state/engine-state-manager';
import {
  StatePersistence,
  StatePersistenceDeps,
} from '../state/state-persistence';
import { DeployLock } from '../deploy-lock';
import type {
  ProviderAdapter,
  ManifestResource,
  CreateResult,
  UpdateResult,
} from '../adapter/provider-adapter';
import type { AssemblyStack } from '../assembly/assembly-types';
import type { DeploymentPlan } from '../planner/deployment-plan';
import type { EngineState } from '../state/engine-state';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

function makeMockDeployLock(): DeployLock {
  return new DeployLock('/fake/state', {
    mkdirSync: () => undefined,
    writeFileSync: () => undefined,
    readFileSync: () => {
      throw new Error('not found');
    },
    existsSync: () => false,
    unlinkSync: () => undefined,
    isProcessAlive: () => false,
    getPid: () => 12345,
    getHostname: () => 'test-host',
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStack(
  id: string,
  resources: {
    logicalId: string;
    type?: string;
    provider?: string;
    properties?: Record<string, unknown>;
  }[],
  dependencies: string[] = [],
): AssemblyStack {
  return {
    id,
    templateFile: `${id}.json`,
    resources: resources.map((r) => ({
      logicalId: r.logicalId,
      type: r.type ?? 'test::Resource',
      provider: r.provider ?? 'test',
      properties: r.properties ?? {},
    })),
    outputs: {},
    outputKeys: [],
    dependencies,
  };
}

function makePlan(
  stackOrder: string[],
  resourceOrders: Record<string, string[]>,
): DeploymentPlan {
  // Convert flat arrays to waves (each resource/stack is its own wave for
  // simplicity in tests — no dependencies between resources in these tests).
  const stackWaves = stackOrder.map((id) => [id]);
  const resourceWaves: Record<string, string[][]> = {};
  for (const [stackId, order] of Object.entries(resourceOrders)) {
    resourceWaves[stackId] = order.map((id) => [id]);
  }
  return { stackWaves, resourceWaves };
}

function makeNullPersistence(): StatePersistence {
  return new StatePersistence('/fake', {
    mkdirSync: () => undefined,
    writeFileSync: () => undefined,
    readFileSync: () => {
      throw new Error('not found');
    },
    existsSync: () => false,
    unlinkSync: () => undefined,
  });
}

function makeEngine(
  adapter: Partial<ProviderAdapter>,
  eventBus?: EventBus<EngineEvent>,
): DeploymentEngine {
  const bus = eventBus ?? new EventBus<EngineEvent>();
  const persistence = makeNullPersistence();
  const stateManager = new EngineStateManager(bus, persistence);

  const fullAdapter: ProviderAdapter = {
    create:
      adapter.create ?? (() => Promise.reject(new Error('not implemented'))),
    update:
      adapter.update ?? (() => Promise.reject(new Error('not implemented'))),
    delete: adapter.delete ?? (() => Promise.resolve()),
    getOutput: adapter.getOutput ?? (() => Promise.resolve(undefined)),
    getCreateOnlyProps: adapter.getCreateOnlyProps ?? (() => new Set<string>()),
  };

  return new DeploymentEngine({
    adapters: { test: fullAdapter },
    assemblyDir: '/fake/assembly',
    stateDir: '/fake/state',
    stateManager,
    persistence,
    eventBus: bus,
    deployLock: makeMockDeployLock(),
  });
}

function successAdapter(
  physicalId: string,
  outputs?: Record<string, unknown>,
): Partial<ProviderAdapter> {
  return {
    create: (_resource: ManifestResource): Promise<CreateResult> =>
      Promise.resolve({ physicalId, ...(outputs ? { outputs } : {}) }),
    delete: (): Promise<void> => Promise.resolve(),
  };
}

function failingAdapter(message: string): Partial<ProviderAdapter> {
  return {
    create: (): Promise<CreateResult> => Promise.reject(new Error(message)),
    delete: (): Promise<void> => Promise.resolve(),
  };
}

/**
 * Build an engine that already has prior state for the given stack.
 * The prior state contains the provided resources as CREATE_COMPLETE.
 * The stack ID is always 'S'.
 */
function makeEngineWithPriorState(
  priorResources: {
    logicalId: string;
    type?: string;
    physicalId?: string;
    outputs?: Record<string, unknown>;
  }[],
  adapter: Partial<ProviderAdapter>,
  bus?: EventBus<EngineEvent>,
): DeploymentEngine {
  const eventBus = bus ?? new EventBus<EngineEvent>();
  const persistence = makeNullPersistence();

  const priorState: EngineState = {
    stacks: {
      S: {
        status: StackStatus.CREATE_COMPLETE,
        resources: Object.fromEntries(
          priorResources.map((r) => [
            r.logicalId,
            {
              status: ResourceStatus.CREATE_COMPLETE,
              type: r.type ?? 'test::Resource',
              physicalId: r.physicalId ?? `phys-${r.logicalId}`,
              properties: {},
              ...(r.outputs !== undefined ? { outputs: r.outputs } : {}),
            },
          ]),
        ),
      },
    },
  };

  const stateManager = new EngineStateManager(
    eventBus,
    persistence,
    priorState,
  );

  const fullAdapter: ProviderAdapter = {
    create:
      adapter.create ?? (() => Promise.reject(new Error('not implemented'))),
    update:
      adapter.update ?? (() => Promise.reject(new Error('not implemented'))),
    delete: adapter.delete ?? (() => Promise.resolve()),
    getOutput: adapter.getOutput ?? (() => Promise.resolve(undefined)),
    getCreateOnlyProps: adapter.getCreateOnlyProps ?? (() => new Set<string>()),
  };

  return new DeploymentEngine({
    adapters: { test: fullAdapter },
    assemblyDir: '/fake/assembly',
    stateDir: '/fake/state',
    stateManager,
    persistence,
    eventBus,
    deployLock: makeMockDeployLock(),
  });
}

/**
 * Build an engine that already has prior state with specific stored properties.
 * Useful for update tests where the diff against prior properties matters.
 */
function makeEngineWithPriorStateAndProps(
  priorResources: {
    logicalId: string;
    type?: string;
    physicalId?: string;
    properties?: Record<string, unknown>;
    lastAppliedProperties?: Record<string, unknown>;
    outputs?: Record<string, unknown>;
  }[],
  adapter: Partial<ProviderAdapter>,
  bus?: EventBus<EngineEvent>,
): DeploymentEngine {
  const eventBus = bus ?? new EventBus<EngineEvent>();
  const persistence = makeNullPersistence();

  const priorState: EngineState = {
    stacks: {
      S: {
        status: StackStatus.CREATE_COMPLETE,
        resources: Object.fromEntries(
          priorResources.map((r) => [
            r.logicalId,
            {
              status: ResourceStatus.CREATE_COMPLETE,
              type: r.type ?? 'test::Resource',
              physicalId: r.physicalId ?? `phys-${r.logicalId}`,
              properties: r.properties ?? {},
              ...(r.lastAppliedProperties !== undefined
                ? { lastAppliedProperties: r.lastAppliedProperties }
                : {}),
              ...(r.outputs !== undefined ? { outputs: r.outputs } : {}),
            },
          ]),
        ),
      },
    },
  };

  const stateManager = new EngineStateManager(
    eventBus,
    persistence,
    priorState,
  );

  const fullAdapter: ProviderAdapter = {
    create:
      adapter.create ?? (() => Promise.reject(new Error('not implemented'))),
    update:
      adapter.update ?? (() => Promise.reject(new Error('not implemented'))),
    delete: adapter.delete ?? (() => Promise.resolve()),
    getOutput: adapter.getOutput ?? (() => Promise.resolve(undefined)),
    getCreateOnlyProps: adapter.getCreateOnlyProps ?? (() => new Set<string>()),
  };

  return new DeploymentEngine({
    adapters: { test: fullAdapter },
    assemblyDir: '/fake/assembly',
    stateDir: '/fake/state',
    stateManager,
    persistence,
    eventBus,
    deployLock: makeMockDeployLock(),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeploymentEngine', () => {
  // ─── Happy path ─────────────────────────────────────────────────────────────

  describe('happy path — single stack, single resource', () => {
    let engine: DeploymentEngine;
    let events: EngineEvent[];

    beforeEach(async () => {
      events = [];
      const bus = new EventBus<EngineEvent>();
      engine = makeEngine(successAdapter('srv-001'), bus);
      bus.subscribe((e) => events.push(e));
    });

    it('returns success=true', async () => {
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);
      expect(result.success).toBe(true);
    });

    it('returns one stack result', async () => {
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);
      expect(result.stacks).toHaveLength(1);
      expect(result.stacks[0].stackId).toBe('S');
      expect(result.stacks[0].success).toBe(true);
    });

    it('records physical ID in resource result', async () => {
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);
      expect(result.stacks[0].resources[0].physicalId).toBe('srv-001');
    });

    it('emits stack CREATE_IN_PROGRESS event', async () => {
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);
      const stackEvents = events.filter(
        (e) => e.stackId === 'S' && e.resourceType === 'cdkx::stack',
      );
      expect(
        stackEvents.some(
          (e) => e.resourceStatus === StackStatus.CREATE_IN_PROGRESS,
        ),
      ).toBe(true);
    });

    it('emits stack CREATE_COMPLETE event', async () => {
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);
      const stackEvents = events.filter(
        (e) => e.stackId === 'S' && e.resourceType === 'cdkx::stack',
      );
      expect(
        stackEvents.some(
          (e) => e.resourceStatus === StackStatus.CREATE_COMPLETE,
        ),
      ).toBe(true);
    });

    it('emits resource CREATE_IN_PROGRESS event', async () => {
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);
      const resourceEvents = events.filter(
        (e) => e.logicalResourceId === 'Res1',
      );
      expect(
        resourceEvents.some(
          (e) => e.resourceStatus === ResourceStatus.CREATE_IN_PROGRESS,
        ),
      ).toBe(true);
    });

    it('emits resource CREATE_COMPLETE event', async () => {
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);
      const resourceEvents = events.filter(
        (e) => e.logicalResourceId === 'Res1',
      );
      expect(
        resourceEvents.some(
          (e) => e.resourceStatus === ResourceStatus.CREATE_COMPLETE,
        ),
      ).toBe(true);
    });
  });

  // ─── Multiple resources in order ─────────────────────────────────────────────

  describe('multiple resources — creation order respected', () => {
    it('calls adapter.create in the order given by the plan', async () => {
      const createdOrder: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          createdOrder.push(r.logicalId);
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: () => Promise.resolve(),
      };

      const engine = makeEngine(adapter);
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA' },
          { logicalId: 'ResB' },
          { logicalId: 'ResC' },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB', 'ResC'] });
      await engine.deploy(stacks, plan);

      expect(createdOrder).toEqual(['ResA', 'ResB', 'ResC']);
    });
  });

  // ─── Token resolution ─────────────────────────────────────────────────────────

  describe('{ ref, attr } token resolution', () => {
    it('resolves intra-stack token from completed resource outputs', async () => {
      const receivedProps: Record<string, unknown>[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          receivedProps.push(r.properties);
          if (r.logicalId === 'ResA') {
            return Promise.resolve({
              physicalId: 'net-001',
              outputs: { networkId: 42 },
            });
          }
          return Promise.resolve({ physicalId: 'srv-001' });
        },
        delete: () => Promise.resolve(),
      };

      const engine = makeEngine(adapter);
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: {} },
          {
            logicalId: 'ResB',
            properties: { networkId: { ref: 'ResA', attr: 'networkId' } },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      // ResB should have received the resolved value 42, not the token.
      expect(receivedProps[1]).toEqual({ networkId: 42 });
    });

    it('fails resource deploy when { ref, attr } token references a non-existent resource', async () => {
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> =>
          Promise.resolve({ physicalId: `phys-${r.logicalId}` }),
        delete: () => Promise.resolve(),
      };

      const engine = makeEngine(adapter);
      const token = { ref: 'OtherStackResXYZ', attr: 'serverId' };
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { externalRef: token } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      // Token resolution throws → resource and stack both fail.
      expect(result.stacks[0].success).toBe(false);
    });
  });

  // ─── Failure and rollback ────────────────────────────────────────────────────

  describe('failure and rollback', () => {
    it('returns success=false when a resource fails', async () => {
      const engine = makeEngine(failingAdapter('API error'));
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);
      expect(result.success).toBe(false);
    });

    it('includes error message in stack result', async () => {
      const engine = makeEngine(failingAdapter('API error'));
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);
      expect(result.stacks[0].error).toContain('API error');
    });

    it('calls adapter.delete for previously created resources during rollback', async () => {
      const deletedIds: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          if (r.logicalId === 'ResC') {
            return Promise.reject(new Error('oops'));
          }
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedIds.push(r.logicalId);
          return Promise.resolve();
        },
      };

      const engine = makeEngine(adapter);
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA' },
          { logicalId: 'ResB' },
          { logicalId: 'ResC' },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB', 'ResC'] });
      await engine.deploy(stacks, plan);

      // ResA and ResB were created before ResC failed — they should be rolled back.
      expect(deletedIds).toContain('ResA');
      expect(deletedIds).toContain('ResB');
    });

    it('rolls back in reverse creation order', async () => {
      const deletedIds: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          if (r.logicalId === 'ResC') {
            return Promise.reject(new Error('oops'));
          }
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedIds.push(r.logicalId);
          return Promise.resolve();
        },
      };

      const engine = makeEngine(adapter);
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA' },
          { logicalId: 'ResB' },
          { logicalId: 'ResC' },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB', 'ResC'] });
      await engine.deploy(stacks, plan);

      expect(deletedIds).toEqual(['ResB', 'ResA']);
    });

    it('emits ROLLBACK_IN_PROGRESS and ROLLBACK_COMPLETE stack events', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const engine = makeEngine(failingAdapter('fail'), bus);
      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);

      const stackStatuses = events
        .filter((e) => e.resourceType === 'cdkx::stack')
        .map((e) => e.resourceStatus);

      expect(stackStatuses).toContain(StackStatus.ROLLBACK_IN_PROGRESS);
      expect(stackStatuses).toContain(StackStatus.ROLLBACK_COMPLETE);
    });

    it('aborts subsequent stacks after a stack failure', async () => {
      const engine = makeEngine(failingAdapter('fail'));
      const stacks = [
        makeStack('StackA', [{ logicalId: 'Res1' }]),
        makeStack('StackB', [{ logicalId: 'Res2' }]),
      ];
      const plan = makePlan(['StackA', 'StackB'], {
        StackA: ['Res1'],
        StackB: ['Res2'],
      });
      const result = await engine.deploy(stacks, plan);

      // Only StackA should appear in results — StackB never ran.
      expect(result.success).toBe(false);
      expect(result.stacks).toHaveLength(1);
      expect(result.stacks[0].stackId).toBe('StackA');
    });
  });

  // ─── Missing adapter ──────────────────────────────────────────────────────────

  describe('missing provider adapter', () => {
    it('returns failure when no adapter is registered for a resource provider', async () => {
      const engine = new DeploymentEngine({
        adapters: {}, // no adapters registered
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager: new EngineStateManager(
          new EventBus<EngineEvent>(),
          makeNullPersistence(),
        ),
        persistence: makeNullPersistence(),
        deployLock: makeMockDeployLock(),
      });

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);

      // Should fail - no adapter for the resource provider
      expect(result.success).toBe(false);
      expect(result.stacks[0].success).toBe(false);
      // Error should be in the first resource
      expect(result.stacks[0].resources.length).toBeGreaterThan(0);
      const resourceResult = result.stacks[0].resources[0];
      expect(resourceResult.success).toBe(false);
      expect(resourceResult.error).toContain(
        "No adapter registered for provider 'test'",
      );
    });
  });

  // ─── Empty inputs ─────────────────────────────────────────────────────────────

  describe('empty inputs', () => {
    it('succeeds with no stacks', async () => {
      const engine = makeEngine({});
      const result = await engine.deploy([], makePlan([], {}));
      expect(result.success).toBe(true);
      expect(result.stacks).toEqual([]);
    });

    it('succeeds with a stack that has no resources', async () => {
      const engine = makeEngine({});
      const stacks = [makeStack('S', [])];
      const plan = makePlan(['S'], { S: [] });
      const result = await engine.deploy(stacks, plan);
      expect(result.success).toBe(true);
    });
  });

  // ─── subscribe() ─────────────────────────────────────────────────────────────

  describe('subscribe()', () => {
    it('returns an unsubscribe function that stops event delivery', async () => {
      const received: EngineEvent[] = [];
      const engine = makeEngine(successAdapter('phys-001'));
      const unsub = engine.subscribe((e) => received.push(e));
      unsub();

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);

      expect(received).toHaveLength(0);
    });
  });

  // ─── Integration: planner + engine ───────────────────────────────────────────

  describe('integration — planner + engine', () => {
    it('correctly deploys two resources with a dependency', async () => {
      const createdProps: Record<string, unknown>[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          createdProps.push({ logicalId: r.logicalId, ...r.properties });
          if (r.logicalId === 'Network') {
            return Promise.resolve({
              physicalId: 'net-001',
              outputs: { networkId: 99 },
            });
          }
          return Promise.resolve({ physicalId: 'srv-001' });
        },
        delete: () => Promise.resolve(),
      };

      const stacks = [
        makeStack('S', [
          { logicalId: 'Network', properties: { name: 'app-net' } },
          {
            logicalId: 'Server',
            properties: {
              name: 'web',
              networkId: { ref: 'Network', attr: 'networkId' },
            },
          },
        ]),
      ];

      const planner = new DeploymentPlanner();
      const plan = planner.plan(stacks);
      const engine = makeEngine(adapter);
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      const serverProps = createdProps.find((p) => p.logicalId === 'Server');
      // Token should have been resolved to the actual output value 99.
      expect(serverProps?.networkId).toBe(99);
    });
  });

  // ─── Reconcile — resources deleted from assembly ──────────────────────────

  describe('reconcile — resources deleted from assembly', () => {
    it('calls adapter.delete with the correct physicalId for removed resource', async () => {
      const deletedResources: ManifestResource[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: () => Promise.resolve({ physicalId: 'new-phys' }),
        delete: (r: ManifestResource): Promise<void> => {
          deletedResources.push(r);
          return Promise.resolve();
        },
      };

      // Prior: ResA + ResB. New assembly: only ResA.
      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'ResA', physicalId: 'phys-A' },
          { logicalId: 'ResB', physicalId: 'phys-B' },
        ],
        adapter,
      );
      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      expect(deletedResources).toHaveLength(1);
      expect(deletedResources[0].logicalId).toBe('ResB');
      expect(deletedResources[0].physicalId).toBe('phys-B');
    });

    it('removes the deleted resource from state', async () => {
      let savedState: EngineState | undefined;
      const persistence = new StatePersistence('/fake', {
        mkdirSync: () => undefined,
        writeFileSync: (_, data) => {
          savedState = JSON.parse(data) as EngineState;
        },
        readFileSync: () => {
          throw new Error('not found');
        },
        existsSync: () => false,
        unlinkSync: () => undefined,
      });

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: {},
              },
              ResB: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-B',
                properties: {},
              },
            },
          },
        },
      };

      const bus = new EventBus<EngineEvent>();
      const stateManager = new EngineStateManager(bus, persistence, priorState);

      const engine = new DeploymentEngine({
        adapters: {
          test: {
            create: () => Promise.resolve({ physicalId: 'new-A' }),
            update: () => Promise.reject(new Error('not implemented')),
            delete: () => Promise.resolve(),
            getOutput: () => Promise.resolve(undefined),
          },
        },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      expect(savedState?.stacks['S']?.resources['ResB']).toBeUndefined();
    });

    it('emits DELETE_IN_PROGRESS and DELETE_COMPLETE events for reconciled resource', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'ResA', physicalId: 'phys-A' },
          { logicalId: 'ResB', physicalId: 'phys-B' },
        ],
        { create: () => Promise.resolve({ physicalId: 'new-A' }) },
        bus,
      );

      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      const resBEvents = events.filter((e) => e.logicalResourceId === 'ResB');
      expect(resBEvents.map((e) => e.resourceStatus)).toEqual([
        ResourceStatus.DELETE_IN_PROGRESS,
        ResourceStatus.DELETE_COMPLETE,
      ]);
    });

    it('transitions stack through UPDATE_IN_PROGRESS → NO_CHANGES when nothing to do', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const engine = makeEngineWithPriorState(
        [{ logicalId: 'ResA', physicalId: 'phys-A' }],
        {},
        bus,
      );

      // Assembly still has ResA — nothing to delete or create.
      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      const stackStatuses = events
        .filter((e) => e.resourceType === 'cdkx::stack')
        .map((e) => e.resourceStatus);

      expect(stackStatuses).toContain(StackStatus.UPDATE_IN_PROGRESS);
      expect(stackStatuses).toContain(StackStatus.NO_CHANGES);
    });

    it('creates a new resource after reconcile deletes an old one (mixed run)', async () => {
      const createdIds: string[] = [];
      const deletedIds: string[] = [];

      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          createdIds.push(r.logicalId);
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedIds.push(r.logicalId);
          return Promise.resolve();
        },
      };

      // Prior: ResOld. New assembly: ResNew.
      const engine = makeEngineWithPriorState(
        [{ logicalId: 'ResOld', physicalId: 'old-phys' }],
        adapter,
      );

      const stacks = [makeStack('S', [{ logicalId: 'ResNew' }])];
      const plan = makePlan(['S'], { S: ['ResNew'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      expect(deletedIds).toContain('ResOld');
      expect(createdIds).toContain('ResNew');
    });

    it('returns success=true for a mixed delete+create run', async () => {
      const engine = makeEngineWithPriorState(
        [{ logicalId: 'ResOld', physicalId: 'old-phys' }],
        successAdapter('new-phys'),
      );

      const stacks = [makeStack('S', [{ logicalId: 'ResNew' }])];
      const plan = makePlan(['S'], { S: ['ResNew'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
    });

    it('does not re-create a pre-existing CREATE_COMPLETE resource', async () => {
      const createdIds: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          createdIds.push(r.logicalId);
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
      };

      // Prior: ResA already complete. Assembly still has ResA.
      const engine = makeEngineWithPriorState(
        [{ logicalId: 'ResA', physicalId: 'phys-A' }],
        adapter,
      );

      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      // create should NOT have been called for ResA.
      expect(createdIds).not.toContain('ResA');
    });

    it('fails the stack when reconcile delete throws', async () => {
      const adapter: Partial<ProviderAdapter> = {
        delete: (): Promise<void> => Promise.reject(new Error('delete failed')),
      };

      // Prior: ResA + ResB. New assembly: only ResA.
      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'ResA', physicalId: 'phys-A' },
          { logicalId: 'ResB', physicalId: 'phys-B' },
        ],
        adapter,
      );

      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(false);
      expect(result.stacks[0].error).toContain('delete failed');
    });
  });

  // ─── Reconcile — dependency validation ────────────────────────────────────

  describe('reconcile — dependency validation', () => {
    it('does not throw when removed resource has no dependents in new assembly', async () => {
      // Prior: ResA + ResB. New assembly: only ResA (no reference to ResB).
      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'ResA', physicalId: 'phys-A' },
          { logicalId: 'ResB', physicalId: 'phys-B' },
        ],
        successAdapter('new-phys'),
      );

      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
    });

    it('throws ReconcileValidationError when a staying resource references a removed one', async () => {
      const deleteCalled: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: () => Promise.resolve({ physicalId: 'new-phys' }),
        delete: (r: ManifestResource): Promise<void> => {
          deleteCalled.push(r.logicalId);
          return Promise.resolve();
        },
      };

      // Prior: Network + Subnet. New assembly: Network only, but Network
      // properties contain { ref: 'Subnet', attr: 'subnetId' }.
      const engine = makeEngineWithPriorState(
        [
          {
            logicalId: 'Network',
            type: 'test::Network',
            physicalId: 'net-1',
          },
          {
            logicalId: 'Subnet',
            type: 'test::Subnet',
            physicalId: 'subnet-1',
          },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [
          {
            logicalId: 'Network',
            type: 'test::Network',
            properties: { subnetRef: { ref: 'Subnet', attr: 'subnetId' } },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['Network'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(false);
      expect(result.stacks[0].error).toContain('Cannot delete');
      expect(result.stacks[0].error).toContain('Subnet');
    });

    it('error contains all blocked deletes, not just the first', async () => {
      // Prior: Net + SubnetA + SubnetB. New assembly: Net only, but it
      // references both SubnetA and SubnetB.
      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'Net', type: 'test::Network', physicalId: 'net-1' },
          {
            logicalId: 'SubnetA',
            type: 'test::Subnet',
            physicalId: 'sub-a',
          },
          {
            logicalId: 'SubnetB',
            type: 'test::Subnet',
            physicalId: 'sub-b',
          },
        ],
        successAdapter('new-phys'),
      );

      const stacks = [
        makeStack('S', [
          {
            logicalId: 'Net',
            type: 'test::Network',
            properties: {
              subnetA: { ref: 'SubnetA', attr: 'subnetId' },
              subnetB: { ref: 'SubnetB', attr: 'subnetId' },
            },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['Net'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(false);
      expect(result.stacks[0].error).toContain('2 resource(s)');
      expect(result.stacks[0].error).toContain('SubnetA');
      expect(result.stacks[0].error).toContain('SubnetB');
    });

    it('does not call adapter.delete when validation fails', async () => {
      const deleteCalled: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: () => Promise.resolve({ physicalId: 'new-phys' }),
        delete: (r: ManifestResource): Promise<void> => {
          deleteCalled.push(r.logicalId);
          return Promise.resolve();
        },
      };

      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'Net', type: 'test::Network', physicalId: 'net-1' },
          { logicalId: 'Subnet', type: 'test::Subnet', physicalId: 'sub-1' },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [
          {
            logicalId: 'Net',
            type: 'test::Network',
            properties: { subnetRef: { ref: 'Subnet', attr: 'subnetId' } },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['Net'] });
      await engine.deploy(stacks, plan);

      // adapter.delete must never have been called.
      expect(deleteCalled).toHaveLength(0);
    });

    it('does not throw when both the referencing and referenced resources are removed', async () => {
      const deleteCalled: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        delete: (r: ManifestResource): Promise<void> => {
          deleteCalled.push(r.logicalId);
          return Promise.resolve();
        },
      };

      // Prior: Net + Subnet + LB. New assembly: empty.
      // LB references Subnet, Subnet references Net — both are removed,
      // so no conflict (silent case).
      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'Net', type: 'test::Network', physicalId: 'net-1' },
          { logicalId: 'Subnet', type: 'test::Subnet', physicalId: 'sub-1' },
          { logicalId: 'LB', type: 'test::LB', physicalId: 'lb-1' },
        ],
        adapter,
      );

      const stacks = [makeStack('S', [])];
      const plan = makePlan(['S'], { S: [] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      expect(deleteCalled).toHaveLength(3);
    });

    it('detects token nested inside an array in properties', async () => {
      // Token is nested inside an array value — the recursive walker must
      // find it.
      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'Net', type: 'test::Network', physicalId: 'net-1' },
          { logicalId: 'Subnet', type: 'test::Subnet', physicalId: 'sub-1' },
        ],
        successAdapter('new-phys'),
      );

      const stacks = [
        makeStack('S', [
          {
            logicalId: 'Net',
            type: 'test::Network',
            properties: {
              subnets: [{ ref: 'Subnet', attr: 'subnetId' }],
            },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['Net'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(false);
      expect(result.stacks[0].error).toContain('Subnet');
    });
  });

  // ─── No-op deploy ─────────────────────────────────────────────────────────────

  describe('no-op deploy', () => {
    it('emits NO_CHANGES when re-deploy has all resources already CREATE_COMPLETE and nothing to reconcile', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      // Prior state: ResA + ResB both CREATE_COMPLETE.
      // New assembly: same two resources — nothing to create or delete.
      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'ResA', physicalId: 'phys-A' },
          { logicalId: 'ResB', physicalId: 'phys-B' },
        ],
        {},
        bus,
      );

      const stacks = [
        makeStack('S', [{ logicalId: 'ResA' }, { logicalId: 'ResB' }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      const stackStatuses = events
        .filter((e) => e.resourceType === 'cdkx::stack')
        .map((e) => e.resourceStatus);

      expect(stackStatuses).toContain(StackStatus.NO_CHANGES);
      expect(stackStatuses).not.toContain(StackStatus.UPDATE_COMPLETE);
    });

    it('emits UPDATE_COMPLETE when re-deploy creates at least one new resource', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      // Prior state: ResA only. New assembly: ResA + ResB (ResB is new).
      const engine = makeEngineWithPriorState(
        [{ logicalId: 'ResA', physicalId: 'phys-A' }],
        successAdapter('phys-B'),
        bus,
      );

      const stacks = [
        makeStack('S', [{ logicalId: 'ResA' }, { logicalId: 'ResB' }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      const stackStatuses = events
        .filter((e) => e.resourceType === 'cdkx::stack')
        .map((e) => e.resourceStatus);

      expect(stackStatuses).toContain(StackStatus.UPDATE_COMPLETE);
      expect(stackStatuses).not.toContain(StackStatus.NO_CHANGES);
    });

    it('emits UPDATE_COMPLETE when re-deploy reconcile-deletes at least one resource', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      // Prior state: ResA + ResB. New assembly: ResA only (ResB removed).
      const engine = makeEngineWithPriorState(
        [
          { logicalId: 'ResA', physicalId: 'phys-A' },
          { logicalId: 'ResB', physicalId: 'phys-B' },
        ],
        { create: () => Promise.resolve({ physicalId: 'new-A' }) },
        bus,
      );

      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      const stackStatuses = events
        .filter((e) => e.resourceType === 'cdkx::stack')
        .map((e) => e.resourceStatus);

      expect(stackStatuses).toContain(StackStatus.UPDATE_COMPLETE);
      expect(stackStatuses).not.toContain(StackStatus.NO_CHANGES);
    });

    it('emits NO_CHANGES on first deploy when the stack has zero resources', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      // First deploy (no prior state), assembly has no resources.
      const engine = makeEngine({}, bus);

      const stacks = [makeStack('S', [])];
      const plan = makePlan(['S'], { S: [] });
      await engine.deploy(stacks, plan);

      const stackStatuses = events
        .filter((e) => e.resourceType === 'cdkx::stack')
        .map((e) => e.resourceStatus);

      expect(stackStatuses).toContain(StackStatus.NO_CHANGES);
      expect(stackStatuses).not.toContain(StackStatus.CREATE_COMPLETE);
    });
  });

  // ─── Update — changed properties ─────────────────────────────────────────────

  describe('update — changed properties', () => {
    it('calls adapter.update when a resource has different properties', async () => {
      const updatedResources: ManifestResource[] = [];
      const adapter: Partial<ProviderAdapter> = {
        update: (r: ManifestResource): Promise<UpdateResult> => {
          updatedResources.push(r);
          return Promise.resolve({});
        },
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old-name' },
          },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { name: 'new-name' } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      expect(updatedResources).toHaveLength(1);
      expect(updatedResources[0].logicalId).toBe('ResA');
    });

    it('passes the patch (only changed keys) to adapter.update', async () => {
      const receivedPatches: unknown[] = [];
      const adapter: Partial<ProviderAdapter> = {
        update: (
          _r: ManifestResource,
          patch: unknown,
        ): Promise<UpdateResult> => {
          receivedPatches.push(patch);
          return Promise.resolve({});
        },
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'web', replicas: 2 },
          },
        ],
        adapter,
      );

      // Only 'replicas' changed — 'name' is the same.
      const stacks = [
        makeStack('S', [
          {
            logicalId: 'ResA',
            properties: { name: 'web', replicas: 4 },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      expect(receivedPatches[0]).toEqual({ replicas: 4 });
    });

    it('passes physicalId on the ManifestResource to adapter.update', async () => {
      const receivedResource: ManifestResource[] = [];
      const adapter: Partial<ProviderAdapter> = {
        update: (r: ManifestResource): Promise<UpdateResult> => {
          receivedResource.push(r);
          return Promise.resolve({});
        },
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old' },
          },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [{ logicalId: 'ResA', properties: { name: 'new' } }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      expect(receivedResource[0].physicalId).toBe('phys-A');
    });

    it('does NOT call adapter.update when properties are identical', async () => {
      const updateCalled: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        update: (r: ManifestResource): Promise<UpdateResult> => {
          updateCalled.push(r.logicalId);
          return Promise.resolve({});
        },
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'web', replicas: 2 },
          },
        ],
        adapter,
      );

      // Same properties — no update expected.
      const stacks = [
        makeStack('S', [
          {
            logicalId: 'ResA',
            properties: { name: 'web', replicas: 2 },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      expect(updateCalled).toHaveLength(0);
    });

    it('emits UPDATE_IN_PROGRESS and UPDATE_COMPLETE events for updated resource', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const adapter: Partial<ProviderAdapter> = {
        update: (): Promise<UpdateResult> => Promise.resolve({}),
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old' },
          },
        ],
        adapter,
        bus,
      );

      const stacks = [
        makeStack('S', [{ logicalId: 'ResA', properties: { name: 'new' } }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      const resAStatuses = events
        .filter((e) => e.logicalResourceId === 'ResA')
        .map((e) => e.resourceStatus);

      expect(resAStatuses).toContain(ResourceStatus.UPDATE_IN_PROGRESS);
      expect(resAStatuses).toContain(ResourceStatus.UPDATE_COMPLETE);
    });

    it('emits UPDATE_COMPLETE (not NO_CHANGES) for a stack with an updated resource', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const adapter: Partial<ProviderAdapter> = {
        update: (): Promise<UpdateResult> => Promise.resolve({}),
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old' },
          },
        ],
        adapter,
        bus,
      );

      const stacks = [
        makeStack('S', [{ logicalId: 'ResA', properties: { name: 'new' } }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      const stackStatuses = events
        .filter((e) => e.resourceType === 'cdkx::stack')
        .map((e) => e.resourceStatus);

      expect(stackStatuses).toContain(StackStatus.UPDATE_COMPLETE);
      expect(stackStatuses).not.toContain(StackStatus.NO_CHANGES);
    });

    it('returns success=false and emits UPDATE_FAILED when adapter.update throws', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const adapter: Partial<ProviderAdapter> = {
        update: (): Promise<UpdateResult> =>
          Promise.reject(new Error('update API error')),
        delete: (): Promise<void> => Promise.resolve(),
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old' },
          },
        ],
        adapter,
        bus,
      );

      const stacks = [
        makeStack('S', [{ logicalId: 'ResA', properties: { name: 'new' } }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(false);
      expect(result.stacks[0].error).toContain('update API error');

      const resAStatuses = events
        .filter((e) => e.logicalResourceId === 'ResA')
        .map((e) => e.resourceStatus);
      expect(resAStatuses).toContain(ResourceStatus.UPDATE_FAILED);
    });

    it('updates outputs in state after a successful update', async () => {
      let savedState: EngineState | undefined;
      const persistence = new StatePersistence('/fake', {
        mkdirSync: () => undefined,
        writeFileSync: (_, data) => {
          savedState = JSON.parse(data) as EngineState;
        },
        readFileSync: () => {
          throw new Error('not found');
        },
        existsSync: () => false,
        unlinkSync: () => undefined,
      });

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'old' },
                outputs: { serverId: 1 },
              },
            },
          },
        },
      };

      const bus = new EventBus<EngineEvent>();
      const stateManager = new EngineStateManager(bus, persistence, priorState);

      const engine = new DeploymentEngine({
        adapters: {
          test: {
            create: () => Promise.reject(new Error('not implemented')),
            update: (): Promise<UpdateResult> =>
              Promise.resolve({ outputs: { serverId: 2 } }),
            delete: () => Promise.resolve(),
            getOutput: () => Promise.resolve(undefined),
          },
        },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [
        makeStack('S', [{ logicalId: 'ResA', properties: { name: 'new' } }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      expect(savedState?.stacks['S']?.resources['ResA']?.outputs).toEqual({
        serverId: 2,
      });
      expect(savedState?.stacks['S']?.resources['ResA']?.properties).toEqual({
        name: 'new',
      });
    });

    it('includes a newly added key in the patch (prior had fewer keys)', async () => {
      const receivedPatches: unknown[] = [];
      const adapter: Partial<ProviderAdapter> = {
        update: (
          _r: ManifestResource,
          patch: unknown,
        ): Promise<UpdateResult> => {
          receivedPatches.push(patch);
          return Promise.resolve({});
        },
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'web' },
          },
        ],
        adapter,
      );

      // 'algorithm' is a new key not in prior props.
      const stacks = [
        makeStack('S', [
          {
            logicalId: 'ResA',
            properties: {
              name: 'web',
              algorithm: { type: 'least_connections' },
            },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      expect(receivedPatches[0]).toEqual({
        algorithm: { type: 'least_connections' },
      });
    });
  });

  // ─── Update — create-only prop filtering ──────────────────────────────────────

  describe('update — create-only prop filtering', () => {
    it('skips update (no-op) when all changed properties are create-only', async () => {
      // If the only difference between prior and new props is a create-only
      // property, the engine must not call adapter.update() at all.
      const updateMock = jest.fn().mockResolvedValue({});

      const adapter: Partial<ProviderAdapter> = {
        update: updateMock,
        getCreateOnlyProps: (_type: string) => new Set(['algorithm']),
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'lb', algorithm: { type: 'round_robin' } },
          },
        ],
        adapter,
      );

      // Only 'algorithm' changed — which is create-only.
      const stacks = [
        makeStack('S', [
          {
            logicalId: 'ResA',
            properties: {
              name: 'lb',
              algorithm: { type: 'least_connections' },
            },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      expect(updateMock).not.toHaveBeenCalled();
    });

    it('calls adapter.update with only mutable props when patch contains a mix', async () => {
      const receivedPatches: Record<string, unknown>[] = [];

      const adapter: Partial<ProviderAdapter> = {
        update: (
          _resource: ManifestResource,
          patch: unknown,
        ): Promise<UpdateResult> => {
          receivedPatches.push(patch as Record<string, unknown>);
          return Promise.resolve({});
        },
        getCreateOnlyProps: (_type: string) => new Set(['algorithm']),
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: {
              name: 'old-name',
              algorithm: { type: 'round_robin' },
            },
          },
        ],
        adapter,
      );

      // Both 'name' (mutable) and 'algorithm' (create-only) changed.
      const stacks = [
        makeStack('S', [
          {
            logicalId: 'ResA',
            properties: {
              name: 'new-name',
              algorithm: { type: 'least_connections' },
            },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      expect(receivedPatches).toHaveLength(1);
      // The patch passed to adapter.update must only contain the mutable prop.
      expect(receivedPatches[0]).toEqual({ name: 'new-name' });
      expect(receivedPatches[0]).not.toHaveProperty('algorithm');
    });

    it('calls adapter.update normally when adapter does not implement getCreateOnlyProps', async () => {
      const receivedPatches: Record<string, unknown>[] = [];

      // Adapter has no getCreateOnlyProps method at all.
      const adapter: Partial<ProviderAdapter> = {
        update: (
          _resource: ManifestResource,
          patch: unknown,
        ): Promise<UpdateResult> => {
          receivedPatches.push(patch as Record<string, unknown>);
          return Promise.resolve({});
        },
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old', algorithm: { type: 'round_robin' } },
          },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [
          {
            logicalId: 'ResA',
            properties: {
              name: 'new',
              algorithm: { type: 'least_connections' },
            },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      expect(receivedPatches).toHaveLength(1);
      // All diffs passed through — no filtering applied.
      expect(receivedPatches[0]).toEqual({
        name: 'new',
        algorithm: { type: 'least_connections' },
      });
    });

    it('emits UPDATE_IN_PROGRESS and UPDATE_COMPLETE only for mutable changes', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const adapter: Partial<ProviderAdapter> = {
        update: (): Promise<UpdateResult> => Promise.resolve({}),
        getCreateOnlyProps: (_type: string) => new Set(['algorithm']),
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { algorithm: { type: 'round_robin' } },
          },
        ],
        adapter,
        bus,
      );

      // Only create-only prop changed → no-op, no UPDATE events.
      const stacks = [
        makeStack('S', [
          {
            logicalId: 'ResA',
            properties: { algorithm: { type: 'least_connections' } },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      const resourceEvents = events.filter(
        (e) => e.logicalResourceId === 'ResA',
      );
      expect(
        resourceEvents.some(
          (e) => e.resourceStatus === ResourceStatus.UPDATE_IN_PROGRESS,
        ),
      ).toBe(false);
      expect(
        resourceEvents.some(
          (e) => e.resourceStatus === ResourceStatus.UPDATE_COMPLETE,
        ),
      ).toBe(false);
    });
  });

  // ─── Rollback bug regressions ─────────────────────────────────────────────────

  describe('rollback — pre-existing resources are not deleted', () => {
    it('does not call adapter.delete for a skipped (no-change) pre-existing resource during rollback', async () => {
      // Regression: before the fix, a skipped resource was pushed into
      // createdInOrder and then deleted during rollback.
      const deletedIds: string[] = [];

      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          if (r.logicalId === 'ResB') {
            return Promise.reject(new Error('create failed'));
          }
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedIds.push(r.logicalId);
          return Promise.resolve();
        },
      };

      // Prior: ResA already CREATE_COMPLETE with empty properties.
      // New assembly: ResA (unchanged, will be skipped) + ResB (new, will fail).
      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: {},
          },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [{ logicalId: 'ResA' }, { logicalId: 'ResB' }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      // ResA was skipped (no-change) — it must NOT be deleted during rollback.
      expect(deletedIds).not.toContain('ResA');
    });

    it('does not call adapter.delete for an updated pre-existing resource during rollback', async () => {
      // Regression: updated resources should not be in createdInOrder either.
      const deletedIds: string[] = [];

      const adapter: Partial<ProviderAdapter> = {
        update: (): Promise<UpdateResult> => Promise.resolve({}),
        create: (r: ManifestResource): Promise<CreateResult> => {
          if (r.logicalId === 'ResB') {
            return Promise.reject(new Error('create failed'));
          }
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedIds.push(r.logicalId);
          return Promise.resolve();
        },
      };

      // Prior: ResA CREATE_COMPLETE with old properties.
      // New assembly: ResA (changed, will be updated) + ResB (new, will fail).
      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old' },
          },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { name: 'new' } },
          { logicalId: 'ResB' },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      // ResA was updated (pre-existing) — it must NOT be deleted during rollback.
      expect(deletedIds).not.toContain('ResA');
    });
  });

  describe('rollback — resolved properties used for action resource delete', () => {
    it('passes resolved properties (not raw assembly properties) to adapter.delete during rollback', async () => {
      // Regression: before the fix, rollback passed resource.properties (which
      // may contain unresolved { ref, attr } tokens) instead of
      // resourceState.properties (which were resolved at creation time).
      const deletedResources: ManifestResource[] = [];

      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          if (r.logicalId === 'Net') {
            return Promise.resolve({
              physicalId: 'net-42',
              outputs: { networkId: 42 },
            });
          }
          if (r.logicalId === 'Subnet') {
            return Promise.resolve({ physicalId: 'net-42:10.0.1.0/24' });
          }
          // LoadBalancer fails → triggers rollback
          return Promise.reject(new Error('lb create failed'));
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedResources.push(r);
          return Promise.resolve();
        },
      };

      const engine = makeEngine(adapter);
      const stacks = [
        makeStack('S', [
          { logicalId: 'Net', properties: {} },
          {
            logicalId: 'Subnet',
            properties: { networkId: { ref: 'Net', attr: 'networkId' } },
          },
          { logicalId: 'LB', properties: {} },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['Net', 'Subnet', 'LB'] });
      await engine.deploy(stacks, plan);

      // Subnet was created before LB failed — it must be rolled back.
      const subnetDelete = deletedResources.find(
        (r) => r.logicalId === 'Subnet',
      );
      expect(subnetDelete).toBeDefined();
      // The networkId in rollback must be the resolved integer (42), NOT the
      // { ref, attr } token.
      expect(subnetDelete?.properties['networkId']).toBe(42);
    });
  });

  // ─── Logger integration ───────────────────────────────────────────────────────

  describe('logger integration', () => {
    it('subscribes the logger to the event bus when provided', () => {
      const loggedEvents: Array<{
        level: string;
        type: string;
        stackId: string;
        resourceId: string;
        data: Record<string, unknown>;
      }> = [];

      const mockLogger = {
        debug: (
          type: string,
          data: {
            stackId: string;
            resourceId: string;
            data: Record<string, unknown>;
          },
        ) => {
          loggedEvents.push({ level: 'debug', type, ...data });
        },
        info: (
          type: string,
          data: {
            stackId: string;
            resourceId: string;
            data: Record<string, unknown>;
          },
        ) => {
          loggedEvents.push({ level: 'info', type, ...data });
        },
        warn: (
          type: string,
          data: {
            stackId: string;
            resourceId: string;
            data: Record<string, unknown>;
          },
        ) => {
          loggedEvents.push({ level: 'warn', type, ...data });
        },
        error: (
          type: string,
          data: {
            stackId: string;
            resourceId: string;
            data: Record<string, unknown>;
          },
        ) => {
          loggedEvents.push({ level: 'error', type, ...data });
        },
        child: () => mockLogger,
      };

      const eventBus = new EventBus<EngineEvent>();
      const persistence = makeNullPersistence();
      const stateManager = new EngineStateManager(eventBus, persistence);
      const fullAdapter: ProviderAdapter = {
        create: () => Promise.resolve({ physicalId: 'res-1' }),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        eventBus,
        logger: mockLogger as any,
        deployLock: makeMockDeployLock(),
      });

      // Emit a sample event
      eventBus.emit({
        timestamp: new Date(),
        stackId: 'TestStack',
        logicalResourceId: 'TestResource',
        resourceType: 'test::Resource',
        resourceStatus: ResourceStatus.CREATE_IN_PROGRESS,
      });

      expect(loggedEvents).toHaveLength(1);
      expect(loggedEvents[0]).toMatchObject({
        level: 'debug', // _IN_PROGRESS → debug
        type: 'engine.state.resource.transition',
        stackId: 'TestStack',
        resourceId: 'TestResource',
        data: {
          resourceType: 'test::Resource',
          resourceStatus: ResourceStatus.CREATE_IN_PROGRESS,
        },
      });
    });

    it('maps CREATE_COMPLETE to info level', () => {
      const loggedEvents: Array<{ level: string }> = [];
      const mockLogger = {
        debug: () => loggedEvents.push({ level: 'debug' }),
        info: () => loggedEvents.push({ level: 'info' }),
        warn: () => loggedEvents.push({ level: 'warn' }),
        error: () => loggedEvents.push({ level: 'error' }),
        child: () => mockLogger,
      };

      const eventBus = new EventBus<EngineEvent>();
      const persistence = makeNullPersistence();
      const stateManager = new EngineStateManager(eventBus, persistence);
      const fullAdapter: ProviderAdapter = {
        create: () => Promise.resolve({ physicalId: 'res-1' }),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake',
        stateDir: '/fake',
        stateManager,
        eventBus,
        logger: mockLogger as any,
        deployLock: makeMockDeployLock(),
      });

      eventBus.emit({
        timestamp: new Date(),
        stackId: 'S',
        logicalResourceId: 'R',
        resourceType: 'test::Resource',
        resourceStatus: ResourceStatus.CREATE_COMPLETE,
      });

      expect(loggedEvents).toHaveLength(1);
      expect(loggedEvents[0].level).toBe('info');
    });

    it('maps CREATE_FAILED to error level and includes error object', () => {
      const loggedEvents: Array<{
        level: string;
        error?: Error;
      }> = [];

      const mockLogger = {
        debug: () => loggedEvents.push({ level: 'debug' }),
        info: () => loggedEvents.push({ level: 'info' }),
        warn: () => loggedEvents.push({ level: 'warn' }),
        error: (_type: string, _data: unknown, error?: Error) => {
          loggedEvents.push({ level: 'error', error });
        },
        child: () => mockLogger,
      };

      const eventBus = new EventBus<EngineEvent>();
      const persistence = makeNullPersistence();
      const stateManager = new EngineStateManager(eventBus, persistence);
      const fullAdapter: ProviderAdapter = {
        create: () => Promise.resolve({ physicalId: 'res-1' }),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake',
        stateDir: '/fake',
        stateManager,
        eventBus,
        logger: mockLogger as any,
        deployLock: makeMockDeployLock(),
      });

      eventBus.emit({
        timestamp: new Date(),
        stackId: 'S',
        logicalResourceId: 'R',
        resourceType: 'test::Resource',
        resourceStatus: ResourceStatus.CREATE_FAILED,
        resourceStatusReason: 'API error: resource limit exceeded',
      });

      expect(loggedEvents).toHaveLength(1);
      expect(loggedEvents[0].level).toBe('error');
      expect(loggedEvents[0].error).toBeInstanceOf(Error);
      expect(loggedEvents[0].error?.message).toBe(
        'API error: resource limit exceeded',
      );
    });

    it('maps ROLLBACK_IN_PROGRESS to warn level', () => {
      const loggedEvents: Array<{ level: string }> = [];
      const mockLogger = {
        debug: () => loggedEvents.push({ level: 'debug' }),
        info: () => loggedEvents.push({ level: 'info' }),
        warn: () => loggedEvents.push({ level: 'warn' }),
        error: () => loggedEvents.push({ level: 'error' }),
        child: () => mockLogger,
      };

      const eventBus = new EventBus<EngineEvent>();
      const persistence = makeNullPersistence();
      const stateManager = new EngineStateManager(eventBus, persistence);
      const fullAdapter: ProviderAdapter = {
        create: () => Promise.resolve({ physicalId: 'res-1' }),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake',
        stateDir: '/fake',
        stateManager,
        eventBus,
        logger: mockLogger as any,
        deployLock: makeMockDeployLock(),
      });

      eventBus.emit({
        timestamp: new Date(),
        stackId: 'S',
        logicalResourceId: 'S',
        resourceType: 'cdkx::stack',
        resourceStatus: StackStatus.ROLLBACK_IN_PROGRESS,
      });

      expect(loggedEvents).toHaveLength(1);
      expect(loggedEvents[0].level).toBe('warn');
    });

    it('uses "engine.state.stack.transition" type for stack events', () => {
      const loggedEvents: Array<{ type: string }> = [];
      const mockLogger = {
        debug: (type: string) => loggedEvents.push({ type }),
        info: (type: string) => loggedEvents.push({ type }),
        warn: (type: string) => loggedEvents.push({ type }),
        error: (type: string) => loggedEvents.push({ type }),
        child: () => mockLogger,
      };

      const eventBus = new EventBus<EngineEvent>();
      const persistence = makeNullPersistence();
      const stateManager = new EngineStateManager(eventBus, persistence);
      const fullAdapter: ProviderAdapter = {
        create: () => Promise.resolve({ physicalId: 'res-1' }),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake',
        stateDir: '/fake',
        stateManager,
        eventBus,
        logger: mockLogger as any,
        deployLock: makeMockDeployLock(),
      });

      eventBus.emit({
        timestamp: new Date(),
        stackId: 'S',
        logicalResourceId: 'S',
        resourceType: 'cdkx::stack',
        resourceStatus: StackStatus.CREATE_IN_PROGRESS,
      });

      expect(loggedEvents).toHaveLength(1);
      expect(loggedEvents[0].type).toBe('engine.state.stack.transition');
    });

    it('does not log when logger is not provided', () => {
      const events: EngineEvent[] = [];
      const eventBus = new EventBus<EngineEvent>();
      const persistence = makeNullPersistence();
      const stateManager = new EngineStateManager(eventBus, persistence);
      const fullAdapter: ProviderAdapter = {
        create: () => Promise.resolve({ physicalId: 'res-1' }),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      // No logger provided
      new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake',
        stateDir: '/fake',
        stateManager,
        eventBus,
        deployLock: makeMockDeployLock(),
      });

      // Subscribe to the bus directly to verify events are emitted
      eventBus.subscribe((event) => events.push(event));

      eventBus.emit({
        timestamp: new Date(),
        stackId: 'S',
        logicalResourceId: 'R',
        resourceType: 'test::Resource',
        resourceStatus: ResourceStatus.CREATE_COMPLETE,
      });

      // Event was emitted, but no logger was called (no error thrown)
      expect(events).toHaveLength(1);
    });
  });

  // ─── Wave-aware rollback phase 1 ─────────────────────────────────────────────

  describe('wave-aware rollback phase 1', () => {
    function makePlanWithResourceWaves(
      stackId: string,
      resourceWaves: string[][],
    ): DeploymentPlan {
      return {
        stackWaves: [[stackId]],
        resourceWaves: { [stackId]: resourceWaves },
      };
    }

    it('rolls back resources in reverse wave order across multiple waves', async () => {
      const deletedIds: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          if (r.logicalId === 'ResC') {
            return Promise.reject(new Error('oops'));
          }
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedIds.push(r.logicalId);
          return Promise.resolve();
        },
      };

      const engine = makeEngine(adapter);
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA' },
          { logicalId: 'ResB' },
          { logicalId: 'ResC' },
        ]),
      ];
      // Wave 1: [ResA, ResB] both succeed; Wave 2: [ResC] fails.
      const plan = makePlanWithResourceWaves('S', [['ResA', 'ResB'], ['ResC']]);
      await engine.deploy(stacks, plan);

      // ResA and ResB (wave 1) were created; ResC (wave 2) failed — not created.
      // Rollback: reverse wave 2 (empty), then reverse wave 1 → [ResB, ResA].
      expect(deletedIds).toEqual(['ResB', 'ResA']);
    });

    it('deletes resources within a wave in reverse order', async () => {
      const deletedIds: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          if (r.logicalId === 'ResD') {
            return Promise.reject(new Error('oops'));
          }
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedIds.push(r.logicalId);
          return Promise.resolve();
        },
      };

      const engine = makeEngine(adapter);
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA' },
          { logicalId: 'ResB' },
          { logicalId: 'ResC' },
          { logicalId: 'ResD' },
        ]),
      ];
      // Wave 1: [ResA, ResB, ResC, ResD] — ResD fails, ResA/B/C succeed.
      const plan = makePlanWithResourceWaves('S', [
        ['ResA', 'ResB', 'ResC', 'ResD'],
      ]);
      await engine.deploy(stacks, plan);

      // Within wave 1, ResA, ResB, ResC were created; ResD failed.
      // Rollback reverses within the wave: [ResC, ResB, ResA].
      expect(deletedIds).toEqual(['ResC', 'ResB', 'ResA']);
    });

    it('rolls back wave 2 before wave 1 when wave 2 resource fails', async () => {
      const deletedIds: string[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          if (r.logicalId === 'ResC') {
            return Promise.reject(new Error('oops'));
          }
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
        delete: (r: ManifestResource): Promise<void> => {
          deletedIds.push(r.logicalId);
          return Promise.resolve();
        },
      };

      const engine = makeEngine(adapter);
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA' },
          { logicalId: 'ResB' },
          { logicalId: 'ResC' },
        ]),
      ];
      // Wave 1: [ResA], Wave 2: [ResB], Wave 3: [ResC] fails.
      const plan = makePlanWithResourceWaves('S', [
        ['ResA'],
        ['ResB'],
        ['ResC'],
      ]);
      await engine.deploy(stacks, plan);

      // ResB (wave 2) must be deleted before ResA (wave 1).
      const resBIndex = deletedIds.indexOf('ResB');
      const resAIndex = deletedIds.indexOf('ResA');
      expect(resBIndex).toBeLessThan(resAIndex);
    });
  });

  // ─── updatedInOrder tracking ─────────────────────────────────────────────────

  describe('updatedInOrder tracking', () => {
    it('populates updatedInOrder for each resource that reaches UPDATE_COMPLETE', async () => {
      const adapter: Partial<ProviderAdapter> = {
        update: (): Promise<UpdateResult> => Promise.resolve({}),
      };

      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old-a' },
          },
          {
            logicalId: 'ResB',
            physicalId: 'phys-B',
            properties: { name: 'old-b' },
          },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { name: 'new-a' } },
          { logicalId: 'ResB', properties: { name: 'new-b' } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      const updated = engine.getUpdatedInOrder();
      expect(updated).toHaveLength(2);
      expect(updated[0]).toEqual({ logicalId: 'ResA', stackId: 'S' });
      expect(updated[1]).toEqual({ logicalId: 'ResB', stackId: 'S' });
    });

    it('does not add to updatedInOrder for created resources', async () => {
      const engine = makeEngine(successAdapter('phys-001'));

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);

      expect(engine.getUpdatedInOrder()).toHaveLength(0);
    });

    it('does not add to updatedInOrder for skipped (no-change) resources', async () => {
      const engine = makeEngineWithPriorState(
        [{ logicalId: 'ResA', physicalId: 'phys-A' }],
        {},
      );

      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      expect(engine.getUpdatedInOrder()).toHaveLength(0);
    });
  });

  // ─── Snapshot lifecycle ───────────────────────────────────────────────────

  describe('snapshot lifecycle', () => {
    function makeTrackingPersistence(): {
      persistence: StatePersistence;
      snapshotWritten: boolean;
      snapshotDeleted: boolean;
    } {
      const tracking = { snapshotWritten: false, snapshotDeleted: false };
      let snapshotExists = false;

      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_p, data) => {
          if (_p.includes('snapshot')) {
            tracking.snapshotWritten = true;
            snapshotExists = true;
          }
          void data;
        },
        existsSync: (p) => (p.includes('snapshot') ? snapshotExists : false),
        readFileSync: () => {
          throw new Error('not found');
        },
        unlinkSync: (p) => {
          if (p.includes('snapshot')) {
            tracking.snapshotDeleted = true;
            snapshotExists = false;
          }
        },
      };

      return {
        persistence: new StatePersistence('/fake', deps),
        get snapshotWritten() {
          return tracking.snapshotWritten;
        },
        get snapshotDeleted() {
          return tracking.snapshotDeleted;
        },
      };
    }

    it('writes snapshot before any resource is created', async () => {
      let snapshotWrittenBeforeCreate = false;
      let snapshotWritten = false;

      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_p) => {
          if (_p.includes('snapshot')) snapshotWritten = true;
        },
        existsSync: () => false,
        readFileSync: () => {
          throw new Error('not found');
        },
        unlinkSync: () => undefined,
      };

      const persistence = new StatePersistence('/fake', deps);
      const bus = new EventBus<EngineEvent>();
      const stateManager = new EngineStateManager(bus, persistence);

      const adapter: ProviderAdapter = {
        create: async (resource): Promise<CreateResult> => {
          snapshotWrittenBeforeCreate = snapshotWritten;
          return { physicalId: `phys-${resource.logicalId}` };
        },
        update: () => Promise.reject(new Error('not implemented')),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: adapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);

      expect(snapshotWrittenBeforeCreate).toBe(true);
    });

    it('deletes snapshot after a fully successful deployment', async () => {
      const tracking = makeTrackingPersistence();
      const bus = new EventBus<EngineEvent>();
      const stateManager = new EngineStateManager(bus, tracking.persistence);

      const engine = new DeploymentEngine({
        adapters: { test: { ...successAdapter('srv-001') } as ProviderAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence: tracking.persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
      expect(tracking.snapshotWritten).toBe(true);
      expect(tracking.snapshotDeleted).toBe(true);
    });

    it('does NOT delete snapshot after a failed deployment', async () => {
      const tracking = makeTrackingPersistence();
      const bus = new EventBus<EngineEvent>();
      const stateManager = new EngineStateManager(bus, tracking.persistence);

      const engine = new DeploymentEngine({
        adapters: {
          test: { ...failingAdapter('boom') } as ProviderAdapter,
        },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence: tracking.persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(false);
      expect(tracking.snapshotWritten).toBe(true);
      expect(tracking.snapshotDeleted).toBe(false);
    });

    it('writes snapshot on a normal (no prior state) deployment', async () => {
      const tracking = makeTrackingPersistence();
      const bus = new EventBus<EngineEvent>();
      const stateManager = new EngineStateManager(bus, tracking.persistence);

      const engine = new DeploymentEngine({
        adapters: { test: { ...successAdapter('srv-001') } as ProviderAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence: tracking.persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      await engine.deploy(stacks, plan);

      expect(tracking.snapshotWritten).toBe(true);
    });
  });

  // ─── Rollback phase 2 — restore updated resources ────────────────────────

  describe('rollback phase 2 — restore updated resources', () => {
    /**
     * Build a persistence that stores the snapshot in memory so it can be
     * returned by readSnapshot() during rollback.
     */
    function makeSnapshotCapturingPersistence(): StatePersistence {
      let snapshotData: string | undefined;

      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: (_p, data) => {
          if (_p.includes('snapshot')) snapshotData = data;
        },
        existsSync: (p) =>
          p.includes('snapshot') ? snapshotData !== undefined : false,
        readFileSync: (p) => {
          if (p.includes('snapshot') && snapshotData !== undefined) {
            return snapshotData;
          }
          throw new Error('not found');
        },
        unlinkSync: () => undefined,
      };

      return new StatePersistence('/fake', deps);
    }

    it('restores an updated resource to its snapshot properties on rollback', async () => {
      const updateCalls: { resource: ManifestResource; patch: unknown }[] = [];

      const adapter: Partial<ProviderAdapter> = {
        update: (resource, patch): Promise<UpdateResult> => {
          updateCalls.push({ resource, patch });
          return Promise.resolve({});
        },
        create: (resource): Promise<CreateResult> => {
          if (resource.logicalId === 'ResB') {
            return Promise.reject(new Error('create failed'));
          }
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        delete: (): Promise<void> => Promise.resolve(),
      };

      const persistence = makeSnapshotCapturingPersistence();
      const bus = new EventBus<EngineEvent>();

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'old-a' },
                lastAppliedProperties: { name: 'old-a' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);

      const fullAdapter: ProviderAdapter = {
        create:
          adapter.create ??
          (() => Promise.reject(new Error('not implemented'))),
        update:
          adapter.update ??
          (() => Promise.reject(new Error('not implemented'))),
        delete: adapter.delete ?? (() => Promise.resolve()),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      // ResA is updated (name changes), ResB is new and fails on create.
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { name: 'new-a' } },
          { logicalId: 'ResB', properties: { name: 'b' } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      // Phase 2 should call update() once to restore ResA (the forward update
      // also calls update(), so total = 2).
      const restoreCall = updateCalls.find(
        (c) =>
          c.resource.logicalId === 'ResA' &&
          (c.resource.properties as Record<string, unknown>)['name'] ===
            'old-a',
      );
      expect(restoreCall).toBeDefined();
      expect(restoreCall?.resource.properties).toEqual({ name: 'old-a' });
    });

    it('transitions resource to UPDATE_ROLLBACK_COMPLETE after successful restore', async () => {
      const events: EngineEvent[] = [];

      const adapter: Partial<ProviderAdapter> = {
        update: (): Promise<UpdateResult> => Promise.resolve({}),
        create: (resource): Promise<CreateResult> => {
          if (resource.logicalId === 'ResB') {
            return Promise.reject(new Error('boom'));
          }
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        delete: (): Promise<void> => Promise.resolve(),
      };

      const persistence = makeSnapshotCapturingPersistence();
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'old-a' },
                lastAppliedProperties: { name: 'old-a' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);
      const fullAdapter: ProviderAdapter = {
        create:
          adapter.create ??
          (() => Promise.reject(new Error('not implemented'))),
        update:
          adapter.update ??
          (() => Promise.reject(new Error('not implemented'))),
        delete: adapter.delete ?? (() => Promise.resolve()),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { name: 'new-a' } },
          { logicalId: 'ResB', properties: { name: 'b' } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      const rollbackComplete = events.find(
        (e) =>
          e.logicalResourceId === 'ResA' &&
          e.resourceStatus === ResourceStatus.UPDATE_ROLLBACK_COMPLETE,
      );
      expect(rollbackComplete).toBeDefined();
    });

    it('skips resource when snapshot has no lastAppliedProperties', async () => {
      const updateCalls: { resource: ManifestResource }[] = [];

      const adapter: Partial<ProviderAdapter> = {
        update: (resource): Promise<UpdateResult> => {
          updateCalls.push({ resource });
          return Promise.resolve({});
        },
        create: (resource): Promise<CreateResult> => {
          if (resource.logicalId === 'ResB') {
            return Promise.reject(new Error('boom'));
          }
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        delete: (): Promise<void> => Promise.resolve(),
      };

      // Prior state has no lastAppliedProperties — snapshot will lack it too.
      const engine = makeEngineWithPriorStateAndProps(
        [
          {
            logicalId: 'ResA',
            physicalId: 'phys-A',
            properties: { name: 'old-a' },
          },
        ],
        adapter,
      );

      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { name: 'new-a' } },
          { logicalId: 'ResB', properties: { name: 'b' } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      // Only the forward update call should exist; no rollback restore call.
      const restoreCalls = updateCalls.filter(
        (c) =>
          c.resource.logicalId === 'ResA' &&
          (c.resource.properties as Record<string, unknown>)['name'] ===
            'old-a',
      );
      expect(restoreCalls).toHaveLength(0);
    });

    it('skips resource when current lastAppliedProperties already matches snapshot', async () => {
      const updateCalls: ManifestResource[] = [];

      const adapter: Partial<ProviderAdapter> = {
        update: (resource): Promise<UpdateResult> => {
          updateCalls.push(resource);
          return Promise.resolve({});
        },
        create: (resource): Promise<CreateResult> => {
          if (resource.logicalId === 'ResB') {
            return Promise.reject(new Error('boom'));
          }
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        delete: (): Promise<void> => Promise.resolve(),
      };

      const persistence = makeSnapshotCapturingPersistence();
      const bus = new EventBus<EngineEvent>();

      // Prior state: ResA with lastAppliedProperties = { name: 'old-a' }.
      // New assembly: ResA with properties = { name: 'old-a' } — no change.
      // But the adapter.update() will still be called for the forward pass
      // only if properties differ from stored properties. Since they're the
      // same here, ResA will be skipped entirely (not added to updatedInOrder).
      // So there should be no phase 2 restore call at all.
      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'old-a' },
                lastAppliedProperties: { name: 'old-a' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);
      const fullAdapter: ProviderAdapter = {
        create:
          adapter.create ??
          (() => Promise.reject(new Error('not implemented'))),
        update:
          adapter.update ??
          (() => Promise.reject(new Error('not implemented'))),
        delete: adapter.delete ?? (() => Promise.resolve()),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [
        makeStack('S', [
          // ResA has same properties as prior — no update triggered.
          { logicalId: 'ResA', properties: { name: 'old-a' } },
          { logicalId: 'ResB', properties: { name: 'b' } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      // ResA was never updated (skipped), so phase 2 should not restore it.
      expect(updateCalls).toHaveLength(0);
    });

    it('continues restoring remaining resources when one restore fails', async () => {
      const updateCalls: string[] = [];

      let callIndex = 0;
      const adapter: Partial<ProviderAdapter> = {
        update: (resource): Promise<UpdateResult> => {
          updateCalls.push(resource.logicalId);
          callIndex++;
          // ResB restore fails; ResA restore succeeds (called after in reverse order).
          if (
            resource.logicalId === 'ResB' &&
            resource.properties['name'] === 'old-b'
          ) {
            return Promise.reject(new Error('restore failed'));
          }
          return Promise.resolve({});
        },
        create: (resource): Promise<CreateResult> => {
          if (resource.logicalId === 'ResC') {
            return Promise.reject(new Error('create boom'));
          }
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        delete: (): Promise<void> => Promise.resolve(),
      };

      const persistence = makeSnapshotCapturingPersistence();
      const bus = new EventBus<EngineEvent>();

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'old-a' },
                lastAppliedProperties: { name: 'old-a' },
              },
              ResB: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-B',
                properties: { name: 'old-b' },
                lastAppliedProperties: { name: 'old-b' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);
      const fullAdapter: ProviderAdapter = {
        create:
          adapter.create ??
          (() => Promise.reject(new Error('not implemented'))),
        update:
          adapter.update ??
          (() => Promise.reject(new Error('not implemented'))),
        delete: adapter.delete ?? (() => Promise.resolve()),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      // ResA and ResB are updated (order: ResA first, ResB second).
      // ResC fails on create → triggers rollback.
      // Phase 2 restores in reverse: ResB first (fails), then ResA (succeeds).
      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { name: 'new-a' } },
          { logicalId: 'ResB', properties: { name: 'new-b' } },
          { logicalId: 'ResC', properties: { name: 'c' } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB', 'ResC'] });
      await engine.deploy(stacks, plan);

      // Both ResB and ResA should have been attempted for restore (in reverse
      // order), even though ResB's restore failed.
      const restoreCallIds = updateCalls.filter(
        (id) => id === 'ResA' || id === 'ResB',
      );
      // Forward updates: ResA, ResB. Restore attempts: ResB (fails), ResA.
      // ResA restore call comes after ResB's forward and ResB's failed restore.
      expect(restoreCallIds).toContain('ResB');
      expect(restoreCallIds).toContain('ResA');

      // ResA should be the last update call (restore succeeds after ResB fails).
      const lastRestoreResA = updateCalls.lastIndexOf('ResA');
      const lastRestoreResB = updateCalls.lastIndexOf('ResB');
      expect(lastRestoreResA).toBeGreaterThan(lastRestoreResB);
    });

    it('transitions failing restore to UPDATE_ROLLBACK_FAILED', async () => {
      const events: EngineEvent[] = [];

      const adapter: Partial<ProviderAdapter> = {
        update: (resource): Promise<UpdateResult> => {
          // Fail only the rollback restore (when properties = old-a).
          if (
            resource.logicalId === 'ResA' &&
            (resource.properties as Record<string, unknown>)['name'] === 'old-a'
          ) {
            return Promise.reject(new Error('restore failed'));
          }
          return Promise.resolve({});
        },
        create: (resource): Promise<CreateResult> => {
          if (resource.logicalId === 'ResB') {
            return Promise.reject(new Error('boom'));
          }
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        delete: (): Promise<void> => Promise.resolve(),
      };

      const persistence = makeSnapshotCapturingPersistence();
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'old-a' },
                lastAppliedProperties: { name: 'old-a' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);
      const fullAdapter: ProviderAdapter = {
        create:
          adapter.create ??
          (() => Promise.reject(new Error('not implemented'))),
        update:
          adapter.update ??
          (() => Promise.reject(new Error('not implemented'))),
        delete: adapter.delete ?? (() => Promise.resolve()),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [
        makeStack('S', [
          { logicalId: 'ResA', properties: { name: 'new-a' } },
          { logicalId: 'ResB', properties: { name: 'b' } },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      await engine.deploy(stacks, plan);

      const rollbackFailed = events.find(
        (e) =>
          e.logicalResourceId === 'ResA' &&
          e.resourceStatus === ResourceStatus.UPDATE_ROLLBACK_FAILED,
      );
      expect(rollbackFailed).toBeDefined();
    });
  });

  // ─── Rollback phase 3 — recreate reconcile-deleted resources ────────────────

  describe('rollback phase 3 — recreate reconcile-deleted resources', () => {
    it('populates reconciledDeletedInOrder during reconcile', async () => {
      const persistence = makeNullPersistence();
      const bus = new EventBus<EngineEvent>();

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'a' },
                lastAppliedProperties: { name: 'a' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);
      const fullAdapter: ProviderAdapter = {
        create: (): Promise<CreateResult> =>
          Promise.resolve({ physicalId: 'phys-new' }),
        update: (): Promise<UpdateResult> => Promise.resolve({}),
        delete: (): Promise<void> => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      // New assembly: ResA removed, ResB added
      const stacks = [makeStack('S', [{ logicalId: 'ResB' }])];
      const plan = makePlan(['S'], { S: ['ResB'] });
      await engine.deploy(stacks, plan);

      const deleted = engine.getReconciledDeletedInOrder();
      expect(deleted).toHaveLength(1);
      expect(deleted[0].logicalId).toBe('ResA');
      expect(deleted[0].type).toBe('test::Resource');
      expect(deleted[0].provider).toBe('test');
      expect(deleted[0].physicalId).toBe('phys-A');
      expect(deleted[0].priorProperties).toEqual({ name: 'a' });
    });

    it('recreates a reconcile-deleted resource during rollback when it has no surviving dependents', async () => {
      const createCalls: string[] = [];
      const deleteCalls: string[] = [];

      const adapter: Partial<ProviderAdapter> = {
        create: (resource): Promise<CreateResult> => {
          createCalls.push(resource.logicalId);
          if (resource.logicalId === 'ResB') {
            return Promise.reject(new Error('ResB failed'));
          }
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        delete: (resource): Promise<void> => {
          deleteCalls.push(resource.logicalId);
          return Promise.resolve();
        },
      };

      const persistence = makeNullPersistence();
      const bus = new EventBus<EngineEvent>();

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'a' },
                lastAppliedProperties: { name: 'a' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);
      const fullAdapter: ProviderAdapter = {
        create:
          adapter.create ??
          (() => Promise.reject(new Error('not implemented'))),
        update: () => Promise.resolve({}),
        delete: adapter.delete ?? (() => Promise.resolve()),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      // ResA removed from new assembly, ResB added (fails to create).
      // ResB has no reference to ResA — phase 3 should recreate ResA.
      const stacks = [
        makeStack('S', [{ logicalId: 'ResB', properties: { name: 'b' } }]),
      ];
      const plan = makePlan(['S'], { S: ['ResB'] });
      await engine.deploy(stacks, plan);

      // ResA was deleted during reconcile, then recreated during phase 3.
      expect(deleteCalls).toContain('ResA');
      expect(createCalls).toContain('ResA');
    });

    it('transitions stack to ROLLBACK_COMPLETE when all deleted resources are recreated', async () => {
      const events: EngineEvent[] = [];

      const adapter: Partial<ProviderAdapter> = {
        create: (resource): Promise<CreateResult> => {
          if (resource.logicalId === 'ResB') {
            return Promise.reject(new Error('ResB failed'));
          }
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        delete: (): Promise<void> => Promise.resolve(),
      };

      const persistence = makeNullPersistence();
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'a' },
                lastAppliedProperties: { name: 'a' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);
      const fullAdapter: ProviderAdapter = {
        create:
          adapter.create ??
          (() => Promise.reject(new Error('not implemented'))),
        update: () => Promise.resolve({}),
        delete: adapter.delete ?? (() => Promise.resolve()),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [makeStack('S', [{ logicalId: 'ResB' }])];
      const plan = makePlan(['S'], { S: ['ResB'] });
      await engine.deploy(stacks, plan);

      // Prior state exists → isUpdate = true → UPDATE_ROLLBACK_COMPLETE (not partial).
      const stackEvent = events.find(
        (e) =>
          e.resourceType === 'cdkx::stack' &&
          e.resourceStatus === StackStatus.UPDATE_ROLLBACK_COMPLETE,
      );
      expect(stackEvent).toBeDefined();
    });

    it('transitions stack to ROLLBACK_PARTIAL when a reconcile-deleted resource fails to recreate', async () => {
      const events: EngineEvent[] = [];

      // ResA: deleted during reconcile, then fails to recreate in phase 3.
      // ResB: new resource that also fails, triggering rollback.
      const adapter: Partial<ProviderAdapter> = {
        create: (resource): Promise<CreateResult> => {
          // Both ResA (phase 3 recreate) and ResB (forward) fail.
          return Promise.reject(
            new Error(`${resource.logicalId} create failed`),
          );
        },
        delete: (): Promise<void> => Promise.resolve(),
      };

      const persistence = makeNullPersistence();
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'a' },
                lastAppliedProperties: { name: 'a' },
              },
            },
          },
        },
      };

      const stateManager = new EngineStateManager(bus, persistence, priorState);
      const fullAdapter: ProviderAdapter = {
        create:
          adapter.create ??
          (() => Promise.reject(new Error('not implemented'))),
        update: () => Promise.resolve({}),
        delete: adapter.delete ?? (() => Promise.resolve()),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      // ResA removed, ResB added (fails) → rollback → ResA recreate also fails.
      const stacks = [makeStack('S', [{ logicalId: 'ResB' }])];
      const plan = makePlan(['S'], { S: ['ResB'] });
      await engine.deploy(stacks, plan);

      const partialEvent = events.find(
        (e) =>
          e.resourceType === 'cdkx::stack' &&
          e.resourceStatus === StackStatus.ROLLBACK_PARTIAL,
      );
      expect(partialEvent).toBeDefined();
    });

    it('does not block a subsequent deployment when stack is in ROLLBACK_PARTIAL', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      // Prior state: stack left in ROLLBACK_PARTIAL from a previous run.
      const priorState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.ROLLBACK_PARTIAL,
            resources: {},
          },
        },
      };

      const persistence = makeNullPersistence();
      const stateManager = new EngineStateManager(bus, persistence, priorState);

      const fullAdapter: ProviderAdapter = {
        create: () => Promise.resolve({ physicalId: 'phys-new' }),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      // Deploy a fresh resource — should succeed despite prior ROLLBACK_PARTIAL.
      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(true);
    });
  });

  // ─── Crash recovery ──────────────────────────────────────────────────────────

  describe('crash recovery — resume rollback from snapshot', () => {
    /**
     * Build a StatePersistence where snapshotExists() returns true and
     * readSnapshot() returns the provided snapshot state. The main state
     * file returns `currentState` (simulating a partially-applied deployment).
     * Calls to writeSnapshot/deleteSnapshot/save are tracked via arrays.
     */
    function makeSnapshotPersistence(opts: {
      snapshotState: EngineState;
      currentState?: EngineState;
      deletedSnapshots?: string[];
    }): StatePersistence {
      const deleted = opts.deletedSnapshots ?? [];
      const snapshotJson = JSON.stringify(opts.snapshotState);
      const currentJson = opts.currentState
        ? JSON.stringify(opts.currentState)
        : null;

      const deps: StatePersistenceDeps = {
        mkdirSync: () => undefined,
        writeFileSync: () => undefined,
        readFileSync: (filePath: string) => {
          if (String(filePath).endsWith('snapshot.json')) {
            return snapshotJson;
          }
          if (currentJson !== null) {
            return currentJson;
          }
          throw new Error('not found');
        },
        existsSync: (filePath: string) => {
          // snapshot file always exists; main state file exists only if currentState provided
          if (String(filePath).endsWith('snapshot.json')) return true;
          return currentJson !== null;
        },
        unlinkSync: (filePath: string) => {
          deleted.push(String(filePath));
        },
      };

      return new StatePersistence('/fake', deps);
    }

    it('skips forward deployment and runs rollback when snapshot exists', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      // Snapshot: ResA was the known-good state before the interrupted deployment.
      const snapshotState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'a' },
                lastAppliedProperties: { name: 'a' },
              },
            },
          },
        },
      };

      // Current state: ResA still present (not deleted), ResB was created during
      // the interrupted deployment and should be rolled back (deleted).
      const currentState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.UPDATE_IN_PROGRESS,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'a' },
                lastAppliedProperties: { name: 'a' },
              },
              ResB: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-B',
                properties: { name: 'b' },
                lastAppliedProperties: { name: 'b' },
              },
            },
          },
        },
      };

      const deletedSnapshots: string[] = [];
      const persistence = makeSnapshotPersistence({
        snapshotState,
        currentState,
        deletedSnapshots,
      });

      const deleteLog: string[] = [];
      const fullAdapter: ProviderAdapter = {
        create: () => Promise.reject(new Error('should not be called')),
        update: () => Promise.reject(new Error('should not be called')),
        delete: (resource) => {
          deleteLog.push(resource.logicalId);
          return Promise.resolve();
        },
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const stateManager = new EngineStateManager(
        bus,
        persistence,
        currentState,
      );

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      // Assembly still has both ResA and ResB.
      const stacks = [
        makeStack('S', [{ logicalId: 'ResA' }, { logicalId: 'ResB' }]),
      ];
      const plan = makePlan(['S'], { S: ['ResA', 'ResB'] });
      const result = await engine.deploy(stacks, plan);

      // Deployment should fail (rollback resumed).
      expect(result.success).toBe(false);

      // ResB (newly created during interrupted run) should have been deleted.
      expect(deleteLog).toContain('ResB');

      // Snapshot should be deleted after rollback.
      expect(deletedSnapshots.some((p) => p.endsWith('snapshot.json'))).toBe(
        true,
      );

      // Stack should reach a rollback terminal status.
      const rollbackCompleteEvent = events.find(
        (e) =>
          e.resourceType === 'cdkx::stack' &&
          (e.resourceStatus === StackStatus.UPDATE_ROLLBACK_COMPLETE ||
            e.resourceStatus === StackStatus.ROLLBACK_COMPLETE ||
            e.resourceStatus === StackStatus.ROLLBACK_PARTIAL),
      );
      expect(rollbackCompleteEvent).toBeDefined();
    });

    it('deletes snapshot after rollback completes', async () => {
      const snapshotState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: {},
                lastAppliedProperties: {},
              },
            },
          },
        },
      };

      const deletedSnapshots: string[] = [];
      const persistence = makeSnapshotPersistence({
        snapshotState,
        deletedSnapshots,
      });

      const fullAdapter: ProviderAdapter = {
        create: () => Promise.reject(new Error('not called')),
        update: () => Promise.reject(new Error('not called')),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const bus = new EventBus<EngineEvent>();
      // No current state — snapshot-only scenario (first deploy interrupted before any mutations).
      const stateManager = new EngineStateManager(bus, persistence);

      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      const stacks = [makeStack('S', [{ logicalId: 'ResA' }])];
      const plan = makePlan(['S'], { S: ['ResA'] });
      await engine.deploy(stacks, plan);

      expect(deletedSnapshots.some((p) => p.endsWith('snapshot.json'))).toBe(
        true,
      );
    });

    it('does not resume rollback when no snapshot exists (normal deploy)', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      // Normal null persistence — snapshotExists returns false.
      const engine = makeEngine(successAdapter('phys-001'), bus);

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);

      // Normal deploy succeeds.
      expect(result.success).toBe(true);

      // Stack should reach CREATE_COMPLETE, not a rollback status.
      const completeEvent = events.find(
        (e) =>
          e.resourceType === 'cdkx::stack' &&
          e.resourceStatus === StackStatus.CREATE_COMPLETE,
      );
      expect(completeEvent).toBeDefined();
    });

    it('skips recreation and transitions to ROLLBACK_PARTIAL when surviving resource holds a { ref } token', async () => {
      const events: EngineEvent[] = [];
      const bus = new EventBus<EngineEvent>();
      bus.subscribe((e) => events.push(e));

      // Snapshot: ResA was healthy before the interrupted deployment.
      const snapshotState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.CREATE_COMPLETE,
            resources: {
              ResA: {
                status: ResourceStatus.CREATE_COMPLETE,
                type: 'test::Resource',
                physicalId: 'phys-A',
                properties: { name: 'a' },
                lastAppliedProperties: { name: 'a' },
              },
            },
          },
        },
      };

      // Current state: ResA was deleted during reconcile (absent).
      // No resources were newly created during the interrupted deployment.
      const currentState: EngineState = {
        stacks: {
          S: {
            status: StackStatus.UPDATE_IN_PROGRESS,
            resources: {},
          },
        },
      };

      const persistence = makeSnapshotPersistence({
        snapshotState,
        currentState,
      });

      const createCalls: string[] = [];
      const fullAdapter: ProviderAdapter = {
        create: (resource) => {
          createCalls.push(resource.logicalId);
          return Promise.resolve({ physicalId: `phys-${resource.logicalId}` });
        },
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve(),
        getOutput: () => Promise.resolve(undefined),
        getCreateOnlyProps: () => new Set<string>(),
      };

      const stateManager = new EngineStateManager(
        bus,
        persistence,
        currentState,
      );
      const engine = new DeploymentEngine({
        adapters: { test: fullAdapter },
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });

      // Assembly has ResB with a { ref } token pointing to ResA.
      // Phase 3 detects this surviving dependency and skips ResA's recreation.
      const stacks = [
        makeStack('S', [
          {
            logicalId: 'ResB',
            properties: { serverId: { ref: 'ResA', attr: 'id' } },
          },
        ]),
      ];
      const plan = makePlan(['S'], { S: ['ResB'] });
      await engine.deploy(stacks, plan);

      // ResA must NOT have been recreated — it was skipped.
      expect(createCalls).not.toContain('ResA');

      // Stack transitions to ROLLBACK_PARTIAL because the skip is unresolvable.
      const partialEvent = events.find(
        (e) =>
          e.resourceType === 'cdkx::stack' &&
          e.resourceStatus === StackStatus.ROLLBACK_PARTIAL,
      );
      expect(partialEvent).toBeDefined();
    });
  });

  // ─── Cross-stack output resolution ───────────────────────────────────────────

  describe('cross-stack output resolution', () => {
    function makeEngineExposed(
      adaptersByProvider: Record<string, Partial<ProviderAdapter>>,
      eventBus?: EventBus<EngineEvent>,
    ): { engine: DeploymentEngine; stateManager: EngineStateManager } {
      const bus = eventBus ?? new EventBus<EngineEvent>();
      const persistence = makeNullPersistence();
      const stateManager = new EngineStateManager(bus, persistence);

      const fullAdapters: Record<string, ProviderAdapter> = {};
      for (const [provider, partial] of Object.entries(adaptersByProvider)) {
        fullAdapters[provider] = {
          create:
            partial.create ??
            (() => Promise.reject(new Error('not implemented'))),
          update:
            partial.update ??
            (() => Promise.reject(new Error('not implemented'))),
          delete: partial.delete ?? (() => Promise.resolve()),
          getOutput: partial.getOutput ?? (() => Promise.resolve(undefined)),
          getCreateOnlyProps:
            partial.getCreateOnlyProps ?? (() => new Set<string>()),
        };
      }

      const engine = new DeploymentEngine({
        adapters: fullAdapters,
        assemblyDir: '/fake/assembly',
        stateDir: '/fake/state',
        stateManager,
        persistence,
        eventBus: bus,
        deployLock: makeMockDeployLock(),
      });
      return { engine, stateManager };
    }

    it('stores resolved stack outputs in StackState after stack completes', async () => {
      // NetworkStack has one resource whose create returns networkId.
      // The stack declares an output NetworkId referencing that attribute.
      const { engine, stateManager } = makeEngineExposed({
        test: {
          create: () =>
            Promise.resolve({
              physicalId: 'phys-1',
              outputs: { id: 'net-99' },
            }),
        },
      });

      const networkStack: AssemblyStack = {
        id: 'NetworkStack',
        templateFile: 'NetworkStack.json',
        resources: [
          {
            logicalId: 'NetABC12345',
            type: 'test::Resource',
            provider: 'test',
            properties: {},
          },
        ],
        outputs: {
          NetworkId: { value: { ref: 'NetABC12345', attr: 'id' } },
        },
        outputKeys: ['NetworkId'],
        dependencies: [],
      };

      const plan: DeploymentPlan = {
        stackWaves: [['NetworkStack']],
        resourceWaves: { NetworkStack: [['NetABC12345']] },
      };

      await engine.deploy([networkStack], plan);

      const stackState = stateManager.getStackState('NetworkStack');
      expect(stackState?.outputs).toEqual({ NetworkId: 'net-99' });
    });

    it('substitutes cross-stack token in server properties with stack output value', async () => {
      // NetworkStack deploys first; ServerStack resource property references it.
      const createCalls: Array<{
        logicalId: string;
        properties: Record<string, unknown>;
      }> = [];

      const { engine } = makeEngineExposed({
        test: {
          create: (resource: ManifestResource) => {
            createCalls.push({
              logicalId: resource.logicalId,
              properties: resource.properties,
            });
            const outputs =
              resource.logicalId === 'NetABC12345'
                ? { id: 'net-99' }
                : undefined;
            return Promise.resolve({
              physicalId: `phys-${resource.logicalId}`,
              ...(outputs ? { outputs } : {}),
            });
          },
        },
      });

      const networkStack: AssemblyStack = {
        id: 'NetworkStack',
        templateFile: 'NetworkStack.json',
        resources: [
          {
            logicalId: 'NetABC12345',
            type: 'test::Resource',
            provider: 'test',
            properties: {},
          },
        ],
        outputs: {
          NetworkId: { value: { ref: 'NetABC12345', attr: 'id' } },
        },
        outputKeys: ['NetworkId'],
        dependencies: [],
      };

      const serverStack: AssemblyStack = {
        id: 'ServerStack',
        templateFile: 'ServerStack.json',
        resources: [
          {
            logicalId: 'SrvXYZ12345',
            type: 'test::Resource',
            provider: 'test',
            properties: {
              networkId: { stackRef: 'NetworkStack', outputKey: 'NetworkId' },
            },
          },
        ],
        outputs: {},
        outputKeys: [],
        dependencies: ['NetworkStack'],
      };

      const plan: DeploymentPlan = {
        stackWaves: [['NetworkStack'], ['ServerStack']],
        resourceWaves: {
          NetworkStack: [['NetABC12345']],
          ServerStack: [['SrvXYZ12345']],
        },
      };

      await engine.deploy([networkStack, serverStack], plan);

      const serverCall = createCalls.find((c) => c.logicalId === 'SrvXYZ12345');
      expect(serverCall).toBeDefined();
      expect(serverCall?.properties['networkId']).toBe('net-99');
    });
  });
});
