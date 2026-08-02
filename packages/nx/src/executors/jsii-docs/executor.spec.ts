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

describe('jsii-docs executor', () => {
  beforeEach(() => {
    jest.mocked(ProcessRunner.run).mockReturnValue({ success: true });
  });

  it('defaults to all five languages and the default output prefix', async () => {
    await executor({}, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'jsii-docgen',
      [
        '-l',
        'typescript',
        '-l',
        'python',
        '-l',
        'java',
        '-l',
        'csharp',
        '-l',
        'go',
        '-o',
        'dist-jsii/docs/API',
      ],
      path.join('/workspace', 'packages/widget'),
    );
  });

  it('honors a custom language subset and output prefix', async () => {
    await executor(
      { languages: ['typescript', 'python'], output: 'out/API' },
      makeContext(),
    );

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'jsii-docgen',
      ['-l', 'typescript', '-l', 'python', '-o', 'out/API'],
      path.join('/workspace', 'packages/widget'),
    );
  });
});
