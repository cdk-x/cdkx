import type { JSONSchema4 } from 'json-schema';
import type { ClassifiedSchema } from '../schema-classifier/schema-classifier.js';

export interface SingleRootClassifierOptions {
  /**
   * The PascalCase `resourceType` for the document's one Resource root
   * (e.g. `"Workflow"`). Required — a single-file schema has no reliable
   * self-describing name to derive one from (a schema's `$id` is a URL,
   * not a type name).
   */
  readonly resourceType: string;
}

/**
 * A {@link SchemaClassifier} for single-file, single-root schema documents
 * (GitHub Actions' `github-workflow.json`, `dependabot.json`, and any other
 * provider whose vendored schema is one JSON Schema draft-07 document with
 * the whole thing describing exactly one Resource): the document's own root
 * is always the (only) Resource, full stop — no structural heuristic
 * needed, unlike the cardinality-based classification an earlier design
 * attempted and abandoned.
 */
export class SingleRootClassifier {
  private constructor() {} // no instances — static-only class

  /**
   * Classifies a single-root schema document.
   *
   * @param schema - the schema document (unused beyond taking up the
   * position a {@link SchemaClassifier} expects — the root pointer is
   * always `"#"` for this classifier, regardless of document shape).
   * @param options - must include `resourceType`.
   * @returns a `ClassifiedSchema` with exactly one root at pointer `"#"`.
   * @example
   * const classified = SingleRootClassifier.classify(schema, { resourceType: 'Workflow' });
   * // classified.roots === [{ resourceType: 'Workflow', pointer: '#' }]
   */
  public static classify(
    schema: JSONSchema4,
    options: SingleRootClassifierOptions,
  ): ClassifiedSchema {
    if (!options.resourceType) {
      throw new Error(
        'SingleRootClassifier requires options.resourceType (a non-empty string).',
      );
    }
    void schema; // the document's shape doesn't affect a single-root result
    return { roots: [{ resourceType: options.resourceType, pointer: '#' }] };
  }
}
