import { RuntimeLogger } from '@cdk-x/core';
import { SshShellScriptHandler } from './shell-script-handler';

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

const props = {
  name: 'my-script',
  runCommand: ['echo hello', 'echo world'],
  parameters: { greeting: { type: 'String' as const, default: 'hello' } },
};

describe('SshShellScriptHandler', () => {
  const handler = new SshShellScriptHandler();

  it('create stores name and runCommand', async () => {
    const state = await handler.create(ctx, props);
    expect(state.name).toBe('my-script');
    expect(state.runCommand).toEqual(['echo hello', 'echo world']);
  });

  it('update replaces runCommand, keeps name', async () => {
    const state = await handler.create(ctx, props);
    const updated = await handler.update(
      ctx,
      { ...props, runCommand: ['echo updated'] },
      state,
    );
    expect(updated.name).toBe('my-script');
    expect(updated.runCommand).toEqual(['echo updated']);
  });

  it('delete resolves without error', async () => {
    const state = await handler.create(ctx, props);
    await expect(handler.delete(ctx, state)).resolves.toBeUndefined();
  });

  it('get returns state derived from props', async () => {
    const state = await handler.get(ctx, props);
    expect(state.name).toBe(props.name);
  });
});
