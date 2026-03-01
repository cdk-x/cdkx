import { ProviderResource } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

export interface HetznerNetwork {
  readonly name: string;
  readonly ipRange: string;
  readonly labels?: Record<string, string>;
  readonly exposeRoutesToVswitch?: boolean;
}

export interface NtvHetznerNetworkProps extends HetznerNetwork {}

export class NtvHetznerNetwork extends ProviderResource {
  constructor(scope: Construct, id: string, props: NtvHetznerNetworkProps) {
    super(scope, id, {
      type: HetznerResourceType.Networking.NETWORK,
      properties: {
        ...props,
      },
    });
    this.node.defaultChild = this;
  }
}
