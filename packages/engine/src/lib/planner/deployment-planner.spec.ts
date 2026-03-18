import { DeploymentPlanner, CycleError } from './deployment-planner';
import type { AssemblyStack } from '../assembly/assembly-types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStack(
  id: string,
  resources: {
    logicalId: string;
    type?: string;
    properties?: Record<string, unknown>;
    dependsOn?: string[];
  }[],
  dependencies: string[] = [],
): AssemblyStack {
  return {
    id,
    templateFile: `${id}.json`,
    resources: resources.map((r) => {
      const type = r.type ?? 'test::Resource';
      // Extract provider from typeName (format: "Provider::Domain::Resource")
      const provider = type.split('::')[0].toLowerCase();
      return {
        logicalId: r.logicalId,
        type,
        provider,
        properties: r.properties ?? {},
        ...(r.dependsOn !== undefined ? { dependsOn: r.dependsOn } : {}),
      };
    }),
    outputs: {},
    outputKeys: [],
    dependencies,
  };
}

/**
 * Flatten waves into a single array for order assertions.
 * Maintains relative order from the waves structure.
 */
function flattenWaves<T>(waves: T[][]): T[] {
  return waves.flat();
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeploymentPlanner', () => {
  let planner: DeploymentPlanner;

  beforeEach(() => {
    planner = new DeploymentPlanner();
  });

  // ─── Stack ordering ─────────────────────────────────────────────────────────

  describe('stack ordering', () => {
    it('returns a single stack unchanged', () => {
      const plan = planner.plan([makeStack('StackA', [])]);
      expect(flattenWaves(plan.stackWaves)).toEqual(['StackA']);
    });

    it('returns two independent stacks in stable order', () => {
      const plan = planner.plan([
        makeStack('StackB', []),
        makeStack('StackA', []),
      ]);
      // Both have no dependencies; should be sorted alphabetically for stability.
      expect(flattenWaves(plan.stackWaves)).toEqual(['StackA', 'StackB']);
    });

    it('puts dependency before dependent (A → B means A first)', () => {
      const plan = planner.plan([
        makeStack('StackB', [], ['StackA']),
        makeStack('StackA', []),
      ]);
      const order = flattenWaves(plan.stackWaves);
      expect(order.indexOf('StackA')).toBeLessThan(order.indexOf('StackB'));
    });

    it('handles a chain of three stacks', () => {
      const plan = planner.plan([
        makeStack('StackC', [], ['StackB']),
        makeStack('StackA', []),
        makeStack('StackB', [], ['StackA']),
      ]);
      const order = flattenWaves(plan.stackWaves);
      expect(order.indexOf('StackA')).toBeLessThan(order.indexOf('StackB'));
      expect(order.indexOf('StackB')).toBeLessThan(order.indexOf('StackC'));
    });

    it('detects a direct cycle between two stacks', () => {
      expect(() =>
        planner.plan([
          makeStack('StackA', [], ['StackB']),
          makeStack('StackB', [], ['StackA']),
        ]),
      ).toThrow(CycleError);
    });

    it('detects a three-node cycle among stacks', () => {
      expect(() =>
        planner.plan([
          makeStack('StackA', [], ['StackC']),
          makeStack('StackB', [], ['StackA']),
          makeStack('StackC', [], ['StackB']),
        ]),
      ).toThrow(CycleError);
    });

    it('includes cycle node IDs in CycleError', () => {
      let error: CycleError | undefined;
      try {
        planner.plan([
          makeStack('StackA', [], ['StackB']),
          makeStack('StackB', [], ['StackA']),
        ]);
      } catch (e) {
        error = e as CycleError;
      }
      expect(error).toBeInstanceOf(CycleError);
      if (!(error instanceof CycleError)) return;
      expect(error.cycleNodes).toContain('StackA');
      expect(error.cycleNodes).toContain('StackB');
    });
  });

  // ─── Resource ordering ──────────────────────────────────────────────────────

  describe('resource ordering', () => {
    it('returns a single resource unchanged', () => {
      const plan = planner.plan([makeStack('S', [{ logicalId: 'ResA' }])]);
      expect(flattenWaves(plan.resourceWaves['S'])).toEqual(['ResA']);
    });

    it('returns two independent resources in stable order', () => {
      const plan = planner.plan([
        makeStack('S', [{ logicalId: 'ResB' }, { logicalId: 'ResA' }]),
      ]);
      expect(flattenWaves(plan.resourceWaves['S'])).toEqual(['ResA', 'ResB']);
    });

    it('places dependency before dependent resource', () => {
      const plan = planner.plan([
        makeStack('S', [
          { logicalId: 'ResA' },
          {
            logicalId: 'ResB',
            properties: { networkId: { ref: 'ResA', attr: 'networkId' } },
          },
        ]),
      ]);
      const order = flattenWaves(plan.resourceWaves['S']);
      expect(order.indexOf('ResA')).toBeLessThan(order.indexOf('ResB'));
    });

    it('handles a three-resource chain', () => {
      const plan = planner.plan([
        makeStack('S', [
          { logicalId: 'ResA' },
          {
            logicalId: 'ResB',
            properties: { netId: { ref: 'ResA', attr: 'networkId' } },
          },
          {
            logicalId: 'ResC',
            properties: { srvId: { ref: 'ResB', attr: 'serverId' } },
          },
        ]),
      ]);
      const order = flattenWaves(plan.resourceWaves['S']);
      expect(order.indexOf('ResA')).toBeLessThan(order.indexOf('ResB'));
      expect(order.indexOf('ResB')).toBeLessThan(order.indexOf('ResC'));
    });

    it('handles { ref, attr } tokens nested inside arrays', () => {
      const plan = planner.plan([
        makeStack('S', [
          { logicalId: 'ResA' },
          {
            logicalId: 'ResB',
            properties: {
              networks: [{ ref: 'ResA', attr: 'networkId' }],
            },
          },
        ]),
      ]);
      const order = flattenWaves(plan.resourceWaves['S']);
      expect(order.indexOf('ResA')).toBeLessThan(order.indexOf('ResB'));
    });

    it('handles { ref, attr } tokens nested inside nested objects', () => {
      const plan = planner.plan([
        makeStack('S', [
          { logicalId: 'ResA' },
          {
            logicalId: 'ResB',
            properties: {
              config: { inner: { ref: 'ResA', attr: 'id' } },
            },
          },
        ]),
      ]);
      const order = flattenWaves(plan.resourceWaves['S']);
      expect(order.indexOf('ResA')).toBeLessThan(order.indexOf('ResB'));
    });

    it('ignores { ref } tokens pointing to resources in other stacks', () => {
      // ResB references 'OtherStackResXYZ' which is NOT in this stack.
      // No intra-stack dependency should be created.
      const plan = planner.plan([
        makeStack('S', [
          { logicalId: 'ResA' },
          {
            logicalId: 'ResB',
            properties: {
              externalId: { ref: 'OtherStackResXYZ', attr: 'serverId' },
            },
          },
        ]),
      ]);
      // Both resources are independent; stable sort should give ResA first.
      expect(flattenWaves(plan.resourceWaves['S'])).toEqual(['ResA', 'ResB']);
    });

    it('detects a direct cycle between two resources', () => {
      expect(() =>
        planner.plan([
          makeStack('S', [
            {
              logicalId: 'ResA',
              properties: { dep: { ref: 'ResB', attr: 'id' } },
            },
            {
              logicalId: 'ResB',
              properties: { dep: { ref: 'ResA', attr: 'id' } },
            },
          ]),
        ]),
      ).toThrow(CycleError);
    });

    it('respects explicit dependsOn without { ref, attr } token', () => {
      // ResB has no tokens in properties but declares dependsOn: ['ResA'].
      const plan = planner.plan([
        makeStack('S', [
          { logicalId: 'ResA' },
          { logicalId: 'ResB', dependsOn: ['ResA'] },
        ]),
      ]);
      const order = flattenWaves(plan.resourceWaves['S']);
      expect(order.indexOf('ResA')).toBeLessThan(order.indexOf('ResB'));
    });

    it('deduplicates when both dependsOn and token reference the same resource', () => {
      // ResB references ResA via both a token and dependsOn — should not crash
      // and should still place ResA before ResB.
      const plan = planner.plan([
        makeStack('S', [
          { logicalId: 'ResA' },
          {
            logicalId: 'ResB',
            properties: { networkId: { ref: 'ResA', attr: 'networkId' } },
            dependsOn: ['ResA'],
          },
        ]),
      ]);
      const order = flattenWaves(plan.resourceWaves['S']);
      expect(order.indexOf('ResA')).toBeLessThan(order.indexOf('ResB'));
    });

    it('produces separate resource orders per stack', () => {
      const plan = planner.plan([
        makeStack('StackA', [{ logicalId: 'ResA1' }, { logicalId: 'ResA2' }]),
        makeStack('StackB', [{ logicalId: 'ResB1' }]),
      ]);
      expect(flattenWaves(plan.resourceWaves['StackA'])).toHaveLength(2);
      expect(flattenWaves(plan.resourceWaves['StackB'])).toHaveLength(1);
    });
  });

  // ─── Empty inputs ────────────────────────────────────────────────────────────

  describe('empty inputs', () => {
    it('handles empty stacks array', () => {
      const plan = planner.plan([]);
      expect(flattenWaves(plan.stackWaves)).toEqual([]);
      expect(plan.resourceWaves).toEqual({});
    });

    it('handles a stack with no resources', () => {
      const plan = planner.plan([makeStack('S', [])]);
      expect(flattenWaves(plan.resourceWaves['S'])).toEqual([]);
    });
  });
});
