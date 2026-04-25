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
    waitForSsh: jest.fn().mockResolvedValue(undefined),
    cloudInitStatus: jest.fn().mockResolvedValue('done'),
    cloudInitLog: jest.fn().mockResolvedValue(''),
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
// networks and mounts forwarding
// ---------------------------------------------------------------------------

describe('MultipassInstanceHandler.create() with networks and mounts', () => {
  it('forwards networks to sdk.launch()', async () => {
    const sdk = stubSdk();
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    const handler = new MultipassInstanceHandler();

    await handler.create(ctx, {
      ...baseProps,
      networks: [{ name: 'en0', mode: 'auto' }],
    });

    expect(sdk.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        networks: [{ name: 'en0', mode: 'auto' }],
      }),
    );
  });

  it('forwards mounts to sdk.launch()', async () => {
    const sdk = stubSdk();
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    const handler = new MultipassInstanceHandler();

    await handler.create(ctx, {
      ...baseProps,
      mounts: [{ source: '/host/data', target: '/data' }],
    });

    expect(sdk.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        mounts: [{ source: '/host/data', target: '/data' }],
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// cloud-init wait
// ---------------------------------------------------------------------------

describe('MultipassInstanceHandler.create() cloud-init wait', () => {
  it('calls sdk.cloudInitStatus() and resolves when it returns "done"', async () => {
    const sdk = stubSdk();
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    const handler = new MultipassInstanceHandler();

    await handler.create(ctx, baseProps);

    expect(sdk.cloudInitStatus).toHaveBeenCalledWith('dev');
  });

  it('retries until cloud-init is done', async () => {
    const cloudInitStatus = jest
      .fn()
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('running')
      .mockResolvedValueOnce('done');
    const sdk = stubSdk({ cloudInitStatus });
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    ctx.stabilizeConfig = { intervalMs: 0, timeoutMs: 10_000 };
    const handler = new MultipassInstanceHandler();

    await handler.create(ctx, baseProps);

    expect(cloudInitStatus).toHaveBeenCalledTimes(3);
  });

  it('throws when cloud-init finishes with error status', async () => {
    const sdk = stubSdk({
      cloudInitStatus: jest.fn().mockResolvedValue('error'),
    });
    const ctx = new MultipassRuntimeContext(sdk, stubLogger());
    const handler = new MultipassInstanceHandler();

    await expect(handler.create(ctx, baseProps)).rejects.toThrow(
      /cloud-init finished with status: error/i,
    );
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
