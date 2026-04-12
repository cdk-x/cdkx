import { RuntimeContext } from '@cdk-x/core';
import type { SshConnection, SshSdk } from '../../ssh-sdk-facade';
import { SshPackageHandler } from './package-handler';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BASE_PROPS = {
  packageName: 'nginx',
  runbookId: 'runbook-123',
  host: '1.2.3.4',
  user: 'ubuntu',
  privateKeyPath: '/keys/id_rsa',
};

function makeConnection(overrides?: Partial<SshConnection>): SshConnection {
  return {
    execute: jest.fn().mockResolvedValue({ stdout: '', stderr: '', code: 0 }),
    nohupExecute: jest.fn().mockResolvedValue(undefined),
    checkJobStatus: jest.fn().mockResolvedValue('done'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeSdk(connection?: SshConnection): SshSdk {
  return {
    connect: jest.fn().mockResolvedValue(connection ?? makeConnection()),
  };
}

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
    stabilizeConfig: { intervalMs: 50, timeoutMs: 2000 },
  } as unknown as RuntimeContext<SshSdk>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SshPackageHandler', () => {
  describe('get()', () => {
    it('throws when dpkg reports the package is not installed', async () => {
      const connection = makeConnection({
        execute: jest
          .fn()
          .mockResolvedValue({ stdout: '', stderr: 'dpkg: error', code: 1 }),
      });
      const ctx = makeContext(makeSdk(connection));
      const handler = new SshPackageHandler();

      await expect(handler.get(ctx, BASE_PROPS)).rejects.toThrow();
    });

    it('returns state when dpkg confirms the package is installed', async () => {
      const connection = makeConnection({
        execute: jest.fn().mockResolvedValue({
          stdout: 'ii  nginx',
          stderr: '',
          code: 0,
        }),
      });
      const ctx = makeContext(makeSdk(connection));
      const handler = new SshPackageHandler();

      const state = await handler.get(ctx, BASE_PROPS);

      expect(connection.execute).toHaveBeenCalledWith(
        expect.stringContaining('dpkg -l nginx'),
      );
      expect(state.packageName).toBe('nginx');
    });
  });

  describe('create()', () => {
    it('launches nohup install and polls until stabilized', async () => {
      const connection = makeConnection({
        checkJobStatus: jest.fn().mockResolvedValue('done'),
      });
      const sdk = makeSdk(connection);
      const ctx = makeContext(sdk);
      const handler = new SshPackageHandler();

      const state = await handler.create(ctx, BASE_PROPS);

      expect(connection.nohupExecute).toHaveBeenCalledWith(
        expect.stringContaining('apt-get install -y nginx'),
        expect.any(String),
      );
      expect(connection.checkJobStatus).toHaveBeenCalled();
      expect(state.packageName).toBe('nginx');
      expect(state.executionId).toBeDefined();
    });

    it('throws when the background job fails', async () => {
      const connection = makeConnection({
        checkJobStatus: jest.fn().mockResolvedValue('failed'),
      });
      const ctx = makeContext(makeSdk(connection));
      const handler = new SshPackageHandler();

      await expect(handler.create(ctx, BASE_PROPS)).rejects.toThrow();
    });
  });
});
