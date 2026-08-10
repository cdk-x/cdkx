import type { ExecutorContext } from '@nx/devkit';
import * as path from 'node:path';

import { ProcessRunner } from '../../internal/process-runner';
import executor from './executor';

jest.mock('../../internal/process-runner');

function makeContext(): ExecutorContext {
  return {
    root: '/workspace',
    cwd: '/workspace',
    isVerbose: false,
    projectName: 'my-app',
    projectGraph: { nodes: {}, dependencies: {} },
    projectsConfigurations: {
      version: 2,
      projects: { 'my-app': { root: 'packages/my-app' } },
    },
    nxJsonConfiguration: {},
  };
}

describe('synth executor', () => {
  beforeEach(() => {
    jest.mocked(ProcessRunner.run).mockReturnValue({ success: true });
  });

  it('runs ts-node --esm against the default entry file', async () => {
    await executor({}, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'ts-node',
      ['--esm', 'src/main.ts'],
      path.join('/workspace', 'packages/my-app'),
    );
  });

  it('honors a custom main entry path', async () => {
    await executor({ main: 'src/cli.ts' }, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'ts-node',
      ['--esm', 'src/cli.ts'],
      path.join('/workspace', 'packages/my-app'),
    );
  });

  it('propagates a failed ProcessRunner result', async () => {
    jest
      .mocked(ProcessRunner.run)
      .mockReturnValue({ success: false, message: 'boom' });

    const result = await executor({}, makeContext());
    expect(result).toEqual({ success: false, message: 'boom' });
  });
});
