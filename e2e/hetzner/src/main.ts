import { App, Stack } from '@cdkx-io/core';
import {
  HtzNetwork,
  HtzSubnet,
  HtzRoute,
  NetworkSubnetType,
  NetworkZone,
} from '@cdkx-io/hetzner';

const app = new App();
const networking = new Stack(app, 'Networking');

const network = new HtzNetwork(networking, 'Network', {
  name: 'e2e-network',
  ipRange: '10.0.0.0/16',
});

new HtzSubnet(networking, 'Subnet', {
  networkId: network.attrNetworkId,
  type: NetworkSubnetType.CLOUD,
  networkZone: NetworkZone.EU_CENTRAL,
  ipRange: '10.0.1.0/24',
});

new HtzRoute(networking, 'Route', {
  networkId: network.attrNetworkId,
  destination: '10.100.0.0/24',
  gateway: '10.0.1.1',
});

app.synth();
