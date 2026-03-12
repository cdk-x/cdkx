import { RuntimeContext, RuntimeLogger } from '@cdkx-io/core';
import { HetznerSdk } from './hetzner-sdk-facade';

/**
 * Concrete {@link RuntimeContext} for the Hetzner Cloud provider.
 * Carries a {@link HetznerSdk} facade and a {@link RuntimeLogger}.
 *
 * Created by the runtime adapter and injected into every
 * {@link ResourceHandler} method call.
 */
export class HetznerRuntimeContext extends RuntimeContext<HetznerSdk> {
  readonly sdk: HetznerSdk;
  readonly logger: RuntimeLogger;

  constructor(sdk: HetznerSdk, logger: RuntimeLogger) {
    super();
    this.sdk = sdk;
    this.logger = logger;
  }
}
