import { DeploymentEngine } from './deployment-engine';
import { DeploymentPlanner } from '../planner/deployment-planner';
import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';
import { EventBus } from '../events/event-bus';
import { EngineEvent } from '../events/engine-event';
import { EngineStateManager } from '../state/engine-state-manager';
import { StatePersistence } from '../state/state-persistence';
import type {
  ProviderAdapter,
  ManifestResource,
  CreateResult,
} from '../adapter/provider-adapter';
import type { AssemblyStack } from '../assembly/assembly-types';
import type { DeploymentPlan } from '../planner/deployment-plan';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStack(
  id: string,
  resources: {
    logicalId: string;
    type?: string;
    properties?: Record<string, unknown>;
  }[],
  dependencies: string[] = [],
): AssemblyStack {
  return {
    id,
    provider: 'test',
    environment: {},
    templateFile: `${id}.json`,
    resources: resources.map((r) => ({
      logicalId: r.logicalId,
      type: r.type ?? 'test::Resource',
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
  return { stackOrder, resourceOrders };
}

function makeNullPersistence(): StatePersistence {
  return new StatePersistence('/fake', {
    mkdirSync: () => undefined,
    writeFileSync: () => undefined,
    readFileSync: () => {
      throw new Error('not found');
    },
    existsSync: () => false,
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
  };

  return new DeploymentEngine({
    adapters: { test: fullAdapter },
    outdir: '/fake',
    stateManager,
    eventBus: bus,
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

    it('leaves unresolvable tokens as-is (cross-stack not yet deployed)', async () => {
      const receivedProps: Record<string, unknown>[] = [];
      const adapter: Partial<ProviderAdapter> = {
        create: (r: ManifestResource): Promise<CreateResult> => {
          receivedProps.push(r.properties);
          return Promise.resolve({ physicalId: `phys-${r.logicalId}` });
        },
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
      await engine.deploy(stacks, plan);

      expect(receivedProps[0]).toEqual({ externalRef: token });
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
    it('returns failure when no adapter is registered for the stack provider', async () => {
      const engine = new DeploymentEngine({
        adapters: {}, // no adapters registered
        outdir: '/fake',
        stateManager: new EngineStateManager(
          new EventBus<EngineEvent>(),
          makeNullPersistence(),
        ),
      });

      const stacks = [makeStack('S', [{ logicalId: 'Res1' }])];
      const plan = makePlan(['S'], { S: ['Res1'] });
      const result = await engine.deploy(stacks, plan);

      expect(result.success).toBe(false);
      expect(result.stacks[0].error).toContain(
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
});
