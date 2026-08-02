import type { PromiseExecutor } from '@nx/devkit';

import { JsiiLanguages } from '../../internal/jsii-languages';
import { NxProjectRoots } from '../../internal/nx-project-roots';
import { ProcessRunner } from '../../internal/process-runner';
import { GoRepoPrecondition } from './go-repo-precondition';
import type { JsiiPublishExecutorSchema } from './schema';

/**
 * Publishes a jsii project's packaged bindings for one target language via
 * the matching `publib-*` CLI (mirrors `packages/core`'s hand-written
 * `jsii-publish-<lang>` targets).
 *
 * For the `go` target specifically, verifies the library's dedicated
 * `github.com/cdk-x/cdkx-<name>-go` repository is reachable first, since
 * `publib-golang` otherwise fails deep inside its own git-clone step with a
 * much less actionable error.
 */
const runExecutor: PromiseExecutor<JsiiPublishExecutorSchema> = async (
  options,
  context,
) => {
  const projectRoot = NxProjectRoots.resolve(context);

  if (options.target === 'go') {
    const precondition = GoRepoPrecondition.check(projectRoot);
    if (!precondition.ok) {
      return { success: false, message: precondition.message };
    }
  }

  const dir =
    options.dir ?? `dist-jsii/${JsiiLanguages.packageSubdir(options.target)}`;
  const binary = JsiiLanguages.publibBinary(options.target);

  return ProcessRunner.run(binary, [dir], projectRoot);
};

export default runExecutor;
