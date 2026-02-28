import { ProviderResource } from '../provider-resource/provider-resource.js';
import { IResolvable } from '../resolvables/index.js';
import { Resource } from './resource.js';

export class ResourceAttribute implements IResolvable {
  constructor(
    private readonly resource: Resource,
    private readonly attribute: string,
  ) {}

  resolve() {
    // Resolve to the logicalId of the underlying L1 ProviderResource so that
    // cross-resource references point to the exact key used in the stack JSON.
    const l1 = this.resource.node.defaultChild;
    if (!l1 || !ProviderResource.isProviderResource(l1)) {
      throw new Error(
        `ResourceAttribute: Resource '${this.resource.node.path}' does not have a ProviderResource as its default child. ` +
          `Ensure the L2 construct sets this.node.defaultChild to its L1 ProviderResource.`,
      );
    }
    return {
      ref: l1.logicalId,
      attr: this.attribute,
    };
  }
}
