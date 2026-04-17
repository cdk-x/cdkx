import { RuntimeLogger } from '@cdk-x/core';
import type { MultipassSdk } from '../../multipass-cli-facade';
import { MultipassInstanceHandler } from './multipass-instance-handler';
import { MultipassRuntimeContext } from '../../multipass-runtime-context';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function stubSdk(overrides?: Partial<MultipassSdk>): MultipassSdk {
  return {
    assertInstalled: jest.fn().mockResolvedValue(undefined),
    launch: jest.fn().mockResolvedValue(undefined),
    info: jest.fn().mockResolvedValue({
      name: 'dev',
      ipAddress: '192.168.2.10',
      sshUser: 'ubuntu',
      state: 'Running',
    }),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as MultipassSdk;
}

const baseProps = { name: 'dev', image: 'jammy', cpus: 2, memory: '2G' };

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------

describe('MultipassInstanceHandler.create()', () => {
  it('calls sdk.launch() with props mapped to MultipassLaunchOpts', async () => {
    const sdk = stubSdk();
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    const handler = new MultipassInstanceHandler();

    await handler.create(ctx, baseProps);

    expect(sdk.launch).toHaveBeenCalledWith({
      name: 'dev',
      image: 'jammy',
      cpus: 2,
      memory: '2G',
      disk: undefined,
      bridged: undefined,
      timeout: undefined,
      cloudInit: undefined,
    });
  });

  it('calls sdk.info() after launch and returns state', async () => {
    const sdk = stubSdk({
      info: jest.fn().mockResolvedValue({
        name: 'dev',
        ipAddress: '192.168.2.10',
        sshUser: 'ubuntu',
        state: 'Running',
      }),
    });
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    const handler = new MultipassInstanceHandler();

    const state = await handler.create(ctx, baseProps);

    expect(sdk.info).toHaveBeenCalledWith('dev');
    expect(state).toEqual({
      name: 'dev',
      ipAddress: '192.168.2.10',
      sshUser: 'ubuntu',
    });
  });
});

// ---------------------------------------------------------------------------
// get
// ---------------------------------------------------------------------------

describe('MultipassInstanceHandler.get()', () => {
  it('calls sdk.info() with the VM name from props', async () => {
    const sdk = stubSdk();
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    const handler = new MultipassInstanceHandler();

    const state = await handler.get(ctx, baseProps);

    expect(sdk.info).toHaveBeenCalledWith('dev');
    expect(state).toEqual({
      name: 'dev',
      ipAddress: '192.168.2.10',
      sshUser: 'ubuntu',
    });
  });
});

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe('MultipassInstanceHandler.delete()', () => {
  it('calls sdk.delete() with the VM name from state', async () => {
    const sdk = stubSdk();
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    const handler = new MultipassInstanceHandler();

    await handler.delete(ctx, {
      name: 'dev',
      ipAddress: '192.168.2.10',
      sshUser: 'ubuntu',
    });

    expect(sdk.delete).toHaveBeenCalledWith('dev');
  });
});
