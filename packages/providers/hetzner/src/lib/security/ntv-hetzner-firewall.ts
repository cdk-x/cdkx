// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Array of rules.

Rules are limited to 50 entries per [Firewall](#tag/firewalls) and [500 effective rules](https://docs.hetzner.com/cloud/firewalls/overview#limits).

 */
export interface FirewallRule {
  /** Description of the rule. */
  readonly description?: string | null;
  /** Traffic direction in which the rule should be applied to. */
  readonly direction: FirewallRuleDirection;
  /** List of permitted IPv4/IPv6 addresses for incoming traffic. */
  readonly sourceIps?: string[];
  /** List of permitted IPv4/IPv6 addresses for outgoing traffic. */
  readonly destinationIps?: string[];
  /** Network protocol to apply the rule for. */
  readonly protocol: FirewallRuleProtocol;
  /** Port or port range to apply the rule for. */
  readonly port?: string;
}

/**
 * [Server](#tag/servers) the [Firewall](#tag/firewalls) is applied to.

Only set for `type` `server`, otherwise `null`.

 */
export interface FirewallApplyToServer {

}

/**
 * [Label Selector](#description/label-selector) the [Firewall](#tag/firewalls) is applied to.

Only set for `type` `label_selector`, otherwise `null`.

 */
export interface FirewallApplyToLabelSelector {
  /** The selector. */
  readonly selector: string;
}

/**
 * Resources to apply the [Firewall](#tag/firewalls) to.

Resources added directly are taking precedence over those added via a [Label Selector](#description/label-selector).

 */
export interface FirewallApplyTo {
  /** Type of the resource. */
  readonly type: FirewallApplyToType;
  /** [Server](#tag/servers) the [Firewall](#tag/firewalls) is applied to. */
  readonly server?: FirewallApplyToServer;
  /** [Label Selector](#description/label-selector) the [Firewall](#tag/firewalls) is applied to. */
  readonly labelSelector?: FirewallApplyToLabelSelector;
}

/**
 * Traffic direction in which the rule should be applied to.

Use `source_ips` for direction `in` and `destination_ips` for direction `out` to specify IPs.

 */
export enum FirewallRuleDirection {
  IN = 'in',
  OUT = 'out',
}

/**
 * Network protocol to apply the rule for.
 */
export enum FirewallRuleProtocol {
  TCP = 'tcp',
  UDP = 'udp',
  ICMP = 'icmp',
  ESP = 'esp',
  GRE = 'gre',
}

/**
 * Type of the resource.
 */
export enum FirewallApplyToType {
  SERVER = 'server',
  LABEL_SELECTOR = 'label_selector',
}

/**
 * Properties that describe a Hetzner Firewall resource.
 */
export interface HetznerFirewall {
  /** Name of the [Firewall](#tag/firewalls). */
  readonly name: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
  /** Array of rules. */
  readonly rules?: FirewallRule[];
  /** Resources to apply the [Firewall](#tag/firewalls) to. */
  readonly applyTo?: FirewallApplyTo[];
}

/**
 * Props for {@link NtvHetznerFirewall}.
 *
 * Identical to {@link HetznerFirewall} — extended here for future additions.
 */
export interface NtvHetznerFirewallProps extends HetznerFirewall {}

/**
 * L1 construct representing a `Hetzner::Security::Firewall` resource.
 */
export class NtvHetznerFirewall extends ProviderResource {
  /**
   * Cloud-assigned ID of this firewall resource.
   */
  get firewallId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'firewallId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerFirewallProps) {
    super(scope, id, {
      type: HetznerResourceType.Security.FIREWALL,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
