import { Construct } from 'constructs';
import { IResolvable } from '../resolvables/resolvables';

/**
 * Properties for a `StackOutput` construct.
 */
export interface StackOutputProps {
  /**
   * The value to export from this stack.
   * May be a literal string/number, or an `IResolvable` token that will be
   * resolved at synthesis time (e.g. a `ResourceAttribute` from another
   * resource in the same stack).
   */
  readonly value: IResolvable | string | number;

  /**
   * Optional human-readable description for this output.
   */
  readonly description?: string;
}

/**
 * Declares a named output for a `Stack`.
 *
 * Stack outputs serve two purposes:
 * 1. They are written into the synthesized stack JSON under an `"outputs"` key,
 *    so the deployment engine can surface them after the stack is deployed.
 * 2. They are listed in `manifest.json` so the engine can discover cross-stack
 *    dependencies without reading each stack template.
 *
 * @example
 * const server = new NtvHetznerServer(stack, 'Server', { ... });
 * new StackOutput(stack, 'ServerId', {
 *   value: server.attrServerId,
 *   description: 'The Hetzner server ID',
 * });
 */
export class StackOutput extends Construct {
  /**
   * Returns `true` if the given object is a `StackOutput` instance.
   */
  public static isStackOutput(x: unknown): x is StackOutput {
    return x instanceof StackOutput;
  }

  /** The export key — equal to the construct `id`. */
  public readonly outputKey: string;

  /** The value to export. May be an `IResolvable` token. */
  public readonly value: IResolvable | string | number;

  /** Optional description. */
  public readonly description?: string;

  constructor(scope: Construct, id: string, props: StackOutputProps) {
    super(scope, id);
    this.outputKey = id;
    this.value = props.value;
    this.description = props.description;
  }

  /**
   * Returns an `IResolvable` token that can be used as a resource property in
   * another stack. At deploy time the engine substitutes the token with the
   * real runtime value of this output after the source stack has deployed.
   *
   * Using `importValue()` in a consuming stack automatically infers a
   * stack-level dependency — no manual `addDependency` call is required.
   */
  public importValue(): IResolvable {
    // Lazy require to avoid circular dependency: stack-output ← stack ← stack-output
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Stack } =
      require('../stack/stack') as typeof import('../stack/stack');
    const artifactId = Stack.of(this).artifactId;
    const key = this.outputKey;
    return { resolve: () => ({ stackRef: artifactId, outputKey: key }) };
  }
}
