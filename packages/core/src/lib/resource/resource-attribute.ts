import { IResolvable, ResolveContext } from '../resolvables';
import { Resource } from './resource';

export class ResourceAttribute implements IResolvable {
  constructor(
    private readonly resource: Resource,
    private readonly attribute: string,
  ) {}

  resolve(_context: ResolveContext) {
    return {
      ref: this.resource.logicalId,
      attr: this.attribute,
    };
  }
}
