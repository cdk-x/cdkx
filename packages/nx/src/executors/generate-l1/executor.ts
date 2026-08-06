import type { PromiseExecutor } from '@nx/devkit';
import {
  CodeGenerator,
  DeployMetadataGenerator,
  JsonSchemaAdapter,
  type JsonSchema,
} from '@cdk-x/generator-toolkit';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

import { NxProjectRoots } from '../../internal/nx-project-roots';
import { SchemaOutputNaming } from '../../internal/schema-output-naming';
import type { GenerateL1ExecutorSchema } from './schema';

/**
 * Generates L1 Resource/Component TypeScript source from every vendored
 * JSON Schema file declared in `schemas`, in-process via
 * `@cdk-x/generator-toolkit` — a TypeScript library this workspace owns,
 * not an external CLI, so unlike the `jsii-*` executors this never shells
 * out through `ProcessRunner`.
 */
const runExecutor: PromiseExecutor<GenerateL1ExecutorSchema> = async (
  options,
  context,
) => {
  const projectRoot = NxProjectRoots.resolve(context);
  const outputDir = path.join(
    projectRoot,
    options.outputDir ?? 'src/lib/generated',
  );

  try {
    mkdirSync(outputDir, { recursive: true });

    for (const entry of options.schemas) {
      const schema = JSON.parse(
        readFileSync(path.join(projectRoot, entry.file), 'utf-8'),
      ) as JsonSchema;

      const { resource, components } = JsonSchemaAdapter.toIr(schema, {
        resourceType: entry.resourceType,
        apiVersion: options.apiVersion,
        mode: entry.mode,
      });

      const baseName = SchemaOutputNaming.baseName(entry.file);
      writeFileSync(
        path.join(outputDir, `${baseName}.generated.ts`),
        CodeGenerator.generate(resource, components),
      );
      writeFileSync(
        path.join(outputDir, `${baseName}.deploy.generated.ts`),
        DeployMetadataGenerator.generate(resource),
      );
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
};

export default runExecutor;
