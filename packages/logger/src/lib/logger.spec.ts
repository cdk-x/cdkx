import { LoggerFactory, LoggerImpl } from './logger';
import type { Logger } from './types';
import * as winston from 'winston';

describe('LoggerImpl', () => {
  let mockWinstonLogger: winston.Logger;
  let logger: Logger;

  beforeEach(() => {
    // Create a spy on winston logger
    mockWinstonLogger = {
      log: jest.fn(),
    } as unknown as winston.Logger;

    logger = new LoggerImpl(mockWinstonLogger, 'engine');
  });

  describe('debug', () => {
    it('should emit debug-level event', () => {
      logger.debug('engine.test.event', {
        stackId: 'TestStack',
        resourceId: 'TestResource',
        foo: 'bar',
      });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('debug', {
        timestamp: expect.any(String),
        level: 'debug',
        source: 'engine',
        type: 'engine.test.event',
        stackId: 'TestStack',
        resourceId: 'TestResource',
        data: { foo: 'bar' },
      });
    });
  });

  describe('info', () => {
    it('should emit info-level event', () => {
      logger.info('engine.test.event', {
        stackId: 'TestStack',
        resourceId: 'TestResource',
      });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', {
        timestamp: expect.any(String),
        level: 'info',
        source: 'engine',
        type: 'engine.test.event',
        stackId: 'TestStack',
        resourceId: 'TestResource',
        data: {},
      });
    });
  });

  describe('warn', () => {
    it('should emit warn-level event', () => {
      logger.warn('engine.test.warning', {
        stackId: 'TestStack',
        resourceId: 'TestResource',
        reason: 'test warning',
      });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('warn', {
        timestamp: expect.any(String),
        level: 'warn',
        source: 'engine',
        type: 'engine.test.warning',
        stackId: 'TestStack',
        resourceId: 'TestResource',
        data: { reason: 'test warning' },
      });
    });
  });

  describe('error', () => {
    it('should emit error-level event with error details', () => {
      const error = new Error('Test error');
      logger.error(
        'engine.test.failure',
        {
          stackId: 'TestStack',
          resourceId: 'TestResource',
        },
        error,
      );

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('error', {
        timestamp: expect.any(String),
        level: 'error',
        source: 'engine',
        type: 'engine.test.failure',
        stackId: 'TestStack',
        resourceId: 'TestResource',
        data: {},
        error: {
          message: 'Test error',
          code: undefined,
          stack: expect.any(String),
        },
      });
    });

    it('should emit error-level event without error object', () => {
      logger.error('engine.test.failure', {
        stackId: 'TestStack',
        resourceId: 'TestResource',
        reason: 'Unknown failure',
      });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('error', {
        timestamp: expect.any(String),
        level: 'error',
        source: 'engine',
        type: 'engine.test.failure',
        stackId: 'TestStack',
        resourceId: 'TestResource',
        data: { reason: 'Unknown failure' },
      });
    });
  });

  describe('child', () => {
    it('should create child logger with bound context', () => {
      const childLogger = logger.child({
        stackId: 'ChildStack',
        resourceId: 'ChildResource',
      });

      childLogger.info('engine.test.event', { foo: 'bar' });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', {
        timestamp: expect.any(String),
        level: 'info',
        source: 'engine',
        type: 'engine.test.event',
        stackId: 'ChildStack',
        resourceId: 'ChildResource',
        data: { foo: 'bar' },
      });
    });

    it('should use stackId as resourceId when resourceId not provided in context', () => {
      const childLogger = logger.child({ stackId: 'StackOnly' });

      childLogger.info('engine.test.event', {});

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', {
        timestamp: expect.any(String),
        level: 'info',
        source: 'engine',
        type: 'engine.test.event',
        stackId: 'StackOnly',
        resourceId: 'StackOnly',
        data: {},
      });
    });

    it('should allow overriding bound context in data', () => {
      const childLogger = logger.child({
        stackId: 'BoundStack',
        resourceId: 'BoundResource',
      });

      childLogger.info('engine.test.event', {
        stackId: 'OverrideStack',
        resourceId: 'OverrideResource',
      });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', {
        timestamp: expect.any(String),
        level: 'info',
        source: 'engine',
        type: 'engine.test.event',
        stackId: 'OverrideStack',
        resourceId: 'OverrideResource',
        data: {},
      });
    });
  });

  describe('missing context', () => {
    it('should use "unknown" when stackId is missing', () => {
      logger.info('engine.test.event', {});

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', {
        timestamp: expect.any(String),
        level: 'info',
        source: 'engine',
        type: 'engine.test.event',
        stackId: 'unknown',
        resourceId: 'unknown',
        data: {},
      });
    });

    it('should use stackId as resourceId when resourceId is missing', () => {
      logger.info('engine.test.event', { stackId: 'TestStack' });

      expect(mockWinstonLogger.log).toHaveBeenCalledWith('info', {
        timestamp: expect.any(String),
        level: 'info',
        source: 'engine',
        type: 'engine.test.event',
        stackId: 'TestStack',
        resourceId: 'TestStack',
        data: {},
      });
    });
  });
});

describe('LoggerFactory', () => {
  describe('createEngineLogger', () => {
    it('should create a logger with default options', () => {
      const logger = LoggerFactory.createEngineLogger();
      expect(logger).toBeInstanceOf(LoggerImpl);
    });

    it('should create a logger with custom options', () => {
      const logger = LoggerFactory.createEngineLogger({
        logDir: '/tmp/custom-logs',
        level: 'debug',
        maxFiles: 10,
        source: 'provider',
      });
      expect(logger).toBeInstanceOf(LoggerImpl);
    });
  });
});
