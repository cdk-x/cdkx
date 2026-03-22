import { DeployTimeResolver } from './deploy-time-resolver';
import type { EngineState } from '../state/engine-state';
import { StackStatus } from '../states/stack-status';
import { ResourceStatus } from '../states/resource-status';

// ─── State builder helpers ────────────────────────────────────────────────────

function makeState(
  overrides: Record<string, EngineState['stacks'][string]> = {},
): EngineState {
  return { stacks: overrides };
}

function makeStackState(
  resources: EngineState['stacks'][string]['resources'] = {},
  outputs: Record<string, unknown> = {},
): EngineState['stacks'][string] {
  return {
    status: StackStatus.CREATE_COMPLETE,
    resources,
    outputs,
  };
}

function makeResourceState(
  resourceOutputs: Record<string, unknown> = {},
): EngineState['stacks'][string]['resources'][string] {
  return {
    status: ResourceStatus.CREATE_COMPLETE,
    properties: {},
    outputs: resourceOutputs,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeployTimeResolver', () => {
  const STACK_ID = 'MyStack';

  describe('plain value pass-through', () => {
    let resolver: DeployTimeResolver;

    beforeEach(() => {
      resolver = new DeployTimeResolver(makeState(), STACK_ID);
    });

    it('returns a string unchanged', () => {
      expect(resolver.resolve('hello')).toBe('hello');
    });

    it('returns a number unchanged', () => {
      expect(resolver.resolve(42)).toBe(42);
    });

    it('returns null unchanged', () => {
      expect(resolver.resolve(null)).toBeNull();
    });

    it('returns undefined unchanged', () => {
      expect(resolver.resolve(undefined)).toBeUndefined();
    });

    it('returns a plain object (no token shape) unchanged', () => {
      const obj = { name: 'web', size: 'cx21' };
      expect(resolver.resolve(obj)).toEqual(obj);
    });

    it('returns an array of plain values unchanged', () => {
      const arr = [1, 'two', true];
      expect(resolver.resolve(arr)).toEqual(arr);
    });
  });

  describe('{ ref, attr } intra-stack token resolution', () => {
    it('substitutes token with resource output from current stack', () => {
      const state = makeState({
        [STACK_ID]: makeStackState({
          ResABC12345: makeResourceState({ networkId: 'net-42' }),
        }),
      });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      expect(resolver.resolve({ ref: 'ResABC12345', attr: 'networkId' })).toBe(
        'net-42',
      );
    });

    it('resolves token inside a nested object', () => {
      const state = makeState({
        [STACK_ID]: makeStackState({
          ResABC12345: makeResourceState({ ip: '1.2.3.4' }),
        }),
      });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      const result = resolver.resolve({
        server: { ip: { ref: 'ResABC12345', attr: 'ip' } },
      });
      expect(result).toEqual({ server: { ip: '1.2.3.4' } });
    });

    it('resolves token inside an array', () => {
      const state = makeState({
        [STACK_ID]: makeStackState({
          ResABC12345: makeResourceState({ id: 99 }),
        }),
      });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      const result = resolver.resolve([{ ref: 'ResABC12345', attr: 'id' }]);
      expect(result).toEqual([99]);
    });

    it('throws when resource is not found in state', () => {
      const state = makeState({ [STACK_ID]: makeStackState() });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      expect(() => resolver.resolve({ ref: 'MissingRes', attr: 'id' })).toThrow(
        /resource 'MissingRes' not found/i,
      );
    });

    it('throws when resource exists but attr is missing', () => {
      const state = makeState({
        [STACK_ID]: makeStackState({
          ResABC12345: makeResourceState({ name: 'web' }),
        }),
      });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      expect(() =>
        resolver.resolve({ ref: 'ResABC12345', attr: 'missingAttr' }),
      ).toThrow(/attribute 'missingAttr'.*not found/i);
    });

    it('throws when the referenced resource is in FAILED state', () => {
      const state = makeState({
        [STACK_ID]: makeStackState({
          ResABC12345: {
            status: ResourceStatus.CREATE_FAILED,
            properties: {},
            outputs: { id: 'partial' },
          },
        }),
      });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      expect(() =>
        resolver.resolve({ ref: 'ResABC12345', attr: 'id' }),
      ).toThrow(/ResABC12345/);
    });
  });

  describe('{ stackRef, outputKey } cross-stack token resolution', () => {
    it('substitutes cross-stack token with stack output value', () => {
      const state = makeState({
        NetworkStack: makeStackState({}, { NetworkId: 'net-99' }),
      });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      expect(
        resolver.resolve({ stackRef: 'NetworkStack', outputKey: 'NetworkId' }),
      ).toBe('net-99');
    });

    it('resolves cross-stack token inside a nested property', () => {
      const state = makeState({
        NetworkStack: makeStackState({}, { NetworkId: 'net-99' }),
      });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      const result = resolver.resolve({
        server: {
          networkId: { stackRef: 'NetworkStack', outputKey: 'NetworkId' },
        },
      });
      expect(result).toEqual({ server: { networkId: 'net-99' } });
    });

    it('throws when referenced stack is not found in state', () => {
      const state = makeState();
      const resolver = new DeployTimeResolver(state, STACK_ID);
      expect(() =>
        resolver.resolve({ stackRef: 'MissingStack', outputKey: 'NetworkId' }),
      ).toThrow(/stack 'MissingStack' not found/i);
    });

    it('throws when stack exists but outputKey is absent', () => {
      const state = makeState({
        NetworkStack: makeStackState({}, { NetworkId: 'net-99' }),
      });
      const resolver = new DeployTimeResolver(state, STACK_ID);
      expect(() =>
        resolver.resolve({
          stackRef: 'NetworkStack',
          outputKey: 'MissingKey',
        }),
      ).toThrow(/output key 'MissingKey'.*not found/i);
    });
  });
});
