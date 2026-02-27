import { IResolvable, ResolveContext } from '../resolvables';
import { Resource } from './resource';

export class ResourceAttribute implements IResolvable {
  constructor(
    private readonly resource: Resource,
    private readonly attribute: string,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resolve(_context: ResolveContext) {
    return {
      ref: this.resource.logicalId,
      attr: this.attribute,
    };
  }
}
