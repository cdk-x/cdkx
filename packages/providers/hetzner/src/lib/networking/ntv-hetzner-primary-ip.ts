// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * [Primary IP](#tag/primary-ips) type.
 */
export enum PrimaryIpType {
  IPV4 = 'ipv4',
  IPV6 = 'ipv6',
}

/**
 * Type of resource the [Primary IP](#tag/primary-ips) can get assigned to.

Currently [Primary IPs](#tag/primary-ips) can only be assigned to [Servers](#tag/servers),
therefore this field must be set to `server`.

 */
export enum PrimaryIpAssigneeType {
  SERVER = 'server',
}

/**
 * Properties that describe a Hetzner PrimaryIp resource.
 */
export interface HetznerPrimaryIp {
  /** Name of the Resource. Must be unique per Project. */
  readonly name: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
  /** [Primary IP](#tag/primary-ips) type. */
  readonly type: PrimaryIpType;
  /** **Deprecated**: This property is deprecated and will be removed after 1 July 2026. */
  readonly datacenter?: string;
  /** [Location](#tag/locations) ID or name the [Primary IP](#tag/primary-ips) will be bound to. */
  readonly location?: string;
  /** Type of resource the [Primary IP](#tag/primary-ips) can get assigned to. */
  readonly assigneeType: PrimaryIpAssigneeType;
  /** ID of resource to assign the [Primary IP](#tag/primary-ips) to. */
  readonly assigneeId?: string | number | IResolvable | null;
  /** Auto deletion state. */
  readonly autoDelete?: boolean;
}

/**
 * Props for {@link NtvHetznerPrimaryIp}.
 *
 * Identical to {@link HetznerPrimaryIp} — extended here for future additions.
 */
export interface NtvHetznerPrimaryIpProps extends HetznerPrimaryIp {}

/**
 * L1 construct representing a `Hetzner::Networking::PrimaryIp` resource.
 */
export class NtvHetznerPrimaryIp extends ProviderResource {
  /**
   * Cloud-assigned ID of this primaryip resource.
   */
  get primaryipId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'primaryipId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerPrimaryIpProps) {
    super(scope, id, {
      type: HetznerResourceType.Networking.PRIMARYIP,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
