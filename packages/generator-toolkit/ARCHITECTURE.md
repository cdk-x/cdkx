# @cdk-x/generator-toolkit — architecture guide

This package turns one vendored provider JSON Schema file into cdk-x L1 `Resource` TypeScript source, fully automatically — no manifest, no human classification step. This document explains what each file does, how they fit together, and how far the current implementation generalizes beyond the two GitHub schemas (`github-workflow.json`, `dependabot.json`) used to build it.

**Supersedes an earlier design** (root = Resource, every `$ref`-reachable `definitions` entry = a nested `Component` construct) that was abandoned after real-schema testing exposed it as unworkable — object-shaped value types (`concurrency`, `jobContainer`) wrongly became full constructs, and a node needing two independent child collections at once (a `Job`'s `steps` and `services`) broke the codegen outright. See the L1 codegen project memory for the full history.

## Pipeline overview

```
vendored schema file (JSON Schema)
        │
        ▼
SchemaNormalizer.normalize(schema)                 ← rewrites what json2jsii can't represent
        │
        ▼
SingleRootClassifier.classify(schema, { resourceType })   ← identifies the Resource root(s)
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
Json2jsiiAdapter.generate()   PropsSerializerGenerator     ResourceWrapperGenerator
        │                       .generate()                  .generate()
        ▼                             ▼                             ▼
 interfaces + enums          static toJson<Type>()        `class X extends Resource`
 (+ real union types            methods, one class            wrapping the props type
  for union overrides)          per Resource file
        │                             │                             │
        └─────────────────────────────┴─────────────────────────────┘
                                       │
                                       ▼
                          <baseName>.generated.ts   (one file, all three pieces)
                                       +
                     DeployMetadataGenerator.generate()
                                       ▼
                        <baseName>.deploy.generated.ts
```

All five pieces are combined into the final file by the `@cdk-x/nx` `generate-l1` executor, not by this package — `generator-toolkit` only produces source-code fragments; file assembly and disk I/O live in the executor.

## The core reframing: Resources only, never nested constructs

**L1 auto-generation produces exactly one construct class per Resource root — never a nested `Component` construct.** Everything below a Resource root, no matter how deeply nested or what its cardinality (array, map, singular), becomes a plain TypeScript interface or enum. `Component` in `@cdk-x/core` is untouched and still available, but purely for **manual, hand-written L2 authoring** — this package never references it.

This mirrors how `cdk8s-cli` actually solves the equivalent problem for Kubernetes: only OpenAPI definitions carrying `x-kubernetes-group-version-kind` become `ApiObject` construct classes; everything else, regardless of nesting, becomes a plain interface via `json2jsii`'s `TypeGenerator`. Adopting `json2jsii` directly (rather than a hand-rolled equivalent) eliminates the entire classification/cardinality problem that made the earlier design fragile.

**Classification is pluggable per schema format**, via `SchemaClassifier` (`src/lib/schema-classifier/`): `SingleRootClassifier` — the only implementation that exists today — treats a single-file schema document's own root as the one Resource, full stop. A future Kubernetes-style provider needing many Resources per document (one per `x-kubernetes-group-version-kind`-marked OpenAPI definition) would plug in a different classifier; `ClassifiedSchema.roots` is already `readonly ResourceRootDescriptor[]` (0..N) for exactly this reason, even though only the 1-root case is exercised today.

## File-by-file

### `src/lib/schema-classifier/schema-classifier.ts` — the pluggable seam

Pure types + the `SchemaClassifier` contract (`classify(schema, options?) → ClassifiedSchema`). No logic.

### `src/lib/single-root-classifier/single-root-classifier.ts` — `SingleRootClassifier`

The only classifier wired in today. Always returns one root at JSON Pointer `"#"` with the caller-supplied `resourceType` — a single-file schema has no reliable self-describing name to derive one from.

### `src/lib/schema-normalizer/schema-normalizer.ts` — `SchemaNormalizer`

The one genuinely hard, new piece: a pure `JSONSchema4 → JSONSchema4` tree transform, run once before anything reaches `json2jsii`. `json2jsii` already ignores most JSON Schema composition/validation keywords it can't represent (`if`/`then`/`else`, mixed-type `oneOf`/`anyOf`, `allOf` composition) by silently falling back to a permissive type — confirmed against its source, not just its docs. This normalizer only intervenes where that silent fallback is either **wrong** (real data loss, not just imprecision) or **worth documenting** rather than left unobvious:

- **`patternProperties` rewrite** — `json2jsii` has zero support for it at all, not even a safe fallback; a pattern coexisting with `additionalProperties` silently _drops_ the pattern-matched fields from the emitted interface with no error. Always rewritten, via three sub-cases (a real `additionalProperties` already present → pattern dropped; `properties` present, pattern is a literal alternation like `^branches(-ignore)?$` → expanded into named optional properties; neither → the pattern's subschema becomes `additionalProperties`).
- **Trivial single-`$ref` `allOf`** (`allOf: [{ $ref: X }]`) — collapsed straight to `$ref: X` when that's the node's _only_ content; when the node also declares its own shape (real composition, e.g. GitHub's `on.<event>` trigger objects extending the essentially-content-free `eventObject`), the wrapper is dropped and the node's own local shape kept.
- **Constraint-only `oneOf`/`anyOf`** (every branch is bare `{ required: [...] }`, e.g. `step`'s `uses`/`run`/`wait`/… mutual exclusivity) — dropped, exclusivity noted in `description` instead of silently vanishing.
- **`#/definitions/configuration`'s self-reference** (`github-workflow.json`, used by `env`/`matrix`) — resolves safely to a permissive type on its own; documented via a `@remarks` note rather than left an unexplained `any`. One specific definition, not a generic recursive-`$ref` detector.
- **`if`/`then`/`else`** — left structurally untouched (already ignored by `json2jsii`), just annotated.
- **Inline union branch names** — for a real structural-variant union where a branch is an inline object instead of a `$ref`, synthesizes a name and hoists it into `definitions`. Not exercised by either real GitHub schema today (every real variant union there is already `$ref`-only); implemented and tested against synthetic fixtures.

### `src/lib/union-override/union-override.ts` — `UnionOverride`, `UnionOverrideMatcher`

Shared types + matcher for the one class of problem `SchemaNormalizer` deliberately does **not** paper over: a real structural-variant union (branches `$ref` different named object definitions, e.g. `jobs`: `normalJob` | `reusableWorkflowCallJob`) where `json2jsii`'s default behavior — silently fall back to `any` — is wrong enough that an entire flagship type (`NormalJob`, `Step`, `ServiceContainer`, everything reachable only through `jobs`) would never get generated at all. `UnionOverrideMatcher.matches()` is the single source of truth both `Json2jsiiAdapter` and `PropsSerializerGenerator` use to recognize the same occurrence, so they can never disagree about where a union override applies.

### `src/lib/type-naming/type-naming.ts` — `TypeNaming`

Definition-name → PascalCase-type-name derivation (`TypeGenerator.normalizeTypeName()` composed with `json2jsii`'s own dot-segment-pascalCase-join rule), and `$ref` → definition-name extraction. Shared by `PropsSerializerGenerator` and `UnionDetector` so both always compute the exact same type name `json2jsii` would for a given `$ref`.

### `src/lib/property-naming/property-naming.ts` — `PropertyNaming`

Schema-key → camelCase-TS-property-name derivation, copied verbatim from `json2jsii`'s own `emitProperty` (strip a leading `$`, replace `/` with `_`, `camelcase()`, suffix `_` on a jsii-reserved name). Shared by `PropsSerializerGenerator` (for `obj.<name>` accessors) and `UnionDetector` (for discriminant checks — see below; a real bug was caught here: a discriminant check runs against the _TypeScript_ value at serialization time, still camelCased, not the original schema key, so it must go through this same conversion).

### `src/lib/union-detector/union-detector.ts` — `UnionDetector`

Auto-detects every real structural-variant union in a schema (a `oneOf`/`anyOf` where all branches are pure `{ $ref }`) and auto-resolves each into a `UnionOverride`, so a provider's `project.json` never needs to hand-enumerate them — doesn't scale to a large schema, and previously meant a schema update introducing a new union degraded silently to `any` with no error. A field is a usable discriminant only if it's `required` by exactly one variant _and_ isn't even a declared property (required or not) on any other — checked against `TypeNaming`-resolved `$ref` targets, not just branch shape, after two real false-positive bugs (a bare-primitive branch, and a `$ref` to a primitive-typed definition, both wrongly treated as "object-shaped" by an earlier, looser check in `SchemaNormalizer`'s inline-union-hoisting). More than one variant lacking a discriminant is genuinely ambiguous and **throws** rather than guessing — a caller-supplied `UnionOverride` (matched by variant definition names) always wins over auto-resolution and is the escape hatch for that case. The union's own name is the longest common PascalCase-word suffix of the variants' type names, falling back to joining them with `Or`.

### `src/lib/json2jsii-adapter/json2jsii-adapter.ts` — `Json2jsiiAdapter`

Thin wrapper around `json2jsii`'s `TypeGenerator`, run with **`toJson: false`** — `json2jsii`'s own serialization-function generation (`export function toJson_X(...)`) is a standalone top-level function, which conflicts with this workspace's OOP-only rule (CLAUDE.md: no loose exported functions, only static methods on classes). Types/enums only; serialization is generated independently by `PropsSerializerGenerator`.

Handles the one real engineering wrinkle in adopting `json2jsii`: making a `UnionOverride`'s real union type actually get emitted and referenced correctly. `TypeGenerator`'s `$ref` resolution only ever returns an already-fully-_rendered_ type, never a merely-_registered_ one (rendering is lazy, via a FIFO queue) — so a naive `emitCustomType()` call is never actually found by the property that should use it. The fix is controlling emission **order**: this adapter builds its own `TypeGenerator` (not `TypeGenerator.forStruct()`, which always emits the root struct first) and explicitly emits every union override's variant types, then the union type itself, _before_ emitting the root struct. A second wrinkle — a real union is often written _inline_ at its use site with no intermediate named `$ref` (this is `jobs`'s actual shape) — is handled by rewriting every matching inline occurrence into a `$ref` first, turning it into the already-solved named-`$ref` case.

### `src/lib/props-serializer-generator/props-serializer-generator.ts` — `PropsSerializerGenerator`

Generates the `toProperties()` serialization logic `Json2jsiiAdapter` deliberately no longer generates: walks the _same_ normalized schema independently and emits one static-only class per Resource file (e.g. `WorkflowSerializer`), with one `toJson<Type>` method per reachable struct type — satisfying the OOP-only rule without post-processing `json2jsii`'s rendered text (which was considered and rejected: fragile against future `json2jsii` rendering-format changes, since nothing pins its exact output shape).

Property names (kebab-case → camelCase) and nested type names are derived using `json2jsii`'s _own_ naming primitives — the `camelcase` npm package, pinned to the exact version `json2jsii` itself depends on, and `TypeGenerator.normalizeTypeName()`, a public static method re-exported directly from `json2jsii` — rather than a reimplementation of them, so the two generators' outputs can't independently drift apart. Method names use `toJson<Type>` (no underscore) specifically because jsii's compiler rejects non-camelCase member names (`JSII8002`) — caught by running real `jsii-compile` against the generated output, not by inspection.

### `src/lib/resource-wrapper-generator/resource-wrapper-generator.ts` — `ResourceWrapperGenerator`

Generates the `Resource` subclass itself: `resourceType`, `apiVersion`, a constructor taking a single `props` bag (not flattened individual members — `json2jsii` already owns every naming/casing decision for the props type; re-deriving them a second time here would risk drift), and `toProperties()` delegating to the serializer class. Standing regression test: the generated class source must never contain the string `Component`.

### `src/lib/deploy-metadata-generator/deploy-metadata-generator.ts` — `DeployMetadataGenerator`

Unchanged by this redesign — orthogonal concern. Emits a small, separate `*.deploy.generated.ts` file carrying a Resource's `mode` (`"synth-only"` vs `"deploy"`) as metadata for a not-yet-built deploy engine; never affects the generated class shape.

### `src/internal/naming.ts` — `Naming`

Casing helpers, kept from the earlier design, still used where a value needs casing logic independent of `json2jsii`'s own (not the `PropsSerializerGenerator`'s property/type naming, which deliberately uses `json2jsii`'s primitives directly instead — see above).

## Known limitations (v1 scope)

- **One schema document → one Resource root.** `SingleRootClassifier` never returns more than one root; a Kubernetes-style multi-Kind-per-file OpenAPI document would need a different classifier (interface already supports it — `ClassifiedSchema.roots` is 0..N — but no implementation exists).
- **No cross-file `$ref`.** Every provider schema so far is a single, self-contained file; `@apidevtools/json-schema-ref-parser` (or similar) was deliberately left out of scope until a real provider needs it.
- **Auto-resolution needs a uniquely-required discriminant field.** `UnionDetector` throws for a real structural-variant union where two or more variants share no exclusively-required property — a genuinely ambiguous shape needs a hand-written `UnionOverride` (the `project.json` `unionOverrides` escape hatch), which is rare but not eliminated.
- **Recursion depth.** `SchemaNormalizer.documentRecursiveSelfRef` handles exactly one known real occurrence (`#/definitions/configuration`); a different provider's recursive type would need either the same treatment or a generic detector, not yet built.
