import { Construct, IConstruct } from 'constructs';
import { RemovalPolicy } from '../removal-policy';
import { ProviderResource } from '../provider-resource/provider-resource';

export interface IResource extends IConstruct {
  applyRemovalPolicy(policy: RemovalPolicy): void;
}

export interface ResourceProps {
  /**
   * The value passed in by users to the physical name prop of the resource.
   *
   * - `undefined` implies that a physical name will be allocated by
   *   the engine during deployment.
   * - a concrete value implies a specific physical name
   * - `PhysicalName.GENERATE_IF_NEEDED` is a marker that indicates that a physical will only be generated
   *   by the CDK if it is needed for cross-environment references. Otherwise, it will be allocated by the engine.
   *
   * @default - The physical name will be allocated by the engine at deployment time
   */
  readonly physicalName?: string;
}

export abstract class Resource extends Construct implements IResource {
  /**
   * Logical ID of this resource, único dentro del scope
   */
  public readonly logicalId: string;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.logicalId = this.node.path;
  }

  applyRemovalPolicy(policy: RemovalPolicy) {
    const child = this.node.defaultChild;
    if (!child || !ProviderResource.isProviderResource(child)) {
      throw new Error(
        'Cannot apply removal policy to a resource without a provider resource',
      );
    }
    child.applyRemovalPolicy(policy);
  }
}
