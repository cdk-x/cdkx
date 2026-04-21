/**
 * Represents a single annotation entry.
 */
export interface AnnotationEntry {
  /** Severity level of the annotation */
  readonly level: 'info' | 'warning' | 'error';

  /** The message content */
  readonly message: string;

  /** Optional ID for acknowledgeable annotations (extracted from [ack: id] tag) */
  readonly id?: string;

  /** Path of the construct that owns this annotation */
  readonly constructPath: string;
}
