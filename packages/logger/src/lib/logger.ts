import * as winston from 'winston';
import type {
  Logger,
  LoggerOptions,
  LogLevel,
  LogSource,
  LogContext,
  LogEventData,
} from './types';
import { JsonFormatter } from './formatters/json-formatter';
import { FileTransport } from './transports/file-transport';

/**
 * Winston-based logger implementation following the Logger interface.
 */
export class LoggerImpl implements Logger {
  private readonly winstonLogger: winston.Logger;
  private readonly source: LogSource;
  private readonly boundContext?: LogContext;

  constructor(
    winstonLogger: winston.Logger,
    source: LogSource,
    boundContext?: LogContext,
  ) {
    this.winstonLogger = winstonLogger;
    this.source = source;
    this.boundContext = boundContext;
  }

  debug(type: string, data: LogEventData): void {
    this.log('debug', type, data);
  }

  info(type: string, data: LogEventData): void {
    this.log('info', type, data);
  }

  warn(type: string, data: LogEventData): void {
    this.log('warn', type, data);
  }

  error(type: string, data: LogEventData, error?: Error): void {
    this.log('error', type, data, error);
  }

  child(context: LogContext): Logger {
    return new LoggerImpl(this.winstonLogger, this.source, context);
  }

  close(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.winstonLogger.end(resolve);
    });
  }

  /**
   * Internal log method that constructs the Winston log entry.
   */
  private log(
    level: LogLevel,
    type: string,
    data: LogEventData,
    error?: Error,
  ): void {
    // Merge bound context with provided data
    const stackId = data.stackId ?? this.boundContext?.stackId ?? 'unknown';
    const resourceId =
      data.resourceId ??
      this.boundContext?.resourceId ??
      this.boundContext?.stackId ??
      stackId;

    // Extract stackId/resourceId from data for the data payload
    const { stackId: _s, resourceId: _r, ...restData } = data;

    const logEntry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      source: this.source,
      type,
      stackId,
      resourceId,
      data: restData,
    };

    if (error) {
      logEntry.error = {
        message: error.message,
        code: (error as NodeJS.ErrnoException).code,
        stack: error.stack,
      };
    }

    this.winstonLogger.log(level, logEntry);
  }
}

/**
 * Factory for creating logger instances with proper configuration.
 */
export class LoggerFactory {
  /**
   * Create a logger suitable for use by the DeploymentEngine.
   *
   * @param options - Configuration options
   * @returns Logger instance
   */
  static createEngineLogger(options: LoggerOptions = {}): Logger {
    const logDir = options.logDir ?? '.cdkx';
    const level = options.level ?? 'info';
    const maxFiles = options.maxFiles ?? 50;
    const source = options.source ?? 'engine';

    // Create combined format: timestamp + custom JSON formatter
    const format = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
      JsonFormatter.create(),
    );

    // Create file transport with rotation
    const fileTransport = new FileTransport({
      logDir,
      maxFiles,
      format,
    });

    // Create Winston logger instance
    const winstonLogger = winston.createLogger({
      level,
      transports: [fileTransport.getTransport()],
      // Do not log to console - CLI handles stdout
      silent: false,
    });

    return new LoggerImpl(winstonLogger, source);
  }
}
