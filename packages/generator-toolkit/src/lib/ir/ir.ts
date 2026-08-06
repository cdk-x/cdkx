/**
 * How a Resource is meant to be deployed: `"synth-only"` for a Resource
 * whose synthesized properties are turned into a file (e.g. a GitHub
 * Actions workflow YAML file, no live API call — its lifecycle stops at
 * synth), `"deploy"` for one that's created via a provider API call. Pure
 * metadata — never affects the generated class shape (see
 * {@link IrResourceNode}), only what a not-yet-built deploy engine does
 * with it afterwards.
 */
export type DeployMode = 'synth-only' | 'deploy';

/**
 * How a `"component-ref"` {@link IrPropertyType}'s Component children are
 * aggregated back into the owning Resource/Component's properties:
 * `"single"` for a lone nested Component, `"array"` for an ordered list
 * (e.g. a Job's `steps`), `"map"` for an object keyed by construct id (e.g.
 * a Workflow's `jobs`).
 */
export type CollectionShape = 'single' | 'array' | 'map';

/**
 * The shape of a single Resource/Component property, as derived from a
 * source schema by a format-specific adapter (e.g.
 * {@link JsonSchemaAdapter}). Format-agnostic on purpose, so every adapter
 * produces the same shapes for {@link CodeGenerator} to consume regardless
 * of source format (JSON Schema today, OpenAPI later).
 */
export type IrPropertyType =
  | {
      readonly shape: 'primitive';
      readonly primitive: 'string' | 'number' | 'boolean';
    }
  | { readonly shape: 'unknown' }
  | { readonly shape: 'array'; readonly items: IrPropertyType }
  | { readonly shape: 'record'; readonly valueType: IrPropertyType }
  | {
      readonly shape: 'enum';
      readonly name: string;
      readonly values: readonly string[];
    }
  | {
      readonly shape: 'component-ref';
      readonly target: string;
      readonly collection: CollectionShape;
    }
  | {
      readonly shape: 'inline-shape';
      readonly name: string;
      readonly properties: readonly IrProperty[];
    };

/**
 * A single named property on an {@link IrResourceNode} or
 * {@link IrComponentNode}, keyed by its original source-schema name (never
 * renamed by the adapter — casing/identifier-safety is a code generation
 * concern, not an IR concern).
 */
export interface IrProperty {
  readonly name: string;
  readonly type: IrPropertyType;
  readonly required: boolean;
  readonly description?: string;
}

/**
 * A non-deployable, nested shape reachable from a Resource's schema (e.g. a
 * Step inside a Job) — generates a `Component` subclass. Has no identifier
 * of its own; only `name` (its generated PascalCase class name).
 */
export interface IrComponentNode {
  readonly name: string;
  readonly description?: string;
  readonly properties: readonly IrProperty[];
}

/**
 * The single deployable unit at the root of a vendored schema file —
 * generates a `Resource` subclass.
 */
export interface IrResourceNode {
  readonly resourceType: string;
  readonly apiVersion: string;
  readonly mode: DeployMode;
  readonly description?: string;
  readonly properties: readonly IrProperty[];
}
