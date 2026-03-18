/**
 * Logger interface for the provider runtime layer.
 *
 * Decoupled from `@cdkx-io/logger` so that provider packages have no
 * compile-time dependency on the concrete logger implementation.
 * `LoggerImpl` from `@cdkx-io/logger` satisfies this interface
 * structurally — no adapter needed.
 */
export interface RuntimeLogger {
  debug(type: string, data: Record<string, unknown>): void;
  info(type: string, data: Record<string, unknown>): void;
  warn(type: string, data: Record<string, unknown>): void;
  error(type: string, data: Record<string, unknown>, error?: Error): void;
  child(context: Record<string, unknown>): RuntimeLogger;
}
