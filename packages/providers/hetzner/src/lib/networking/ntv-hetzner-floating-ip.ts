// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * The Floating IP type.
 */
export enum FloatingIpType {
  IPV4 = 'ipv4',
  IPV6 = 'ipv6',
}

/**
 * Properties that describe a Hetzner FloatingIp resource.
 */
export interface HetznerFloatingIp {
  /** The Floating IP type. */
  readonly type: FloatingIpType;
  /** [Server](#tag/servers) the [Floating IP](#tag/floating-ips) is assigned to. */
  readonly server?: number | null;
  /** Home [Location](#tag/locations) for the [Floating IP](#tag/floating-ips). */
  readonly homeLocation?: string;
  /** Description of the Resource. */
  readonly description?: string | null;
  /** Name of the Resource. Must be unique per Project. */
  readonly name?: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
}

/**
 * Props for {@link NtvHetznerFloatingIp}.
 *
 * Identical to {@link HetznerFloatingIp} — extended here for future additions.
 */
export interface NtvHetznerFloatingIpProps extends HetznerFloatingIp {}

/**
 * L1 construct representing a `Hetzner::Networking::FloatingIp` resource.
 */
export class NtvHetznerFloatingIp extends ProviderResource {
  /**
   * Cloud-assigned ID of this floatingip resource.
   */
  get floatingipId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'floatingipId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerFloatingIpProps) {
    super(scope, id, {
      type: HetznerResourceType.Networking.FLOATINGIP,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
