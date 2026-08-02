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

describe('jsii-package executor', () => {
  beforeEach(() => {
    jest.mocked(ProcessRunner.run).mockReturnValue({ success: true });
  });

  it("translates the npm target to pacmak's js flag", async () => {
    await executor({ target: 'npm' }, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'jsii-pacmak',
      ['-t', 'js', '--outdir', 'dist-jsii', '.'],
      path.join('/workspace', 'packages/widget'),
    );
  });

  it.each(['python', 'java', 'dotnet', 'go'] as const)(
    'passes the %s target through unchanged',
    async (target) => {
      await executor({ target }, makeContext());

      expect(ProcessRunner.run).toHaveBeenCalledWith(
        'jsii-pacmak',
        ['-t', target, '--outdir', 'dist-jsii', '.'],
        path.join('/workspace', 'packages/widget'),
      );
    },
  );

  it('honors a custom outdir', async () => {
    await executor({ target: 'python', outdir: 'out' }, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'jsii-pacmak',
      ['-t', 'python', '--outdir', 'out', '.'],
      path.join('/workspace', 'packages/widget'),
    );
  });
});
