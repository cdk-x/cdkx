import { App, Stack, IResolvable, StackOutput } from '@cdkx-io/core';
import {
  HtzPlacementGroup,
  HtzServer,
  HtzSshKey,
  HtzVolume,
  Location,
  PlacementGroupType,
  ServerType,
} from '@cdkx-io/hetzner';

export interface ComputeStackProps {
  /** Token that resolves to the Hetzner network ID at deploy time. */
  readonly networkId: IResolvable;
}

export class ComputeStack extends Stack {
  public readonly volumeIdOutput: StackOutput;
  public readonly volumeNameOutput: StackOutput;

  constructor(app: App, props: ComputeStackProps) {
    super(app, 'Compute');

    const sshKey = new HtzSshKey(this, 'E2eSshKey', {
      name: 'e2e-ssh-key',
      publicKey: process.env['SSH_PUBLIC_KEY'] ?? '',
    });

    const placementGroup = new HtzPlacementGroup(this, 'AppPlacementGroup', {
      name: 'e2e-placement-group',
      type: PlacementGroupType.SPREAD,
    });

    new HtzServer(this, 'AppServer', {
      name: 'e2e-app-server',
      serverType: ServerType.CAX11,
      image: 'ubuntu-22.04',
      location: Location.NBG1,
      networks: [props.networkId],
      sshKeys: [sshKey.attrName],
      placementGroupId: placementGroup.attrPlacementGroupId,
    });

    // Volume in the same location as the server.
    // Attachment to the server will be declared via HtzVolumeAttachment (follow-up issue).
    const volume = new HtzVolume(this, 'AppVolume', {
      name: 'e2e-app-volume',
      size: 10,
      location: Location.NBG1,
      format: 'ext4',
    });

    this.volumeIdOutput = new StackOutput(this, 'VolumeId', {
      value: volume.attrVolumeId,
      description: 'The Hetzner volume ID',
    });

    this.volumeNameOutput = new StackOutput(this, 'VolumeName', {
      value: volume.name,
      description: 'The Hetzner volume name',
    });
  }
}
