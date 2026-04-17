import { RuntimeContext, RuntimeLogger } from '@cdk-x/core';
import type { MultipassSdk } from './multipass-cli-facade';

/**
 * Concrete {@link RuntimeContext} for the Multipass provider.
 * Carries a {@link MultipassSdk} (CLI facade) and a {@link RuntimeLogger}.
 *
 * Created by the runtime adapter and injected into every
 * {@link ResourceHandler} method call.
 */
export class MultipassRuntimeContext extends RuntimeContext<MultipassSdk> {
  readonly sdk: MultipassSdk;
  readonly logger: RuntimeLogger;

  constructor(sdk: MultipassSdk, logger: RuntimeLogger) {
    super();
    this.sdk = sdk;
    this.logger = logger;
  }
}
