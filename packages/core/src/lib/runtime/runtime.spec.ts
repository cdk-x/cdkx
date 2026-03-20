import { RuntimeLogger } from './runtime-logger';
import { RuntimeContext } from './runtime-context';
import { ProviderRuntime } from './provider-runtime';
import { ResourceHandler } from './resource-handler';
import {
  StabilizeConfig,
  StabilizeStatus,
  StabilizationTimeoutError,
} from './stabilize';

// ── Test doubles ────────────────────────────────────────────────

interface StubSdk {
  echo(v: string): string;
}

const stubSdk: StubSdk = { echo: (v: string) => v };

class NoopLogger implements RuntimeLogger {
  debug(): void {
    /* noop */
  }
  info(): void {
    /* noop */
  }
  warn(): void {
    /* noop */
  }
  error(): void {
    /* noop */
  }
  child(): RuntimeLogger {
    return this;
  }
}

class TestContext extends RuntimeContext<StubSdk> {
  readonly sdk: StubSdk;
  readonly logger: RuntimeLogger;

  constructor(sdk: StubSdk, logger: RuntimeLogger) {
    super();
    this.sdk = sdk;
    this.logger = logger;
  }
}

interface WidgetProps {
  name: string;
}
interface WidgetState {
  id: string;
  name: string;
}

class WidgetHandler extends ResourceHandler<WidgetProps, WidgetState, StubSdk> {
  async create(
    ctx: RuntimeContext<StubSdk>,
    props: WidgetProps,
  ): Promise<WidgetState> {
    return { id: ctx.sdk.echo('w-1'), name: props.name };
  }

  async update(
    _ctx: RuntimeContext<StubSdk>,
    props: WidgetProps,
    state: WidgetState,
  ): Promise<WidgetState> {
    return { ...state, name: props.name };
  }

  async delete(): Promise<void> {
    /* noop */
  }

  async get(
    _ctx: RuntimeContext<StubSdk>,
    props: WidgetProps,
  ): Promise<WidgetState> {
    return { id: 'w-1', name: props.name };
  }
}

