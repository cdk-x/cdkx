import { App, Stack, IResolvable, StackOutput } from '@cdkx-io/core';
import {
  HtzFloatingIpAssignment,
  HtzLoadBalancerService,
  HtzLoadBalancerTarget,
  HtzPlacementGroup,
  HtzServer,
  HtzSshKey,
  HtzVolume,
  HtzVolumeAttachment,
  LoadBalancerServiceProtocol,
  LoadBalancerTargetType,
  Location,
  PlacementGroupType,
  ServerType,
} from '@cdkx-io/hetzner';

export interface ComputeStackProps {
  /** Token that resolves to the Hetzner network ID at deploy time. */
  readonly networkId: IResolvable;
  /** Token that resolves to the Hetzner floating IP ID at deploy time. */
  readonly floatingIpId: IResolvable;
  /** Token that resolves to the Hetzner load balancer ID at deploy time. */
  readonly loadBalancerId: IResolvable;
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

    const server = new HtzServer(this, 'AppServer', {
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

    new HtzVolumeAttachment(this, 'AppVolumeAttachment', {
      volumeId: volume.attrVolumeId,
      serverId: server.attrServerId,
    });

    new HtzFloatingIpAssignment(this, 'AppFloatingIpAssignment', {
      floatingIpId: props.floatingIpId,
      serverId: server.attrServerId,
    });

    new HtzLoadBalancerService(this, 'AppLbService', {
      loadBalancerId: props.loadBalancerId,
      listenPort: 80,
      destinationPort: 80,
      protocol: LoadBalancerServiceProtocol.TCP,
      proxyprotocol: false,
    });

    new HtzLoadBalancerTarget(this, 'AppLbTarget', {
      loadBalancerId: props.loadBalancerId,
      type: LoadBalancerTargetType.SERVER,
      serverId: server.attrServerId,
      usePrivateIp: true,
    });
  }
}
