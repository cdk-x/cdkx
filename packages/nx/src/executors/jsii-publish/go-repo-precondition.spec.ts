import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { GoRepoPrecondition } from './go-repo-precondition';

jest.mock('node:child_process');
jest.mock('node:fs');

describe('GoRepoPrecondition', () => {
  it('fails when package.json has no jsii.targets.go.moduleName', () => {
    jest
      .mocked(readFileSync)
      .mockReturnValue(JSON.stringify({ jsii: { targets: {} } }));

    const result = GoRepoPrecondition.check('/workspace/packages/widget');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('No jsii.targets.go.moduleName');
    expect(execFileSync).not.toHaveBeenCalled();
  });

  it('succeeds when the module repo is reachable', () => {
    jest.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        jsii: {
          targets: { go: { moduleName: 'github.com/cdk-x/cdkx-widget-go' } },
        },
      }),
    );
    jest.mocked(execFileSync).mockReturnValue(Buffer.from(''));

    const result = GoRepoPrecondition.check('/workspace/packages/widget');

    expect(result).toEqual({ ok: true });
    expect(execFileSync).toHaveBeenCalledWith(
      'git',
      [
        'ls-remote',
        '--exit-code',
        'https://github.com/cdk-x/cdkx-widget-go.git',
      ],
      { stdio: 'ignore' },
    );
  });

  it('fails with a clear message when the module repo is unreachable', () => {
    jest.mocked(readFileSync).mockReturnValue(
      JSON.stringify({
        jsii: {
          targets: { go: { moduleName: 'github.com/cdk-x/cdkx-widget-go' } },
        },
      }),
    );
    jest.mocked(execFileSync).mockImplementation(() => {
      throw new Error('not found');
    });

    const result = GoRepoPrecondition.check('/workspace/packages/widget');

    expect(result.ok).toBe(false);
    expect(result.message).toContain('cdkx-widget-go');
    expect(result.message).toContain('CONTRIBUTING.md');
  });
});
