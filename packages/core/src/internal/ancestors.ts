import { IConstruct } from 'constructs';

/**
 * Generic ancestor-chain walker, shared by every "find my nearest X"
 * lookup in @cdk-x/core (Resource/Component containment validation,
 * Resource.of() dependency resolution). Deliberately knows nothing about
 * Resource, Component, or Stack — callers pass in their own predicates,
 * so this file never needs to import those classes.
 */
export class AncestorWalker {
  private constructor() {} // no instances — static-only class

  /**
   * Walks up from `construct`'s parent (not `construct` itself) via
   * `node.scope`, returning the nearest ancestor for which `isMatch`
   * returns true. Stops walking (returning `undefined`) once `stopAt`
   * returns true for the current node, or once the root is reached
   * (`node.scope` is undefined).
   *
   * `stopAt` is checked BEFORE `isMatch` at each step, so an ancestor
   * that satisfies both predicates is treated as the stop boundary, not
   * a match — this matters for e.g. "find nearest Resource before the
   * Stack", where Stack itself should never be considered a match.
   *
   * @param construct - the construct to start walking up from; never
   * itself considered as a candidate.
   * @param isMatch - type guard identifying a valid ancestor; narrows the
   * return type to `T`.
   * @param stopAt - identifies a boundary ancestor at which the walk
   * must abort, checked before `isMatch` on every node.
   * @returns the nearest matching ancestor, or `undefined` if none is
   * found before a `stopAt` boundary or the root.
   * @example
   * ```ts
   * const nearestResource = AncestorWalker.findNearest(
   *   component,
   *   (c): c is Resource => c instanceof Resource,
   *   (c) => c instanceof Stack,
   * );
   * ```
   */
  public static findNearest<T extends IConstruct>(
    construct: IConstruct,
    isMatch: (candidate: IConstruct) => candidate is T,
    stopAt: (candidate: IConstruct) => boolean,
  ): T | undefined {
    let current: IConstruct | undefined = construct.node.scope as
      IConstruct | undefined;

    while (current) {
      if (stopAt(current)) {
        return undefined;
      }
      if (isMatch(current)) {
        return current;
      }
      current = current.node.scope as IConstruct | undefined;
    }

    return undefined;
  }
}
