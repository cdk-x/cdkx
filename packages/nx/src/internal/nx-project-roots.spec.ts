import type { ExecutorContext } from '@nx/devkit';
import * as path from 'node:path';

import { NxProjectRoots } from './nx-project-roots';

function makeContext(
  overrides: Partial<ExecutorContext> = {},
): ExecutorContext {
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
    ...overrides,
  };
}

describe('NxProjectRoots', () => {
  it('joins the workspace root with the project root', () => {
    expect(NxProjectRoots.resolve(makeContext())).toBe(
      path.join('/workspace', 'packages/widget'),
    );
  });

  it('throws when the context has no projectName', () => {
    expect(() =>
      NxProjectRoots.resolve(makeContext({ projectName: undefined })),
    ).toThrow(/projectName/);
  });

  it('throws when the project is not in projectsConfigurations', () => {
    expect(() =>
      NxProjectRoots.resolve(
        makeContext({
          projectsConfigurations: { version: 2, projects: {} },
        }),
      ),
    ).toThrow(/Unknown project/);
  });
});
