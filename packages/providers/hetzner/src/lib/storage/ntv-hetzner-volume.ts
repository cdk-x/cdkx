// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Properties that describe a Hetzner Volume resource.
 */
export interface HetznerVolume {
  /** Size of the Volume in GB. */
  readonly size: number;
  /** Name of the volume. */
  readonly name: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
  /** Auto-mount Volume after attach. `server` must be provided. */
  readonly automount?: boolean;
  /** Format Volume after creation. One of: `xfs`, `ext4`. */
  readonly format?: string;
  /** Location to create the Volume in (can be omitted if Server is specified). */
  readonly location?: string;
  /** Server to which to attach the Volume once it's created (Volume will be created in the same Location as the server). */
  readonly server?: number;
}

/**
 * Props for {@link NtvHetznerVolume}.
 *
 * Identical to {@link HetznerVolume} — extended here for future additions.
 */
export interface NtvHetznerVolumeProps extends HetznerVolume {}

/**
 * L1 construct representing a `Hetzner::Storage::Volume` resource.
 */
export class NtvHetznerVolume extends ProviderResource {
  /**
   * Cloud-assigned ID of this volume resource.
   */
  get volumeId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'volumeId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerVolumeProps) {
    super(scope, id, {
      type: HetznerResourceType.Storage.VOLUME,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
