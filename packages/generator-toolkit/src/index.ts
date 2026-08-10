export type {
  ClassifiedSchema,
  ResourceRootDescriptor,
  SchemaClassifier,
} from './lib/schema-classifier/schema-classifier.js';
export {
  SingleRootClassifier,
  type SingleRootClassifierOptions,
} from './lib/single-root-classifier/single-root-classifier.js';
export { SchemaNormalizer } from './lib/schema-normalizer/schema-normalizer.js';
export { PropertyNaming } from './lib/property-naming/property-naming.js';
export { TypeNaming } from './lib/type-naming/type-naming.js';
export {
  UnionOverrideMatcher,
  type UnionOverride,
  type UnionVariant,
} from './lib/union-override/union-override.js';
export { UnionDetector } from './lib/union-detector/union-detector.js';
export {
  Json2jsiiAdapter,
  type Json2jsiiAdapterOptions,
  type Json2jsiiResult,
} from './lib/json2jsii-adapter/json2jsii-adapter.js';
export {
  PropsSerializerGenerator,
  type PropsSerializerGeneratorOptions,
} from './lib/props-serializer-generator/props-serializer-generator.js';
export {
  ResourceWrapperGenerator,
  type ResourceWrapperOptions,
} from './lib/resource-wrapper-generator/resource-wrapper-generator.js';
export {
  DeployMetadataGenerator,
  type DeployMode,
  type ResourceDeployMetadata,
} from './lib/deploy-metadata-generator/deploy-metadata-generator.js';
