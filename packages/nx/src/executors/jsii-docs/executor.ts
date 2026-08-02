import type { PromiseExecutor } from '@nx/devkit';

import { NxProjectRoots } from '../../internal/nx-project-roots';
import { ProcessRunner } from '../../internal/process-runner';
import type { JsiiDocsExecutorSchema, JsiiDocsLanguage } from './schema';

const DEFAULT_LANGUAGES: JsiiDocsLanguage[] = [
  'typescript',
  'python',
  'java',
  'csharp',
  'go',
];

/**
 * Generates multi-language API documentation for a jsii project via
 * `jsii-docgen` (mirrors `packages/core`'s hand-written `jsii-docs` target).
 */
const runExecutor: PromiseExecutor<JsiiDocsExecutorSchema> = async (
  options,
  context,
) => {
  const projectRoot = NxProjectRoots.resolve(context);
  const languages = options.languages ?? DEFAULT_LANGUAGES;
  const output = options.output ?? 'dist-jsii/docs/API';

  const args = languages.flatMap((language) => ['-l', language]);
  args.push('-o', output);

  return ProcessRunner.run('jsii-docgen', args, projectRoot);
};

export default runExecutor;
