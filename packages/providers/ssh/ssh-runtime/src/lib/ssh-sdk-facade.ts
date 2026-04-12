import { NodeSshClient } from '@cdk-x/ssh-sdk';
import type { SshConnectOptions, SshConnection } from '@cdk-x/ssh-sdk';

export type { SshConnection };

/**
 * SDK interface passed to every SSH {@link ResourceHandler} via
 * {@link SshRuntimeContext}.
 *
 * Exposes a single `connect()` method so handlers open a fresh
 * connection per operation with the props they already have.
 */
export interface SshSdk {
  connect(opts: SshConnectOptions): Promise<SshConnection>;
}

/**
 * Factory that creates a {@link SshSdk} backed by {@link NodeSshClient}.
 */
export class SshSdkFactory {
  static create(): SshSdk {
    return new NodeSshClient();
  }
}
