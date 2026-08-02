import type { PromiseExecutor } from '@nx/devkit';

import { NxProjectRoots } from '../../internal/nx-project-roots';
import { ProcessRunner } from '../../internal/process-runner';
import type { JsiiCompileExecutorSchema } from './schema';

/**
 * Compiles a jsii project via the `jsii` CLI, regenerating its derived
 * `tsconfig.jsii.json` in the process (mirrors `packages/core`'s hand-written
 * `jsii-compile` target).
 */
const runExecutor: PromiseExecutor<JsiiCompileExecutorSchema> = async (
  options,
  context,
) => {
  const projectRoot = NxProjectRoots.resolve(context);
  const tsconfigFileName = options.tsconfigFileName ?? 'tsconfig.jsii.json';

  return ProcessRunner.run(
    'jsii',
    ['--generate-tsconfig', tsconfigFileName],
    projectRoot,
  );
};

export default runExecutor;
