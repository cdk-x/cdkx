import { App, Stack, StackOutput } from '@cdk-x/core';
import {
  HtzNetwork,
  HtzServer,
  HtzSshKey,
  Location,
  NetworkSubnetType,
  NetworkZone,
  ServerType,
  HtzSubnet,
} from '@cdk-x/hetzner';

export class InfraStack extends Stack {
  /** Cross-stack output: the server public IPv4 address. */
  public readonly serverIpOutput: StackOutput;

  constructor(app: App) {
    super(app, 'Infra');

    const network = new HtzNetwork(this, 'Network', {
      name: 'ansible-e2e-network',
      ipRange: '10.0.0.0/16',
    });

    new HtzSubnet(this, 'Subnet', {
      networkId: network.attrNetworkId,
      type: NetworkSubnetType.CLOUD,
      networkZone: NetworkZone.EU_CENTRAL,
      ipRange: '10.0.1.0/24',
    });

    const sshKey = new HtzSshKey(this, 'SshKey', {
      name: 'ansible-e2e-ssh-key',
      publicKey: process.env['SSH_PUBLIC_KEY'] ?? '',
    });

    const server = new HtzServer(this, 'AppServer', {
      name: 'ansible-e2e-server',
      serverType: ServerType.CAX11,
      image: 'ubuntu-22.04',
      location: Location.NBG1,
      networks: [network.attrNetworkId],
      sshKeys: [sshKey.attrName],
    });

    this.serverIpOutput = new StackOutput(this, 'ServerIp', {
      value: server.attrPublicIpv4,
      description: 'The public IPv4 address of the app server',
    });
  }
}
