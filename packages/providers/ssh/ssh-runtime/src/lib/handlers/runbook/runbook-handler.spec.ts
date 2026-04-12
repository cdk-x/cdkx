import { RuntimeContext } from '@cdk-x/core';
import type { SshConnection, SshSdk } from '../../ssh-sdk-facade';
import { SshRunbookHandler } from './runbook-handler';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeContext(sdk: SshSdk): RuntimeContext<SshSdk> {
  return {
    sdk,
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      child: jest.fn(),
    },
    stabilizeConfig: { intervalMs: 100, timeoutMs: 5000 },
  } as unknown as RuntimeContext<SshSdk>;
}

function makeSdk(overrides?: Partial<SshSdk>): SshSdk {
  const mockConnection: SshConnection = {
    execute: jest.fn(),
    nohupExecute: jest.fn(),
    checkJobStatus: jest.fn(),
    disconnect: jest.fn().mockResolvedValue(undefined),
  };
  return {
    connect: jest.fn().mockResolvedValue(mockConnection),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SshRunbookHandler', () => {
  describe('create()', () => {
    it('connects to the host and returns state with connection details', async () => {
      const sdk = makeSdk();
      const ctx = makeContext(sdk);
      const handler = new SshRunbookHandler();

      const state = await handler.create(ctx, {
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });

      expect(sdk.connect).toHaveBeenCalledWith({
        host: '1.2.3.4',
        port: undefined,
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });
      expect(state.host).toBe('1.2.3.4');
      expect(state.user).toBe('ubuntu');
      expect(state.privateKeyPath).toBe('/keys/id_rsa');
      expect(state.executionId).toBeDefined();
    });

    it('throws immediately with a clear error when SSH connectivity fails', async () => {
      const sdk = makeSdk({
        connect: jest.fn().mockRejectedValue(new Error('Connection refused')),
      });
      const ctx = makeContext(sdk);
      const handler = new SshRunbookHandler();

      await expect(
        handler.create(ctx, {
          host: '1.2.3.4',
          user: 'ubuntu',
          privateKeyPath: '/keys/id_rsa',
        }),
      ).rejects.toThrow('Connection refused');
    });

    it('disconnects after validating connectivity', async () => {
      const mockDisconnect = jest.fn().mockResolvedValue(undefined);
      const sdk = makeSdk({
        connect: jest.fn().mockResolvedValue({
          execute: jest.fn(),
          nohupExecute: jest.fn(),
          checkJobStatus: jest.fn(),
          disconnect: mockDisconnect,
        }),
      });
      const ctx = makeContext(sdk);
      const handler = new SshRunbookHandler();

      await handler.create(ctx, {
        host: '1.2.3.4',
        user: 'ubuntu',
        privateKeyPath: '/keys/id_rsa',
      });

      expect(mockDisconnect).toHaveBeenCalled();
    });
  });
});
