import { Construct, IConstruct } from 'constructs';
import { AncestorWalker } from '../../internal/ancestors.js';
import type { IResolvable, PropertyValue } from '../resolvable/resolvable.js';
import { Stack } from '../stack/stack.js';

// Module-private placeholder returned by Resource.getAtt() — resolves to the
// synthesized-manifest reference form, never a real deployed value.
class ResourceAttribute implements IResolvable {
  constructor(
    private readonly logicalId: string,
    private readonly attr: string,
  ) {}

  resolve(): unknown {
    return { ref: this.logicalId, attr: this.attr };
  }
}

/**
 * Base class for anything that synthesizes into a deployable unit. Resources
 * must be siblings under the same Stack — connected via addDependency(),
 * never nested inside one another.
 */
export abstract class Resource extends Construct {
  /**
   * Type guard for Resource.
   *
   * @param x - the value to test.
   * @returns true if `x` is a Resource, narrowing its type.
   * @example
   * ```ts
   * if (Resource.isResource(construct)) {
   *   // construct is now typed as Resource
   * }
   * ```
   */
  public static isResource(x: unknown): x is Resource {
    return x instanceof Resource;
  }

  /**
   * Resolves the nearest Resource for a given construct — itself, if it
   * already is one, otherwise its nearest Resource ancestor (stopping at
   * the Stack boundary). Used by synth() to resolve dependencies declared
   * on a Component to the Resource that actually owns it.
   *
   * @param construct - the construct to resolve the owning Resource for.
   * @returns the owning Resource.
   * @example
   * ```ts
   * const resource = Resource.of(someComponent);
   * ```
   */
  public static of(construct: IConstruct): Resource {
    if (Resource.isResource(construct)) return construct;
    const found = AncestorWalker.findNearest(
      construct,
      Resource.isResource,
      Stack.isStack,
    );
    if (!found) {
      throw new Error(
        `No Resource found for construct at path '${construct.node.path}'. ` +
          `Make sure it descends from a Resource.`,
      );
    }
    return found;
  }

  /**
   * The resource type identifier, e.g. a CloudFormation-style type name.
   */
  public abstract readonly type: string;

  /**
   * @param scope - the construct this Resource is defined within.
   * @param id - the scoped construct ID.
   */
  constructor(scope: Construct, id: string) {
    super(scope, id);

    const parentResource = AncestorWalker.findNearest(
      this,
      Resource.isResource,
      Stack.isStack,
    );
    if (parentResource) {
      throw new Error(
        `Resource '${this.node.path}' cannot be nested inside another Resource ` +
          `('${parentResource.node.path}'). Resources must be siblings under the same Stack, ` +
          `connected via addDependency(), not nesting.`,
      );
    }
  }

  /**
   * Returns a lazy reference to one of this Resource's runtime attributes.
   *
   * @param attr - the attribute name.
   * @returns an IResolvable that resolves to the synthesized reference form.
   * @example
   * ```ts
   * const arn = bucket.getAtt('arn');
   * ```
   */
  public getAtt(attr: string): IResolvable {
    return new ResourceAttribute(this.node.path, attr);
  }

  /**
   * Typed convenience wrapper over constructs' own node.addDependency().
   * Only accepts another Resource (by type) — enforces the cross-stack
   * veto here. Dependencies declared on a Component via the raw
   * node.addDependency() API are resolved to their owning Resource later,
   * in synth() (see Resource.of()), not here.
   *
   * @param target - the Resource this Resource depends on. Must belong to
   * the same Stack.
   */
  public addDependency(target: Resource): void {
    const myStack = Stack.of(this);
    const targetStack = Stack.of(target);
    if (myStack !== targetStack) {
      throw new Error(
        `Cannot add dependency: '${this.node.path}' (Stack '${myStack.node.path}') ` +
          `cannot depend on '${target.node.path}' (Stack '${targetStack.node.path}'). ` +
          `Cross-stack dependencies are not supported yet — move both to the same Stack.`,
      );
    }
    this.node.addDependency(target);
  }

  /**
   * Returns this Resource's own properties, serialized. Subclasses are
   * responsible for walking their own `node.children` to collect and
   * inline any Component descendants under whatever property key makes
   * sense for their output format (e.g. Steps under "steps") — core has
   * no opinion on this.
   */
  protected abstract toProperties(): Record<string, PropertyValue>;

  /**
   * Internal hook used by Synthesizer to read this Resource's raw
   * properties during App.synth(). Not part of the public API surface.
   * Once jsii tooling is added (planned), this tag will cause the member
   * to be stripped from generated multi-language bindings. For now, it
   * documents intent.
   *
   * @internal
   */
  public _toProperties(): Record<string, PropertyValue> {
    return this.toProperties();
  }
}
