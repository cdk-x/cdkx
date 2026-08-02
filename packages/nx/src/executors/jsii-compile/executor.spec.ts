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
    projectName: 'widget',
    projectGraph: { nodes: {}, dependencies: {} },
    projectsConfigurations: {
      version: 2,
      projects: { widget: { root: 'packages/widget' } },
    },
    nxJsonConfiguration: {},
  };
}

describe('jsii-compile executor', () => {
  beforeEach(() => {
    jest.mocked(ProcessRunner.run).mockReturnValue({ success: true });
  });

  it('runs jsii --generate-tsconfig with the default tsconfig file name', async () => {
    await executor({}, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'jsii',
      ['--generate-tsconfig', 'tsconfig.jsii.json'],
      path.join('/workspace', 'packages/widget'),
    );
  });

  it('honors a custom tsconfigFileName', async () => {
    await executor({ tsconfigFileName: 'custom.tsconfig.json' }, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'jsii',
      ['--generate-tsconfig', 'custom.tsconfig.json'],
      path.join('/workspace', 'packages/widget'),
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
