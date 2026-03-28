import { App, Stack, StackOutput } from '@cdkx-io/core';
import {
  HtzNetwork,
  HtzSubnet,
  HtzRoute,
  HtzFloatingIp,
  HtzPrimaryIp,
  FloatingIpType,
  Location,
  NetworkSubnetType,
  NetworkZone,
  PrimaryIpAssigneeType,
  PrimaryIpType,
} from '@cdkx-io/hetzner';

export class NetworkStack extends Stack {
  /** Cross-stack output: the network ID created by this stack. */
  public readonly networkIdOutput: StackOutput;
  /** Cross-stack output: the floating IP ID created by this stack. */
  public readonly floatingIpIdOutput: StackOutput;
  /** Cross-stack output: the primary IP ID created by this stack. */
  public readonly primaryIpIdOutput: StackOutput;

  constructor(app: App) {
    super(app, 'Networking');

    const network = new HtzNetwork(this, 'Network', {
      name: 'e2e-network',
      ipRange: '10.0.0.0/16',
    });

    const subnet = new HtzSubnet(this, 'Subnet', {
      networkId: network.attrNetworkId,
      type: NetworkSubnetType.CLOUD,
      networkZone: NetworkZone.EU_CENTRAL,
      ipRange: '10.0.1.0/24',
    });

    const route = new HtzRoute(this, 'Route', {
      networkId: network.attrNetworkId,
      destination: '10.100.0.0/24',
      gateway: '10.0.1.1',
    });

    // Hetzner only allows one concurrent action per network.
    // Serialize route after subnet so destroy runs route first, then subnet.
    route.addDependency(subnet);

    this.networkIdOutput = new StackOutput(this, 'NetworkId', {
      value: network.attrNetworkId,
      description: 'The Hetzner network ID',
    });

    const floatingIp = new HtzFloatingIp(this, 'FloatingIp', {
      type: FloatingIpType.IPV4,
      name: 'e2e-floating-ip',
      homeLocation: Location.NBG1,
    });

    this.floatingIpIdOutput = new StackOutput(this, 'FloatingIpId', {
      value: floatingIp.attrFloatingIpId,
      description: 'The Hetzner floating IP ID',
    });

    const primaryIp = new HtzPrimaryIp(this, 'PrimaryIp', {
      name: 'e2e-primary-ip',
      type: PrimaryIpType.IPV4,
      assigneeType: PrimaryIpAssigneeType.SERVER,
      location: Location.NBG1,
    });

    this.primaryIpIdOutput = new StackOutput(this, 'PrimaryIpId', {
      value: primaryIp.attrPrimaryIpId,
      description: 'The Hetzner primary IP ID',
    });
  }
}
