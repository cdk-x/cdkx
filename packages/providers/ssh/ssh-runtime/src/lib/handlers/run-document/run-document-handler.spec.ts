import { RuntimeLogger } from '@cdk-x/core';
import { SshRunDocumentHandler } from './run-document-handler';
import type { SshSdk } from '../../ssh-sdk-facade';
import type { SshConnection } from '@cdk-x/ssh-sdk';

function stubLogger(): RuntimeLogger {
  const noop = jest.fn();
  const logger: RuntimeLogger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: jest.fn(() => logger),
  };
  return logger;
}

const makeConnection = (
  overrides: Partial<SshConnection> = {},
): SshConnection => ({
  execute: jest.fn().mockResolvedValue({ code: 0, stdout: '', stderr: '' }),
  nohupExecute: jest.fn().mockResolvedValue(undefined),
  checkJobStatus: jest.fn().mockResolvedValue('done'),
  disconnect: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const makeSdk = (connection: SshConnection): SshSdk => ({
  connect: jest.fn().mockResolvedValue(connection),
});

const makeCtx = (sdk: SshSdk) => ({
  logger: stubLogger(),
  stabilizeConfig: { intervalMs: 0, timeoutMs: 5000 },
  sdk,
});

const baseProps = {
  documentName: 'check-disk',
  documentType: 'Command' as const,
  content: 'df -h',
  host: '10.0.0.1',
  user: 'ubuntu',
  privateKeyPath: '/home/user/.ssh/id_rsa',
};

describe('SshRunDocumentHandler — Command', () => {
  it('create connects, executes content, returns executionId', async () => {
    const connection = makeConnection();
    const ctx = makeCtx(makeSdk(connection));
    const handler = new SshRunDocumentHandler();

    const state = await handler.create(ctx, baseProps);

    expect(ctx.sdk.connect).toHaveBeenCalledWith(
      expect.objectContaining({ host: '10.0.0.1', user: 'ubuntu' }),
    );
    expect(connection.execute).toHaveBeenCalledWith('df -h');
    expect(connection.disconnect).toHaveBeenCalled();
    expect(state.executionId).toBeDefined();
    expect(state.documentName).toBe('check-disk');
  });

  it('substitutes {{ param }} in content', async () => {
    const connection = makeConnection();
    const ctx = makeCtx(makeSdk(connection));
    const handler = new SshRunDocumentHandler();

    await handler.create(ctx, {
      ...baseProps,
      content: 'echo {{ greeting }}',
      parameterValues: { greeting: 'hello' },
    });

    expect(connection.execute).toHaveBeenCalledWith('echo hello');
  });

  it('throws when command exits non-zero', async () => {
    const connection = makeConnection({
      execute: jest.fn().mockResolvedValue({
        code: 1,
        stdout: '',
        stderr: 'permission denied',
      }),
    });
    const ctx = makeCtx(makeSdk(connection));
    const handler = new SshRunDocumentHandler();

    await expect(handler.create(ctx, baseProps)).rejects.toThrow(
      "Command document 'check-disk' failed",
    );
    expect(connection.disconnect).toHaveBeenCalled();
  });
});

describe('SshRunDocumentHandler — Automation', () => {
  const automationProps = {
    documentName: 'deploy-nginx',
    documentType: 'Automation' as const,
    host: '10.0.0.1',
    user: 'ubuntu',
    privateKeyPath: '/home/user/.ssh/id_rsa',
    mainSteps: [
      {
        name: 'install',
        action: 'ssh:runShellScript' as const,
        scriptRef: 'nginx-install',
        inputs: {
          runCommand: ['apt-get update', 'apt-get install -y {{ pkg }}'],
        },
      },
      {
        name: 'verify',
        action: 'ssh:runShellScript' as const,
        scriptRef: 'nginx-verify',
        inputs: { runCommand: ['systemctl status nginx'] },
      },
    ],
    parameterValues: { pkg: 'nginx' },
  };

  it('executes all steps in order', async () => {
    const connection = makeConnection();
    const ctx = makeCtx(makeSdk(connection));
    const handler = new SshRunDocumentHandler();

    await handler.create(ctx, automationProps);

    expect(connection.execute).toHaveBeenCalledTimes(2);
    expect(connection.execute).toHaveBeenNthCalledWith(
      1,
      'apt-get update\napt-get install -y nginx',
    );
    expect(connection.execute).toHaveBeenNthCalledWith(
      2,
      'systemctl status nginx',
    );
  });

  it('stops on first step failure', async () => {
    const connection = makeConnection({
      execute: jest
        .fn()
        .mockResolvedValueOnce({ code: 1, stdout: '', stderr: 'error' })
        .mockResolvedValue({ code: 0, stdout: '', stderr: '' }),
    });
    const ctx = makeCtx(makeSdk(connection));
    const handler = new SshRunDocumentHandler();

    await expect(handler.create(ctx, automationProps)).rejects.toThrow(
      "Step 'install' in document 'deploy-nginx' failed",
    );
    expect(connection.execute).toHaveBeenCalledTimes(1);
    expect(connection.disconnect).toHaveBeenCalled();
  });
});
