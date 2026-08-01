import { Construct, IConstruct } from 'constructs';
import type { App } from '../app/app.js';
import { Resource } from '../resource/resource.js';

/**
 * A deployable unit of the construct tree. Resources live directly under a
 * Stack (possibly through intermediate organizational Constructs), never
 * nested inside one another.
 */
export class Stack extends Construct {
  /**
   * Type guard for Stack.
   *
   * @param x - the value to test.
   * @returns true if `x` is a Stack, narrowing its type.
   * @example
   * if (Stack.isStack(scope)) {
   *   // scope is now typed as Stack
   * }
   */
  public static isStack(x: unknown): x is Stack {
    return x instanceof Stack;
  }

  /**
   * Resolves the Stack that owns a given construct — itself, if it already
   * is a Stack, otherwise its nearest Stack ancestor.
   *
   * This intentionally does not reuse `AncestorWalker.findNearest()`: that
   * helper's contract deliberately excludes the starting construct from
   * consideration, but `Stack.of()` must treat the starting construct as a
   * valid result when it is already a Stack (self-inclusive) — a shape that
   * doesn't fit `findNearest`'s generic contract, so it gets its own short
   * loop instead.
   *
   * @param construct - the construct to resolve the owning Stack for.
   * @returns the owning Stack.
   * @example
   * const stack = Stack.of(someResource);
   */
  public static of(construct: IConstruct): Stack {
    if (Stack.isStack(construct)) return construct;
    let current: IConstruct | undefined = construct.node.scope as
      IConstruct | undefined;
    while (current) {
      if (Stack.isStack(current)) return current;
      current = current.node.scope as IConstruct | undefined;
    }
    throw new Error(
      `No Stack found for construct at path '${construct.node.path}'. ` +
        `Make sure it descends from a Stack.`,
    );
  }

  /**
   * @param scope - the App this Stack belongs to.
   * @param id - the scoped construct ID.
   */
  constructor(scope: App, id: string) {
    super(scope, id);
  }

  /**
   * Returns all Resources descending from this Stack, including those
   * nested under intermediate organizational Constructs.
   */
  public resources(): Resource[] {
    return this.node.findAll().filter(Resource.isResource);
  }
}