class TestRuntime extends ProviderRuntime<StubSdk> {
  constructor() {
    super();
    this.register('test::Widget', new WidgetHandler());
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe('RuntimeContext', () => {
  it('exposes sdk and logger', () => {
    const logger = new NoopLogger();
    const ctx = new TestContext(stubSdk, logger);

    expect(ctx.sdk).toBe(stubSdk);
    expect(ctx.logger).toBe(logger);
  });

  it('has default stabilizeConfig with engine defaults', () => {
    const ctx = new TestContext(stubSdk, new NoopLogger());
    expect(ctx.stabilizeConfig).toEqual({
      intervalMs: 5000,
      timeoutMs: 600_000,
    });
  });

  it('allows stabilizeConfig to be overwritten', () => {
    const ctx = new TestContext(stubSdk, new NoopLogger());
    ctx.stabilizeConfig = { intervalMs: 100, timeoutMs: 1000 };
    expect(ctx.stabilizeConfig).toEqual({ intervalMs: 100, timeoutMs: 1000 });
  });
});

describe('ProviderRuntime', () => {
  let runtime: TestRuntime;

  beforeEach(() => {
    runtime = new TestRuntime();
  });

  it('lists registered resource types', () => {
    expect(runtime.listResourceTypes()).toEqual(['test::Widget']);
  });

  it('returns the registered handler by type', () => {
    const handler = runtime.getHandler('test::Widget');
    expect(handler).toBeInstanceOf(WidgetHandler);
  });

  it('throws when handler is not found', () => {
    expect(() => runtime.getHandler('test::Missing')).toThrow(
      "No handler registered for resource type 'test::Missing'.",
    );
  });

  it('allows registering a second handler', () => {
    runtime.register('test::Gadget', new WidgetHandler());
    expect(runtime.listResourceTypes()).toEqual([
      'test::Widget',
      'test::Gadget',
    ]);
  });
});

describe('ResourceHandler', () => {
  let handler: WidgetHandler;
  let ctx: TestContext;

  beforeEach(() => {
    handler = new WidgetHandler();
    ctx = new TestContext(stubSdk, new NoopLogger());
  });

  it('create returns state with sdk-derived id', async () => {
    const state = await handler.create(ctx, { name: 'hello' });
    expect(state).toEqual({ id: 'w-1', name: 'hello' });
  });

  it('update merges props into existing state', async () => {
    const prior: WidgetState = { id: 'w-1', name: 'old' };
    const state = await handler.update(ctx, { name: 'new' }, prior);
    expect(state).toEqual({ id: 'w-1', name: 'new' });
  });

  it('delete resolves without error', async () => {
    const state: WidgetState = { id: 'w-1', name: 'x' };
    const base: ResourceHandler<WidgetProps, WidgetState, StubSdk> = handler;
    await expect(base.delete(ctx, state)).resolves.toBeUndefined();
  });

  it('get returns state', async () => {
    const state = await handler.get(ctx, { name: 'hello' });
    expect(state).toEqual({ id: 'w-1', name: 'hello' });
  });

  describe('waitUntilStabilized', () => {
    // Expose protected method via subclass
    class StabilizingHandler extends WidgetHandler {
      stabilize(
        check: () => Promise<StabilizeStatus>,
        config: StabilizeConfig,
      ): Promise<void> {
        return this.waitUntilStabilized(check, config);
      }
    }

    let handler: StabilizingHandler;
    const fastConfig: StabilizeConfig = { intervalMs: 1, timeoutMs: 5000 };

    beforeEach(() => {
      handler = new StabilizingHandler();
    });

    it('returns when check resolves ready on first call', async () => {
      const check = jest.fn<Promise<StabilizeStatus>, []>().mockResolvedValue({
        status: 'ready',
      });
      await expect(
        handler.stabilize(check, fastConfig),
      ).resolves.toBeUndefined();
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('returns after pending then ready', async () => {
      const check = jest
        .fn<Promise<StabilizeStatus>, []>()
        .mockResolvedValueOnce({ status: 'pending' })
        .mockResolvedValue({ status: 'ready' });
      await expect(
        handler.stabilize(check, fastConfig),
      ).resolves.toBeUndefined();
      expect(check).toHaveBeenCalledTimes(2);
    });

    it('throws immediately when check returns failed', async () => {
      const check = jest.fn<Promise<StabilizeStatus>, []>().mockResolvedValue({
        status: 'failed',
        reason: 'disk error',
      });
      await expect(handler.stabilize(check, fastConfig)).rejects.toThrow(
        'disk error',
      );
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('throws StabilizationTimeoutError when timeoutMs is exceeded', async () => {
      // timeoutMs: 0 means deadline is already reached after the first pending
      const check = jest
        .fn<Promise<StabilizeStatus>, []>()
        .mockResolvedValue({ status: 'pending' });
      await expect(
        handler.stabilize(check, { intervalMs: 1, timeoutMs: 0 }),
      ).rejects.toBeInstanceOf(StabilizationTimeoutError);
    });

    it('StabilizationTimeoutError message includes timeoutMs', async () => {
      const check = jest
        .fn<Promise<StabilizeStatus>, []>()
        .mockResolvedValue({ status: 'pending' });
      await expect(
        handler.stabilize(check, { intervalMs: 1, timeoutMs: 0 }),
      ).rejects.toThrow('0ms');
    });
  });

  describe('assertExists', () => {
    it('returns the value when defined', () => {
      // assertExists is protected — test via a subclass that exposes it
      class ExposedHandler extends WidgetHandler {
        check<T>(v: T | undefined | null, msg?: string): T {
          return this.assertExists(v, msg);
        }
      }
      const h = new ExposedHandler();
      expect(h.check('ok')).toBe('ok');
      expect(h.check(0)).toBe(0);
    });

    it('throws on undefined', () => {
      class ExposedHandler extends WidgetHandler {
        check<T>(v: T | undefined | null, msg?: string): T {
          return this.assertExists(v, msg);
        }
      }
      const h = new ExposedHandler();
      expect(() => h.check(undefined)).toThrow('Value missing');
    });

    it('throws on null', () => {
      class ExposedHandler extends WidgetHandler {
        check<T>(v: T | undefined | null, msg?: string): T {
          return this.assertExists(v, msg);
        }
      }
      const h = new ExposedHandler();
      expect(() => h.check(null)).toThrow('Value missing');
    });

    it('uses custom message when provided', () => {
      class ExposedHandler extends WidgetHandler {
        check<T>(v: T | undefined | null, msg?: string): T {
          return this.assertExists(v, msg);
        }
      }
      const h = new ExposedHandler();
      expect(() => h.check(undefined, 'gone')).toThrow('gone');
    });
  });
});
