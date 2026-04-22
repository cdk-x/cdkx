import { IConstruct } from 'constructs';
import { Acknowledgements } from '../acknowledgements/acknowledgements';

/**
 * API for attaching annotations (info, warnings, errors) to constructs.
 * Annotations are stored in construct metadata and displayed during synthesis.
 */
export class Annotations {
  private static readonly cache = new WeakMap<IConstruct, Annotations>();

  /**
   * Returns the Annotations API for a construct scope.
   */
  public static of(scope: IConstruct): Annotations {
    const existing = Annotations.cache.get(scope);
    if (existing) {
      return existing;
    }

    const fresh = new Annotations(scope);
    Annotations.cache.set(scope, fresh);
    return fresh;
  }

  /**
   * Checks if an ID is acknowledged for a construct scope.
   * Searches parent scopes as well (parent acknowledgement applies to children).
   */
  public static isAcknowledged(scope: IConstruct, id: string): boolean {
    return Acknowledgements.of(scope).has(scope, id);
  }

  private constructor(private readonly scope: IConstruct) {}

  /**
   * Acknowledges a warning/info ID for this construct scope.
   * Acknowledged annotations will be filtered out during synthesis.
   * Also removes existing annotations with this ID from the construct tree.
   */
  public acknowledge(id: string, _reason?: string): void {
    // Register acknowledgement in the singleton
    Acknowledgements.of(this.scope).add(this.scope, id);

    // Remove existing warnings with this ID from the tree
    this.removeWarningDeep(this.scope, id);
  }

  /**
   * Removes warning metadata with the given ID from all constructs in scope.
   */
  private removeWarningDeep(construct: IConstruct, id: string): void {
    const stack: IConstruct[] = [construct];

    while (stack.length > 0) {
      const next = stack.pop()!;
      this.removeWarning(next, id);
      stack.push(...next.node.children);
    }
  }

  /**
   * Removes warning metadata with the given ID from a single construct.
   */
  private removeWarning(construct: IConstruct, id: string): void {
    const meta = (construct.node as unknown as { _metadata?: Array<{ type: string; data: unknown }> })._metadata;
    if (!meta) {
      return;
    }

    const ackTag = `[ack: ${id}]`;
    let i = 0;
    while (i < meta.length) {
      const m = meta[i];
      if (m.type === 'warning' && typeof m.data === 'string' && m.data.includes(ackTag)) {
        meta.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  /**
   * Clears all annotations from a construct. Useful for tests.
   */
  public static clear(scope: IConstruct): void {
    const metadata = scope.node.metadata;
    // Remove annotation entries (info, warning, error types)
    const filtered = metadata.filter(
      (m) => m.type !== 'info' && m.type !== 'warning' && m.type !== 'error',
    );
    // Replace metadata array
    (scope.node as unknown as { _metadata: unknown[] })._metadata = filtered;
  }

  /**
   * Adds an info annotation to this construct.
   * Info messages are displayed during synthesis for informational purposes.
   * If the ID is acknowledged, the message is not added.
   */
  public addInfo(id: string, message: string): void {
    if (!Acknowledgements.of(this.scope).has(this.scope, id)) {
      this.addMessage('info', `${message} [ack: ${id}]`);
    }
  }

  /**
   * Adds a warning annotation to this construct.
   * Warnings are displayed during synthesis but do not fail.
   * If the ID is acknowledged, the message is not added.
   */
  public addWarning(id: string, message: string): void {
    if (!Acknowledgements.of(this.scope).has(this.scope, id)) {
      this.addMessage('warning', `${message} [ack: ${id}]`);
    }
  }

  /**
   * Adds an error annotation to this construct.
   * Errors are displayed during synthesis and cause synthesis to fail.
   * Errors cannot be acknowledged.
   */
  public addError(message: string): void {
    this.addMessage('error', message);
  }

  private addMessage(level: string, message: string): void {
    // Deduplication: check if identical message already exists
    const existing = this.scope.node.metadata.find(
      (m) => m.type === level && m.data === message,
    );
    if (existing) {
      return;
    }

    this.scope.node.addMetadata(level, message);
  }
}
