import type { ExecutorContext } from '@nx/devkit';
import * as path from 'node:path';

import { ProcessRunner } from '../../internal/process-runner';
import { GoRepoPrecondition } from './go-repo-precondition';
import executor from './executor';

jest.mock('../../internal/process-runner');
jest.mock('./go-repo-precondition');

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

describe('jsii-publish executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(ProcessRunner.run).mockReturnValue({ success: true });
    jest.mocked(GoRepoPrecondition.check).mockReturnValue({ ok: true });
  });

  it('publishes npm bindings via publib-npm from dist-jsii/js', async () => {
    await executor({ target: 'npm' }, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'publib-npm',
      ['dist-jsii/js'],
      path.join('/workspace', 'packages/widget'),
    );
  });

  it.each([
    ['python', 'publib-pypi'],
    ['java', 'publib-maven'],
    ['dotnet', 'publib-nuget'],
  ] as const)('publishes %s bindings via %s', async (target, binary) => {
    await executor({ target }, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      binary,
      [`dist-jsii/${target}`],
      path.join('/workspace', 'packages/widget'),
    );
  });

  it('honors a custom dir', async () => {
    await executor({ target: 'python', dir: 'out/python' }, makeContext());

    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'publib-pypi',
      ['out/python'],
      path.join('/workspace', 'packages/widget'),
    );
  });

  it('checks the Go repo precondition before publishing go bindings', async () => {
    await executor({ target: 'go' }, makeContext());

    expect(GoRepoPrecondition.check).toHaveBeenCalledWith(
      path.join('/workspace', 'packages/widget'),
    );
    expect(ProcessRunner.run).toHaveBeenCalledWith(
      'publib-golang',
      ['dist-jsii/go'],
      path.join('/workspace', 'packages/widget'),
    );
  });

  it('fails fast without invoking publib-golang when the go repo is unreachable', async () => {
    jest.mocked(GoRepoPrecondition.check).mockReturnValue({
      ok: false,
      message: 'unreachable',
    });

    const result = await executor({ target: 'go' }, makeContext());

    expect(result).toEqual({ success: false, message: 'unreachable' });
    expect(ProcessRunner.run).not.toHaveBeenCalled();
  });
});
