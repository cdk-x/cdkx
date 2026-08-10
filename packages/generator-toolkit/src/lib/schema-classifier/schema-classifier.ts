import type { JSONSchema4 } from 'json-schema';

/**
 * One `Resource` root discovered within a vendored provider schema —
 * everything reachable below it that isn't itself another root becomes
 * plain, deeply-nested TypeScript interfaces/enums (never a nested
 * `Component` construct; see {@link ResourceWrapperGenerator}).
 */
export interface ResourceRootDescriptor {
  /**
   * The PascalCase `resourceType` the generated `Resource` subclass will
   * carry (e.g. `"Workflow"`).
   */
  readonly resourceType: string;

  /**
   * A JSON Pointer, relative to the classified schema document, to this
   * root's subschema — `"#"` for a document whose own root is the Resource
   * (e.g. a single-file GitHub Actions schema), or
   * `"#/definitions/<Kind>"` for a document that packs many roots into one
   * file (e.g. a Kubernetes OpenAPI spec, one root per
   * `x-kubernetes-group-version-kind`-marked definition).
   */
  readonly pointer: string;
}

/**
 * The result of classifying one schema document: every `Resource` root it
 * contains. Always an array, even for formats that only ever produce one
 * root — `Classifier` implementations for a format that packs many roots
 * into a single document (Kubernetes' OpenAPI spec, not yet implemented)
 * don't need a different contract to return more than one.
 */
export interface ClassifiedSchema {
  readonly roots: readonly ResourceRootDescriptor[];
}

/**
 * Identifies `Resource` roots within a vendored provider schema. Pluggable
 * per schema format on purpose: what marks something as a Resource differs
 * by format and isn't derivable by one universal structural rule. GitHub's
 * (and similar single-file, JSON-Schema-draft-07-with-`definitions`)
 * providers use {@link SingleRootClassifier}: the document's own root is the
 * only Resource, full stop.
 *
 * A future `OpenApiGvkClassifier` for Kubernetes-style OpenAPI/Swagger specs
 * (not implemented yet — see the L1 codegen plan) would instead scan every
 * definition in the document for the `x-kubernetes-group-version-kind`
 * extension (plus a `metadata` property, mirroring cdk8s-cli's
 * `findApiObjectDefinitions()`), returning one root per match — this is
 * exactly why `ClassifiedSchema.roots` is already an array: a single input
 * document can yield many Resources, not just one.
 */
export interface SchemaClassifier {
  /**
   * Classifies a schema document, identifying its `Resource` root(s).
   *
   * @param schema - the (already-normalized) schema document to classify.
   * @param options - classifier-specific input; `SingleRootClassifier`
   * requires a caller-supplied `resourceType` here since a single-root
   * document has no reliable self-describing name to derive one from. A
   * future GVK-based classifier wouldn't need this, since the resourceType
   * is derivable from each match's own `x-kubernetes-group-version-kind`.
   * @returns every `Resource` root found in `schema`.
   */
  classify(schema: JSONSchema4, options?: unknown): ClassifiedSchema;
}
