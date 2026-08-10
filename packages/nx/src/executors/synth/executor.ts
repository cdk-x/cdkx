import type { PromiseExecutor } from '@nx/devkit';

import { NxProjectRoots } from '../../internal/nx-project-roots';
import { ProcessRunner } from '../../internal/process-runner';
import type { SynthExecutorSchema } from './schema';

/**
 * Runs a cdkx app's entry file via `ts-node --esm`, invoking `App.synth()`
 * and writing its resource assembly to disk - mirrors `jsii-compile`'s
 * executor: a single shell-out through `ProcessRunner`, since running TS
 * source directly needs an external runtime, not an in-process library call.
 */
const runExecutor: PromiseExecutor<SynthExecutorSchema> = async (
  options,
  context,
) => {
  const projectRoot = NxProjectRoots.resolve(context);
  const main = options.main ?? 'src/main.ts';

  return ProcessRunner.run('ts-node', ['--esm', main], projectRoot);
};

export default runExecutor;
