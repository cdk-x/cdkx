import type { PromiseExecutor } from '@nx/devkit';
import type { GenerateL1ExecutorSchema } from './schema';

/**
 * Generates L1 Resource/Component TypeScript source from every vendored
 * JSON Schema file declared in `schemas`. Not yet implemented —
 * `@cdk-x/generator-toolkit` doesn't have real generation logic yet.
 */
const runExecutor: PromiseExecutor<GenerateL1ExecutorSchema> = async () => {
  return { success: true };
};

export default runExecutor;
