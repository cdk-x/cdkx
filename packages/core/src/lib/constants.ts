import { IResolvable } from './resolvables/resolvables';

/**
 * Resource symbol for re-usability.
 */
export const RESOURCE_SYMBOL = Symbol.for('@cdkx-io/core.Resource');

/**
 * Represents any valid value that can be used as a resource property before
 * synthesis. Includes JSON-serializable primitives, nested structures, and
 * IResolvable tokens (Lazy, ResourceAttribute, custom tokens) that are
 * resolved to plain values by the ResolverPipeline at synthesis time.
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | IResolvable
  | PropertyValue[]
  | { [key: string]: PropertyValue };
