import { RuntimeAdapter } from '@cdk-x/engine';
import {
  SshRuntimeAdapterFactory,
  type SshRuntimeAdapterFactoryDeps,
} from './ssh-runtime-adapter-factory';
import { SshProviderRuntime } from './ssh-provider-runtime';
import type { SshSdk } from './ssh-sdk-facade';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stubSdk(): SshSdk {
  return { connect: jest.fn() };
}

function defaultDeps(
  overrides: Partial<SshRuntimeAdapterFactoryDeps> = {},
): SshRuntimeAdapterFactoryDeps {
  return {
    createSdk: jest.fn().mockReturnValue(stubSdk()),
    createRuntime: jest.fn().mockReturnValue(new SshProviderRuntime()),
    resourceConfigs: {
      'SSH::Exec::Runbook': { physicalIdKey: 'executionId' },
    },
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SshRuntimeAdapterFactory', () => {
  describe('providerId', () => {
    it('is "ssh"', () => {
      expect(new SshRuntimeAdapterFactory().providerId).toBe('ssh');
    });
  });

  describe('create()', () => {
    it('returns a RuntimeAdapter', () => {
      const factory = new SshRuntimeAdapterFactory(defaultDeps());
      expect(factory.create({})).toBeInstanceOf(RuntimeAdapter);
    });

    it('works with no deps at all (all defaults)', () => {
      const factory = new SshRuntimeAdapterFactory();
      expect(factory.create({})).toBeInstanceOf(RuntimeAdapter);
    });
  });
});
