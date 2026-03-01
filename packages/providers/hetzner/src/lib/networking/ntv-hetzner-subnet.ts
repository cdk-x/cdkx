import { ProviderResource } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType, NetworkZone } from '../common/index.js';

export enum SubnetType {
  CLOUD = 'cloud',
  SERVER = 'server',
  VSWITCH = 'vswitch',
}

export interface HetznerSubnet {
  readonly networkId: string | number;
  readonly type: SubnetType;
  readonly networkZone: NetworkZone;
  readonly ipRange: string;
  readonly vswitchId?: number;
}

export interface NtvHetznerSubnetProps extends HetznerSubnet {}

export class NtvHetznerSubnet extends ProviderResource {
  constructor(scope: Construct, id: string, props: NtvHetznerSubnetProps) {
    super(scope, id, {
      type: HetznerResourceType.Networking.SUBNET,
      properties: {
        ...props,
      },
    });
    this.node.defaultChild = this;
  }
}
