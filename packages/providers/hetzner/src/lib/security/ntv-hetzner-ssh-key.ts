// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Properties that describe a Hetzner SshKey resource.
 */
export interface HetznerSshKey {
  /** Name of the SSH key. */
  readonly name: string;
  /** Public key. */
  readonly publicKey: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
}

/**
 * Props for {@link NtvHetznerSshKey}.
 *
 * Identical to {@link HetznerSshKey} — extended here for future additions.
 */
export interface NtvHetznerSshKeyProps extends HetznerSshKey {}

/**
 * L1 construct representing a `Hetzner::Security::SshKey` resource.
 */
export class NtvHetznerSshKey extends ProviderResource {
  /**
   * Cloud-assigned ID of this sshkey resource.
   */
  get sshkeyId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'sshkeyId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerSshKeyProps) {
    super(scope, id, {
      type: HetznerResourceType.Security.SSHKEY,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
