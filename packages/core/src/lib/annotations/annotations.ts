import { IConstruct } from 'constructs';

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

  private constructor(private readonly scope: IConstruct) {}

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
   */
  public addInfo(id: string, message: string): void {
    this.addMessage('info', `${message} [ack: ${id}]`);
  }

  /**
   * Adds a warning annotation to this construct.
   * Warnings are displayed during synthesis but do not fail.
   */
  public addWarning(id: string, message: string): void {
    this.addMessage('warning', `${message} [ack: ${id}]`);
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
