import { ProviderRuntime } from '@cdkx-io/core';
import { HetznerSdk } from './hetzner-sdk-facade';
import {
  HetznerNetworkHandler,
  HetznerSubnetHandler,
  HetznerRouteHandler,
  HetznerCertificateHandler,
  HetznerServerHandler,
  HetznerSshKeyHandler,
  HetznerPlacementGroupHandler,
  HetznerVolumeHandler,
  HetznerVolumeAttachmentHandler,
  HetznerFloatingIpHandler,
  HetznerFloatingIpAssignmentHandler,
  HetznerPrimaryIpHandler,
  HetznerPrimaryIpAssignmentHandler,
  HetznerFirewallHandler,
  HetznerFirewallRulesHandler,
  HetznerFirewallAttachmentHandler,
  HetznerLoadBalancerHandler,
  HetznerLoadBalancerServiceHandler,
  HetznerLoadBalancerTargetHandler,
} from './handlers';

/**
 * Hetzner Cloud provider runtime.
 *
 * Registers one {@link ResourceHandler} per supported Hetzner resource
 * type.  The engine resolves the correct handler via
 * `getHandler(resourceType)` during deployment.
 */
export class HetznerProviderRuntime extends ProviderRuntime<HetznerSdk> {
  constructor() {
    super();
    this.register('Hetzner::Networking::Network', new HetznerNetworkHandler());
    this.register('Hetzner::Networking::Subnet', new HetznerSubnetHandler());
    this.register('Hetzner::Networking::Route', new HetznerRouteHandler());
    this.register(
      'Hetzner::Security::Certificate',
      new HetznerCertificateHandler(),
    );
    this.register('Hetzner::Compute::Server', new HetznerServerHandler());
    this.register('Hetzner::Security::SshKey', new HetznerSshKeyHandler());
    this.register(
      'Hetzner::Compute::PlacementGroup',
      new HetznerPlacementGroupHandler(),
    );
    this.register('Hetzner::Storage::Volume', new HetznerVolumeHandler());
    this.register(
      'Hetzner::Storage::VolumeAttachment',
      new HetznerVolumeAttachmentHandler(),
    );
    this.register(
      'Hetzner::Networking::FloatingIp',
      new HetznerFloatingIpHandler(),
    );
    this.register(
      'Hetzner::Networking::FloatingIpAssignment',
      new HetznerFloatingIpAssignmentHandler(),
    );
    this.register(
      'Hetzner::Networking::PrimaryIp',
      new HetznerPrimaryIpHandler(),
    );
    this.register(
      'Hetzner::Networking::PrimaryIpAssignment',
      new HetznerPrimaryIpAssignmentHandler(),
    );
    this.register('Hetzner::Security::Firewall', new HetznerFirewallHandler());
    this.register(
      'Hetzner::Security::FirewallRules',
      new HetznerFirewallRulesHandler(),
    );
    this.register(
      'Hetzner::Security::FirewallAttachment',
      new HetznerFirewallAttachmentHandler(),
    );
    this.register(
      'Hetzner::Compute::LoadBalancer',
      new HetznerLoadBalancerHandler(),
    );
    this.register(
      'Hetzner::Compute::LoadBalancerService',
      new HetznerLoadBalancerServiceHandler(),
    );
    this.register(
      'Hetzner::Compute::LoadBalancerTarget',
      new HetznerLoadBalancerTargetHandler(),
    );
  }

  listResourceTypes(): string[] {
    return Object.keys(this.handlers);
  }
}
