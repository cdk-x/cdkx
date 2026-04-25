/**
 * Log levels following standard severity hierarchy.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log source identifier indicating which subsystem emitted the event.
 */
export type LogSource = 'engine' | 'provider' | 'core';

/**
 * Standardized log event structure.
 * All events follow this shape for consistent parsing and analysis.
 */
export interface LogEvent {
  /**
   * ISO 8601 timestamp - generated automatically by the logger.
   */
  timestamp: string;

  /**
   * Severity level of the event.
   */
  level: LogLevel;

  /**
   * Source subsystem that emitted this event.
   */
  source: LogSource;

  /**
   * Namespaced event type following the pattern: {source}.{category}.{action}
   *
   * Examples:
   * - engine.state.stack.transition
   * - engine.state.resource.transition
   * - engine.deployment.start
   * - provider.http.request
   * - provider.http.response
   * - provider.http.error
   * - provider.action.poll.start
   */
  type: string;

  /**
   * Stack identifier - always present.
   */
  stackId: string;

  /**
   * Resource logical ID - always present.
   * For stack-level events, this equals stackId.
   */
  resourceId: string;

  /**
   * Event-specific payload with flexible structure.
   */
  data: Record<string, unknown>;

  /**
   * Error details - only present when level='error'.
   */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Context bound to a child logger instance.
 * Automatically injected into all log events emitted by that logger.
 */
export interface LogContext {
  /**
   * Stack identifier to bind to this logger.
   */
  stackId: string;

  /**
   * Optional resource identifier.
   * If not provided, defaults to stackId for stack-level logging.
   */
  resourceId?: string;
}

/**
 * Event data payload passed to log methods.
 * stackId and resourceId are optional when using a child logger with bound context.
 */
export interface LogEventData {
  stackId?: string;
  resourceId?: string;
  [key: string]: unknown;
}

/**
 * Logger interface for emitting structured log events.
 */
export interface Logger {
  /**
   * Emit a debug-level event.
   */
  debug(type: string, data: LogEventData): void;

  /**
   * Emit an info-level event.
   */
  info(type: string, data: LogEventData): void;

  /**
   * Emit a warning-level event.
   */
  warn(type: string, data: LogEventData): void;

  /**
   * Emit an error-level event.
   */
  error(type: string, data: LogEventData, error?: Error): void;

  /**
   * Create a child logger with bound context.
   * All events from the child automatically include the bound stackId/resourceId.
   */
  child(context: LogContext): Logger;

  /**
   * Close the logger and flush all pending writes.
   * Must be called when the logger is no longer needed to release open file handles.
   */
  close?(): Promise<void>;
}

/**
 * Options for creating a logger instance.
 */
export interface LoggerOptions {
  /**
   * Directory where log files will be written.
   * Default: '.cdkx' relative to process.cwd()
   */
  logDir?: string;

  /**
   * Minimum log level to emit.
   * Events below this level are filtered out.
   * Default: 'info'
   */
  level?: LogLevel;

  /**
   * Maximum number of log files to retain.
   * Older files are automatically deleted.
   * Default: 50
   */
  maxFiles?: number;

  /**
   * Source identifier for all events emitted by this logger.
   * Default: 'engine'
   */
  source?: LogSource;
}
