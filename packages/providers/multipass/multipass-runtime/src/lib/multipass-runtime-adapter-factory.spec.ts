import { RuntimeLogger } from '@cdk-x/core';
import { RuntimeAdapter } from '@cdk-x/engine';
import type { MultipassSdk } from './multipass-cli-facade';
import {
  MultipassRuntimeAdapterFactory,
  MultipassRuntimeAdapterFactoryDeps,
} from './multipass-runtime-adapter-factory';
import { MultipassProviderRuntime } from './multipass-provider-runtime';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stubSdk(): MultipassSdk {
  return {
    assertInstalled: jest.fn().mockResolvedValue(undefined),
    launch: jest.fn(),
    info: jest.fn(),
    delete: jest.fn(),
  } as unknown as MultipassSdk;
}

function stubLogger(): RuntimeLogger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function defaultDeps(
  overrides: Partial<MultipassRuntimeAdapterFactoryDeps> = {},
): MultipassRuntimeAdapterFactoryDeps {
  return {
    checkInstalled: jest.fn(), // no-op — multipass is "installed"
    createCli: jest.fn().mockReturnValue(stubSdk()),
    createRuntime: jest.fn().mockReturnValue(new MultipassProviderRuntime()),
    createLogger: jest.fn().mockReturnValue(stubLogger()),
    resourceConfigs: {
      'Multipass::Compute::Instance': {
        physicalIdKey: 'name',
        createOnlyProps: new Set(['name', 'image', 'cpus']),
      },
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MultipassRuntimeAdapterFactory', () => {
  describe('providerId', () => {
    it('is "multipass"', () => {
      const factory = new MultipassRuntimeAdapterFactory(defaultDeps());
      expect(factory.providerId).toBe('multipass');
    });
  });

  describe('constructor', () => {
    it('calls checkInstalled() at construction time', () => {
      const checkInstalled = jest.fn();
      new MultipassRuntimeAdapterFactory(defaultDeps({ checkInstalled }));
      expect(checkInstalled).toHaveBeenCalledTimes(1);
    });

    it('throws immediately if checkInstalled throws', () => {
      const checkInstalled = jest.fn(() => {
        throw new Error('Multipass is not installed or not on PATH');
      });

      expect(
        () => new MultipassRuntimeAdapterFactory(defaultDeps({ checkInstalled })),
      ).toThrow(/multipass is not installed/i);
    });
  });

  describe('create()', () => {
    it('returns a RuntimeAdapter', () => {
      const factory = new MultipassRuntimeAdapterFactory(defaultDeps());
      const adapter = factory.create();
      expect(adapter).toBeInstanceOf(RuntimeAdapter);
    });
  });
});
