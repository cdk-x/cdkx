export { BaseCommand } from './lib/base-command.js';
export { SchemaReader } from './lib/schema-reader.js';
export type {
  JsonSchema,
  JsonSchemaProperty,
  ResourceSchema,
  ApiSpec,
} from './lib/schema-reader.js';
export { TypeMapper } from './lib/type-mapper.js';
export type { TypeContext } from './lib/type-mapper.js';
export { CodeGenerator } from './lib/code-generator.js';
export type { CodeGeneratorOptions } from './lib/code-generator.js';
export { RegistryGenerator } from './lib/registry-generator.js';
export type { RegistryGeneratorOptions } from './lib/registry-generator.js';
export { GenerateCommand, generateCommand } from './commands/generate/index.js';
export type { GenerateCommandDeps } from './commands/generate/index.js';
