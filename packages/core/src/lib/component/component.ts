import { Construct } from 'constructs';
import { AncestorWalker } from '../../internal/ancestors.js';
import { Resource } from '../resource/resource.js';
import { Stack } from '../stack/stack.js';

/**
 * Base class for structural, non-deployable pieces of a Resource's shape
 * (e.g. a Step inside a Job, a Task inside an Ansible Play). A Component
 * has no lifecycle of its own and never gets its own manifest entry — it
 * must always descend, directly or indirectly, from a Resource before
 * reaching a Stack. An owning Resource (or an intermediate Component)
 * inlines its Component descendants by walking `node.children`, filtering
 * with `Component.isComponent()`, and calling `_toProperties()` on each.
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

  /**
   * Returns this Component's own properties, serialized. Mirrors
   * `Resource.toProperties()` — subclasses are responsible for walking
   * their own `node.children` to collect and inline any further Component
   * descendants under whatever property key makes sense for their output
   * format; core has no opinion on this.
   */
  protected abstract toProperties(): Record<string, unknown>;

  /**
   * Internal hook used by an owning Resource or Component to read this
   * Component's raw properties while inlining it. Not part of the public
   * API surface — the `@internal` tag causes this member to be stripped
   * from generated multi-language bindings.
   *
   * @internal
   */
  public _toProperties(): Record<string, unknown> {
    return this.toProperties();
  }
}
