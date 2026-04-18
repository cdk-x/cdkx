import type { Logger } from '@cdk-x/logger';
import type {
  ProviderRuntime,
  RuntimeContext,
  RuntimeLogger,
  StabilizeConfig,
} from '@cdk-x/core';
import type {
  ProviderAdapter,
  ManifestResource,
  CreateResult,
  UpdateResult,
} from './provider-adapter';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Configuration for a single resource type within the
 * {@link RuntimeAdapter}.
 *
 * Provides the per-type metadata the adapter needs to translate between
 * the engine's generic `ManifestResource` representation and the handler's
 * typed `TState` objects.
 */
export interface RuntimeResourceConfig {
  /**
   * The key within the handler's `TState` object that holds the
   * provider-assigned physical ID.
   *
   * For example, `'networkId'` for `HetznerNetworkState`, `'serverId'`
   * for `HetznerServerState`.  The adapter reads
   * `state[physicalIdKey]` and converts it to `String(...)` for the
   * engine's `CreateResult.physicalId`.
   */
  readonly physicalIdKey: string;

  /**
   * Property names that can only be set at creation time.
   * The engine strips these from the update patch before calling
   * `adapter.update()`.
   */
  readonly createOnlyProps?: ReadonlySet<string>;
}

/**
 * Options accepted by {@link RuntimeAdapter}'s constructor.
 */
export interface RuntimeAdapterOptions<TSdk> {
  /**
   * The provider runtime that owns all registered resource handlers.
   */
  readonly runtime: ProviderRuntime<TSdk>;

  /**
   * The runtime context (SDK + logger) forwarded to every handler call.
   */
  readonly context: RuntimeContext<TSdk>;

  /**
   * Per-resource-type configuration.
   * Keys are resource type strings (e.g. `'Hetzner::Networking::Network'`).
   */
  readonly resourceConfigs: Record<string, RuntimeResourceConfig>;
}

// ─── RuntimeAdapter ───────────────────────────────────────────────────────────

/**
 * Bridge between the engine's {@link ProviderAdapter} interface and the
 * handler-based {@link ProviderRuntime} architecture.
 *
 * The engine calls the adapter's `create` / `update` / `delete` /
 * `getOutput` methods.  `RuntimeAdapter` delegates each call to the
 * correct {@link ResourceHandler} via `runtime.getHandler(type)`,
 * translating between the engine's `ManifestResource` shape and the
 * handler's typed props / state.
 *
 * **State bridging strategy:**
 *
 * - On `create()`, the handler returns a typed `TState` object.  The
 *   adapter returns it as `CreateResult.outputs`, so the engine persists
 *   it in `ResourceState.outputs`.
 * - On `update()` and `delete()`, the engine does **not** pass prior
 *   outputs back.  The adapter calls `handler.get(ctx, props)` to
 *   reconstruct the current remote state, then forwards to
 *   `handler.update()` or `handler.delete()`.
 * - On `getOutput()`, the adapter looks up the attribute directly from
 *   the engine-persisted outputs stored on `ManifestResource.properties`
 *   — or reconstructs via `handler.get()` if needed.
 */
export class RuntimeAdapter<TSdk> implements ProviderAdapter {
  private readonly runtime: ProviderRuntime<TSdk>;
  private readonly context: RuntimeContext<TSdk>;
  private readonly resourceConfigs: Record<string, RuntimeResourceConfig>;

  constructor(options: RuntimeAdapterOptions<TSdk>) {
    this.runtime = options.runtime;
    this.context = options.context;
    this.resourceConfigs = options.resourceConfigs;
  }

  /**
   * Propagate the engine logger to the runtime context.
   *
   * The engine's {@link Logger} is structurally compatible with
   * {@link RuntimeLogger} — it can be cast directly without an adapter
   * wrapper.
   */
  setLogger(logger: Logger): void {
    // Logger satisfies RuntimeLogger structurally.
    // The runtime context is constructed by the factory and may already
    // carry a logger.  When the engine calls setLogger, we update the
    // context's logger reference so handlers see the engine-provided one.
    (this.context as { logger: RuntimeLogger }).logger =
      logger as unknown as RuntimeLogger;
  }

  /**
   * Propagate the merged stabilization config from the engine to the
   * runtime context so that handlers can read it via `ctx.stabilizeConfig`.
   */
  setStabilizeConfig(config: StabilizeConfig): void {
    this.context.stabilizeConfig = config;
  }

  // ─── create ──────────────────────────────────────────────────────────────

  async create(resource: ManifestResource): Promise<CreateResult> {
    const handler = this.runtime.getHandler(resource.type);
    const state = await handler.create(this.context, resource.properties);
    const config = this.requireConfig(resource.type);
    const stateRecord = state as Record<string, unknown>;

    // Build CRN if the handler implements buildCrn()
    let crn: string | undefined;
    try {
      crn = handler.buildCrn(resource.properties, state);
    } catch {
      // Handler does not implement buildCrn() - CRN will be undefined
      crn = undefined;
    }

    return {
      physicalId: String(stateRecord[config.physicalIdKey]),
      outputs: stateRecord,
      crn,
    };
  }

  // ─── update ──────────────────────────────────────────────────────────────

  async update(resource: ManifestResource): Promise<UpdateResult> {
    const handler = this.runtime.getHandler(resource.type);

    // Reconstruct current remote state via handler.get().
    // The engine does not pass prior outputs, so we must fetch.
    const currentState = await handler.get(this.context, resource.properties);

    const newState = await handler.update(
      this.context,
      resource.properties,
      currentState,
    );
    const stateRecord = newState as Record<string, unknown>;

    return { outputs: stateRecord };
  }

  // ─── delete ──────────────────────────────────────────────────────────────

  async delete(resource: ManifestResource): Promise<void> {
    const handler = this.runtime.getHandler(resource.type);

    // Reconstruct state from the stored properties.
    const state = await handler.get(this.context, resource.properties);
    await handler.delete(this.context, state);
  }

  // ─── validate ────────────────────────────────────────────────────────────

  async validate(resource: ManifestResource): Promise<void> {
    // Verify the handler is registered — throws if not.
    this.runtime.getHandler(resource.type);
  }

  // ─── getOutput ───────────────────────────────────────────────────────────

  async getOutput(resource: ManifestResource, attr: string): Promise<unknown> {
    // After create(), the engine stores handler state as
    // ResourceState.outputs.  The engine resolves tokens by calling
    // getOutput() with the already-created resource.  We can reconstruct
    // the state via handler.get() and read the attribute.
    const handler = this.runtime.getHandler(resource.type);
    const state = await handler.get(this.context, resource.properties);
    return (state as Record<string, unknown>)[attr];
  }

  // ─── getCreateOnlyProps ──────────────────────────────────────────────────

  getCreateOnlyProps(type: string): ReadonlySet<string> {
    const config = this.resourceConfigs[type];
    return config?.createOnlyProps ?? new Set<string>();
  }

  // ─── private helpers ─────────────────────────────────────────────────────

  private requireConfig(type: string): RuntimeResourceConfig {
    const config = this.resourceConfigs[type];
    if (!config) {
      throw new Error(
        `RuntimeAdapter: no resource config registered for type '${type}'. ` +
          `Registered types: ${Object.keys(this.resourceConfigs).join(', ') || '(none)'}`,
      );
    }
    return config;
  }
}
