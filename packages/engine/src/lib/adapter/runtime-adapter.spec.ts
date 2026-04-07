import {
  ProviderRuntime,
  ResourceHandler,
  RuntimeContext,
  RuntimeLogger,
} from '@cdk-x/core';
import type { Logger } from '@cdk-x/logger';
import {
  RuntimeAdapter,
  RuntimeResourceConfig,
  RuntimeAdapterOptions,
} from './runtime-adapter';
import type { ManifestResource } from './provider-adapter';

// ─── Test doubles ─────────────────────────────────────────────────────────────

interface TestProps {
  name: string;
  ipRange: string;
}

interface TestState {
  networkId: number;
  name: string;
  ipRange: string;
}

interface TestSdk {
  fake: true;
}

class StubHandler extends ResourceHandler<TestProps, TestState, TestSdk> {
  createResult: TestState = {
    networkId: 42,
    name: 'net',
    ipRange: '10.0.0.0/8',
  };
  updateResult: TestState = {
    networkId: 42,
    name: 'updated',
    ipRange: '10.0.0.0/8',
  };
  getResult: TestState = { networkId: 42, name: 'net', ipRange: '10.0.0.0/8' };

  createCalls: Array<{ props: TestProps }> = [];
  updateCalls: Array<{ props: TestProps; state: TestState }> = [];
  deleteCalls: Array<{ state: TestState }> = [];
  getCalls: Array<{ props: TestProps }> = [];

  async create(
    _ctx: RuntimeContext<TestSdk>,
    props: TestProps,
  ): Promise<TestState> {
    this.createCalls.push({ props });
    return this.createResult;
  }

  async update(
    _ctx: RuntimeContext<TestSdk>,
    props: TestProps,
    state: TestState,
  ): Promise<TestState> {
    this.updateCalls.push({ props, state });
    return this.updateResult;
  }

  async delete(_ctx: RuntimeContext<TestSdk>, state: TestState): Promise<void> {
    this.deleteCalls.push({ state });
  }

  async get(
    _ctx: RuntimeContext<TestSdk>,
    props: TestProps,
  ): Promise<TestState> {
    this.getCalls.push({ props });
    return this.getResult;
  }
}

class StubRuntime extends ProviderRuntime<TestSdk> {
  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}

