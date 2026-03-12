import { RuntimeLogger } from './runtime-logger';

/**
 * Context object passed to every {@link ResourceHandler} method.
 *
 * Carries the provider SDK and a logger. Provider packages subclass
 * this to expose a typed SDK (e.g. `HetznerRuntimeContext`).
 */
export abstract class RuntimeContext<TSdk = unknown> {
  abstract readonly sdk: TSdk;
  abstract readonly logger: RuntimeLogger;
}
