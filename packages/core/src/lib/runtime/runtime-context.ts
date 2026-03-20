import { RuntimeLogger } from './runtime-logger';
import { StabilizeConfig } from './stabilize';

/** Default stabilization config — matches `DeploymentEngine` defaults. */
const DEFAULT_STABILIZE_CONFIG: StabilizeConfig = {
  intervalMs: 5000,
  timeoutMs: 600_000,
};

/**
 * Context object passed to every {@link ResourceHandler} method.
 *
 * Carries the provider SDK, a logger, and the stabilization configuration
 * supplied by the engine. Provider packages subclass this to expose a typed
 * SDK (e.g. `HetznerRuntimeContext`).
 */
export abstract class RuntimeContext<TSdk = unknown> {
  abstract readonly sdk: TSdk;
  abstract readonly logger: RuntimeLogger;

  /**
   * Stabilization polling configuration for this deployment run.
   * Populated by `RuntimeAdapter` from `DeploymentEngineOptions.stabilize`
   * (merged with engine defaults). Handlers read this via
   * `ctx.stabilizeConfig` when calling `waitUntilStabilized`.
   */
  stabilizeConfig: StabilizeConfig = DEFAULT_STABILIZE_CONFIG;
}
