import { MultipassCli } from './multipass-cli';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SpawnResult = { code: number; stdout: string; stderr: string };

function makeSpawn(results: Record<string, SpawnResult>) {
  return jest.fn((cmd: string, args: string[]) => {
    const key = [cmd, ...args].join(' ');
    const result = results[key] ?? { code: 0, stdout: '', stderr: '' };
    return Promise.resolve(result);
  });
}

// ---------------------------------------------------------------------------
// assertInstalled
// ---------------------------------------------------------------------------

describe('MultipassCli.assertInstalled()', () => {
  it('resolves when multipass version exits 0', async () => {
    const spawn = makeSpawn({
      'multipass version': {
        code: 0,
        stdout: 'multipass 1.16.1+mac',
        stderr: '',
      },
    });
    const cli = new MultipassCli({ spawn });

    await expect(cli.assertInstalled()).resolves.toBeUndefined();
    expect(spawn).toHaveBeenCalledWith('multipass', ['version']);
  });

  it('throws a clear error when multipass is not found', async () => {
    const spawn = jest.fn().mockRejectedValue(
      Object.assign(new Error('spawn multipass ENOENT'), { code: 'ENOENT' }),
    );
    const cli = new MultipassCli({ spawn });

    await expect(cli.assertInstalled()).rejects.toThrow(
      /multipass is not installed/i,
    );
  });
});

// ---------------------------------------------------------------------------
// launch
// ---------------------------------------------------------------------------

describe('MultipassCli.launch()', () => {
  it('calls multipass launch with name and image', async () => {
    const spawn = makeSpawn({
      'multipass launch --name dev jammy': { code: 0, stdout: '', stderr: '' },
    });
    const cli = new MultipassCli({ spawn });

    await cli.launch({ name: 'dev', image: 'jammy' });

    expect(spawn).toHaveBeenCalledWith('multipass', [
      'launch',
      '--name',
      'dev',
      'jammy',
    ]);
  });

  it('includes all optional flags when provided', async () => {
    const spawn = jest.fn().mockResolvedValue({ code: 0, stdout: '', stderr: '' });
    const cli = new MultipassCli({ spawn });

    await cli.launch({
      name: 'dev',
      image: '22.04',
      cpus: 4,
      memory: '8G',
      disk: '40G',
      bridged: true,
      timeout: 300,
      cloudInit: '/tmp/cloud-init.yaml',
    });

    expect(spawn).toHaveBeenCalledWith('multipass', [
      'launch',
      '--name',
      'dev',
      '22.04',
      '--cpus',
      '4',
      '--memory',
      '8G',
      '--disk',
      '40G',
      '--bridged',
      '--timeout',
      '300',
      '--cloud-init',
      '/tmp/cloud-init.yaml',
    ]);
  });

  it('throws when exit code is non-zero', async () => {
    const spawn = jest
      .fn()
      .mockResolvedValue({ code: 1, stdout: '', stderr: 'failed to launch' });
    const cli = new MultipassCli({ spawn });

    await expect(cli.launch({ name: 'dev' })).rejects.toThrow(
      /multipass launch failed/i,
    );
  });
});

// ---------------------------------------------------------------------------
// info
// ---------------------------------------------------------------------------

describe('MultipassCli.info()', () => {
  it('returns parsed VM info with ipAddress, sshUser, and state', async () => {
    const payload = JSON.stringify({
      errors: [],
      info: {
        'my-vm': {
          ipv4: ['192.168.2.10'],
          state: 'Running',
        },
      },
    });
    const spawn = jest
      .fn()
      .mockResolvedValue({ code: 0, stdout: payload, stderr: '' });
    const cli = new MultipassCli({ spawn });

    const info = await cli.info('my-vm');

    expect(info).toEqual({
      name: 'my-vm',
      ipAddress: '192.168.2.10',
      sshUser: 'ubuntu',
      state: 'Running',
    });
    expect(spawn).toHaveBeenCalledWith('multipass', [
      'info',
      'my-vm',
      '--format',
      'json',
    ]);
  });

  it('returns empty ipAddress when VM has no ipv4 yet', async () => {
    const payload = JSON.stringify({
      errors: [],
      info: { 'my-vm': { state: 'Starting' } },
    });
    const spawn = jest
      .fn()
      .mockResolvedValue({ code: 0, stdout: payload, stderr: '' });
    const cli = new MultipassCli({ spawn });

    const info = await cli.info('my-vm');

    expect(info.ipAddress).toBe('');
    expect(info.state).toBe('Starting');
  });

  it('throws when exit code is non-zero', async () => {
    const spawn = jest
      .fn()
      .mockResolvedValue({ code: 1, stdout: '', stderr: 'instance not found' });
    const cli = new MultipassCli({ spawn });

    await expect(cli.info('missing')).rejects.toThrow(/multipass info failed/i);
  });
});

// ---------------------------------------------------------------------------
// delete
// ---------------------------------------------------------------------------

describe('MultipassCli.delete()', () => {
  it('calls multipass delete --purge with the VM name', async () => {
    const spawn = jest
      .fn()
      .mockResolvedValue({ code: 0, stdout: '', stderr: '' });
    const cli = new MultipassCli({ spawn });

    await cli.delete('my-vm');

    expect(spawn).toHaveBeenCalledWith('multipass', [
      'delete',
      '--purge',
      'my-vm',
    ]);
  });

  it('throws when exit code is non-zero', async () => {
    const spawn = jest
      .fn()
      .mockResolvedValue({ code: 1, stdout: '', stderr: 'instance not found' });
    const cli = new MultipassCli({ spawn });

    await expect(cli.delete('missing')).rejects.toThrow(
      /multipass delete failed/i,
    );
  });
});
