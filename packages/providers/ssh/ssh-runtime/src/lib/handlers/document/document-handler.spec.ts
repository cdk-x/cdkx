import { RuntimeLogger } from '@cdk-x/core';
import { SshDocumentHandler } from './document-handler';

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

const ctx = {
  logger: stubLogger(),
  stabilizeConfig: { intervalMs: 0, timeoutMs: 5000 },
  sdk: {} as never,
};

const commandProps = {
  name: 'check-disk',
  documentType: 'Command' as const,
  content: 'df -h',
};

const automationProps = {
  name: 'deploy-app',
  documentType: 'Automation' as const,
  mainSteps: [
    {
      name: 'install',
      action: 'ssh:runShellScript' as const,
      scriptRef: 'nginx-install',
      inputs: { runCommand: ['apt-get install -y nginx'] },
    },
  ],
};

describe('SshDocumentHandler', () => {
  const handler = new SshDocumentHandler();

  it('create stores Command document', async () => {
    const state = await handler.create(ctx, commandProps);
    expect(state.name).toBe('check-disk');
    expect(state.documentType).toBe('Command');
    expect(state.content).toBe('df -h');
  });

  it('create stores Automation document with mainSteps', async () => {
    const state = await handler.create(ctx, automationProps);
    expect(state.documentType).toBe('Automation');
    expect(state.mainSteps).toHaveLength(1);
    expect(state.mainSteps?.[0].name).toBe('install');
  });

  it('update replaces content, keeps name', async () => {
    const state = await handler.create(ctx, commandProps);
    const updated = await handler.update(
      ctx,
      { ...commandProps, content: 'free -h' },
      state,
    );
    expect(updated.name).toBe('check-disk');
    expect(updated.content).toBe('free -h');
  });

  it('delete resolves without error', async () => {
    const state = await handler.create(ctx, commandProps);
    await expect(handler.delete(ctx, state)).resolves.toBeUndefined();
  });

  it('get returns state derived from props', async () => {
    const state = await handler.get(ctx, commandProps);
    expect(state.name).toBe(commandProps.name);
  });
});
