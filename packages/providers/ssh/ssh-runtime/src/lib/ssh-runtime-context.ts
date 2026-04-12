import { RuntimeContext, RuntimeLogger } from '@cdk-x/core';
import type { SshSdk } from './ssh-sdk-facade';

/**
 * Concrete {@link RuntimeContext} for the SSH provider.
 * Carries an {@link SshSdk} instance and a {@link RuntimeLogger}.
 */
export class SshRuntimeContext extends RuntimeContext<SshSdk> {
  readonly sdk: SshSdk;
  readonly logger: RuntimeLogger;

  constructor(sdk: SshSdk, logger: RuntimeLogger) {
    super();
    this.sdk = sdk;
    this.logger = logger;
  }
}