class StubContext extends RuntimeContext<TestSdk> {
  readonly sdk: TestSdk = { fake: true };
  logger: RuntimeLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NETWORK_TYPE = 'Test::Networking::Network';

function makeResource(
  overrides: Partial<ManifestResource> = {},
): ManifestResource {
  return {
    logicalId: 'NetworkA1B2C3D4',
    type: NETWORK_TYPE,
    properties: { name: 'my-net', ipRange: '10.0.0.0/8' },
    stackId: 'TestStack',
    provider: 'test',
    ...overrides,
  };
}

function buildAdapter(
  handler: StubHandler,
  configOverrides: Partial<RuntimeResourceConfig> = {},
): {
  adapter: RuntimeAdapter<TestSdk>;
  context: StubContext;
  runtime: StubRuntime;
} {
  const runtime = new StubRuntime();
  runtime.register(NETWORK_TYPE, handler);

  const context = new StubContext();

  const resourceConfigs: Record<string, RuntimeResourceConfig> = {
    [NETWORK_TYPE]: {
      physicalIdKey: 'networkId',
      ...configOverrides,
    },
  };

  const options: RuntimeAdapterOptions<TestSdk> = {
    runtime,
    context,
    resourceConfigs,
  };

  return { adapter: new RuntimeAdapter(options), context, runtime };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RuntimeAdapter', () => {
  let handler: StubHandler;

  beforeEach(() => {
    handler = new StubHandler();
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('delegates to handler.create with resource properties', async () => {
      const { adapter } = buildAdapter(handler);
      const resource = makeResource();

      await adapter.create(resource);

      expect(handler.createCalls).toHaveLength(1);
      expect(handler.createCalls[0].props).toEqual(resource.properties);
    });

    it('returns physicalId extracted via physicalIdKey', async () => {
      handler.createResult = {
        networkId: 99,
        name: 'n',
        ipRange: '10.0.0.0/8',
      };
      const { adapter } = buildAdapter(handler);

      const result = await adapter.create(makeResource());

      expect(result.physicalId).toBe('99');
    });

    it('returns the full handler state as outputs', async () => {
      handler.createResult = {
        networkId: 42,
        name: 'net',
        ipRange: '10.0.0.0/8',
      };
      const { adapter } = buildAdapter(handler);

      const result = await adapter.create(makeResource());

      expect(result.outputs).toEqual({
        networkId: 42,
        name: 'net',
        ipRange: '10.0.0.0/8',
      });
    });

    it('throws when no resource config is registered for the type', async () => {
      // Build a runtime that has a handler for Unknown::Type but NO config
      const runtime = new StubRuntime();
      runtime.register(NETWORK_TYPE, handler);
      runtime.register('Unknown::Type', handler);

      const context = new StubContext();
      const adapter = new RuntimeAdapter({
        runtime,
        context,
        resourceConfigs: {
          [NETWORK_TYPE]: { physicalIdKey: 'networkId' },
        },
      });

      const resource = makeResource({ type: 'Unknown::Type' });
      await expect(adapter.create(resource)).rejects.toThrow(
        /no resource config registered for type 'Unknown::Type'/,
      );
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('calls handler.get to reconstruct current state', async () => {
      const { adapter } = buildAdapter(handler);
      const resource = makeResource({ physicalId: '42' });

      await adapter.update(resource);

      expect(handler.getCalls).toHaveLength(1);
      expect(handler.getCalls[0].props).toEqual(resource.properties);
    });

    it('passes reconstructed state to handler.update', async () => {
      handler.getResult = { networkId: 42, name: 'old', ipRange: '10.0.0.0/8' };
      const { adapter } = buildAdapter(handler);
      const resource = makeResource({ physicalId: '42' });

      await adapter.update(resource);

      expect(handler.updateCalls).toHaveLength(1);
      expect(handler.updateCalls[0].state).toEqual(handler.getResult);
      expect(handler.updateCalls[0].props).toEqual(resource.properties);
    });

    it('returns the new handler state as outputs', async () => {
      handler.updateResult = {
        networkId: 42,
        name: 'updated',
        ipRange: '10.0.0.0/8',
      };
      const { adapter } = buildAdapter(handler);

      const result = await adapter.update(makeResource({ physicalId: '42' }));

      expect(result.outputs).toEqual({
        networkId: 42,
        name: 'updated',
        ipRange: '10.0.0.0/8',
      });
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('calls handler.get to reconstruct state before deletion', async () => {
      const { adapter } = buildAdapter(handler);
      const resource = makeResource({ physicalId: '42' });

      await adapter.delete(resource);

      expect(handler.getCalls).toHaveLength(1);
      expect(handler.getCalls[0].props).toEqual(resource.properties);
    });

    it('delegates to handler.delete with reconstructed state', async () => {
      handler.getResult = { networkId: 42, name: 'net', ipRange: '10.0.0.0/8' };
      const { adapter } = buildAdapter(handler);

      await adapter.delete(makeResource({ physicalId: '42' }));

      expect(handler.deleteCalls).toHaveLength(1);
      expect(handler.deleteCalls[0].state).toEqual(handler.getResult);
    });
  });

  // ── validate ──────────────────────────────────────────────────────────────

  describe('validate', () => {
    it('resolves when the handler is registered', async () => {
      const { adapter } = buildAdapter(handler);

      await expect(adapter.validate(makeResource())).resolves.toBeUndefined();
    });

    it('throws when the handler is not registered', async () => {
      const { adapter } = buildAdapter(handler);
      const resource = makeResource({ type: 'Unknown::Type' });

      await expect(adapter.validate(resource)).rejects.toThrow(
        /No handler registered for resource type 'Unknown::Type'/,
      );
    });
  });

  // ── getOutput ─────────────────────────────────────────────────────────────

  describe('getOutput', () => {
    it('calls handler.get and returns the requested attribute', async () => {
      handler.getResult = { networkId: 42, name: 'net', ipRange: '10.0.0.0/8' };
      const { adapter } = buildAdapter(handler);
      const resource = makeResource({ physicalId: '42' });

      const value = await adapter.getOutput(resource, 'networkId');

      expect(value).toBe(42);
      expect(handler.getCalls).toHaveLength(1);
    });

    it('returns undefined for an attribute that does not exist on state', async () => {
      const { adapter } = buildAdapter(handler);
      const resource = makeResource({ physicalId: '42' });

      const value = await adapter.getOutput(resource, 'nonExistent');

      expect(value).toBeUndefined();
    });
  });

  // ── getCreateOnlyProps ────────────────────────────────────────────────────

  describe('getCreateOnlyProps', () => {
    it('returns the configured createOnlyProps for a known type', () => {
      const createOnly = new Set(['ipRange']);
      const { adapter } = buildAdapter(handler, {
        createOnlyProps: createOnly,
      });

      const result = adapter.getCreateOnlyProps(NETWORK_TYPE);

      expect(result).toBe(createOnly);
    });

    it('returns an empty set when createOnlyProps is not configured', () => {
      const { adapter } = buildAdapter(handler);

      const result = adapter.getCreateOnlyProps(NETWORK_TYPE);

      expect(result).toEqual(new Set());
    });

    it('returns an empty set for an unknown type', () => {
      const { adapter } = buildAdapter(handler);

      const result = adapter.getCreateOnlyProps('Unknown::Type');

      expect(result).toEqual(new Set());
    });
  });

  // ── setLogger ─────────────────────────────────────────────────────────────

  describe('setLogger', () => {
    it('propagates the engine logger to the runtime context', () => {
      const { adapter, context } = buildAdapter(handler);

      const engineLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: jest.fn().mockReturnThis(),
      } as unknown as Logger;

      adapter.setLogger(engineLogger);

      // The context logger should now be the engine logger
      expect(context.logger).toBe(engineLogger);
    });
  });
});
