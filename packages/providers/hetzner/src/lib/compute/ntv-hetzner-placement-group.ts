// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Define the Placement Group Type.
 */
export enum PlacementGroupType {
  SPREAD = 'spread',
}

/**
 * Properties that describe a Hetzner PlacementGroup resource.
 */
export interface HetznerPlacementGroup {
  /** Name of the Placement Group. */
  readonly name: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
  /** Define the Placement Group Type. */
  readonly type: PlacementGroupType;
}

/**
 * Props for {@link NtvHetznerPlacementGroup}.
 *
 * Identical to {@link HetznerPlacementGroup} — extended here for future additions.
 */
export interface NtvHetznerPlacementGroupProps extends HetznerPlacementGroup {}

/**
 * L1 construct representing a `Hetzner::Compute::PlacementGroup` resource.
 */
export class NtvHetznerPlacementGroup extends ProviderResource {
  /**
   * Cloud-assigned ID of this placementgroup resource.
   */
  get placementgroupId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'placementgroupId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(
    scope: Construct,
    id: string,
    props: NtvHetznerPlacementGroupProps,
  ) {
    super(scope, id, {
      type: HetznerResourceType.Compute.PLACEMENTGROUP,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
