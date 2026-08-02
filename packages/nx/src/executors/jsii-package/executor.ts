import type { PromiseExecutor } from '@nx/devkit';

import { JsiiLanguages } from '../../internal/jsii-languages';
import { NxProjectRoots } from '../../internal/nx-project-roots';
import { ProcessRunner } from '../../internal/process-runner';
import type { JsiiPackageExecutorSchema } from './schema';

/**
 * Packages a jsii project's compiled output for one target language via
 * `jsii-pacmak` (mirrors `packages/core`'s hand-written `jsii-package-<lang>`
 * targets).
 */
const runExecutor: PromiseExecutor<JsiiPackageExecutorSchema> = async (
  options,
  context,
) => {
  const projectRoot = NxProjectRoots.resolve(context);
  const outdir = options.outdir ?? 'dist-jsii';
  const pacmakTarget = JsiiLanguages.pacmakTarget(options.target);

  return ProcessRunner.run(
    'jsii-pacmak',
    ['-t', pacmakTarget, '--outdir', outdir, '.'],
    projectRoot,
  );
};

export default runExecutor;
