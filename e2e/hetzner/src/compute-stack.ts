import { App, Stack, IResolvable } from '@cdkx-io/core';
import { HtzServer, HtzSshKey, Location, ServerType } from '@cdkx-io/hetzner';

export interface ComputeStackProps {
  /** Token that resolves to the Hetzner network ID at deploy time. */
  readonly networkId: IResolvable;
}

export class ComputeStack extends Stack {
  constructor(app: App, props: ComputeStackProps) {
    super(app, 'Compute');

    const sshKey = new HtzSshKey(this, 'E2eSshKey', {
      name: 'e2e-ssh-key',
      publicKey: process.env['SSH_PUBLIC_KEY'] ?? '',
    });

    new HtzServer(this, 'AppServer', {
      name: 'e2e-app-server',
      serverType: ServerType.CAX11,
      image: 'ubuntu-22.04',
      location: Location.NBG1,
      networks: [props.networkId],
      sshKeys: [sshKey.attrName],
    });
  }
}
