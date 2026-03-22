import { App, Stack, StackOutput } from '@cdkx-io/core';
import {
  HtzNetwork,
  HtzSubnet,
  HtzRoute,
  NetworkSubnetType,
  NetworkZone,
} from '@cdkx-io/hetzner';

export class NetworkStack extends Stack {
  /** Cross-stack output: the network ID created by this stack. */
  public readonly networkIdOutput: StackOutput;

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
  }
}
