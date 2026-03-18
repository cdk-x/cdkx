import * as winston from 'winston';
import type { LogEvent } from '../types';

/**
 * Custom Winston formatter that outputs LogEvent as JSON newline-delimited format.
 */
export class JsonFormatter {
  static create(): winston.Logform.Format {
    return winston.format.printf((info: Record<string, unknown>) => {
      const logEvent: LogEvent = {
        timestamp: info.timestamp as string,
        level: info.level as LogEvent['level'],
        source: info.source as LogEvent['source'],
        type: info.type as string,
        stackId: info.stackId as string,
        resourceId: info.resourceId as string,
        data: info.data as Record<string, unknown>,
      };

      if (info.error) {
        logEvent.error = info.error as LogEvent['error'];
      }

      return JSON.stringify(logEvent);
    });
  }
}
