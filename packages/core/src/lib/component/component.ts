import { Construct } from 'constructs';
import { AncestorWalker } from '../../internal/ancestors.js';
import { Resource } from '../resource/resource.js';
import { Stack } from '../stack/stack.js';

/**
 * Base class for structural, non-deployable pieces of a Resource's shape
 * (e.g. a Step inside a Job, a Task inside an Ansible Play). A Component
 * has no lifecycle of its own and never gets its own manifest entry — it
 * must always descend, directly or indirectly, from a Resource before
 * reaching a Stack.
 */
export abstract class Component extends Construct {
  /**
   * Type guard for Component.
   *
   * @param x - the value to test.
   * @returns true if `x` is a Component, narrowing its type.
   * @example
   * if (Component.isComponent(construct)) {
   *   // construct is now typed as Component
   * }
   */
  public static isComponent(x: unknown): x is Component {
    return x instanceof Component;
  }

  /**
   * @param scope - the construct this Component is defined within. Must
   * descend, directly or indirectly, from a Resource before reaching a
   * Stack — intermediate plain organizational Constructs are transparent
   * to this check.
   * @param id - the scoped construct ID.
   */
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const ownerResource = AncestorWalker.findNearest(
      this,
      Resource.isResource,
      Stack.isStack,
    );
    if (!ownerResource) {
      throw new Error(
        `Component '${this.node.path}' must descend from a Resource before reaching a Stack. ` +
          `A Component can never hang directly off a Stack.`,
      );
    }
  }
}
