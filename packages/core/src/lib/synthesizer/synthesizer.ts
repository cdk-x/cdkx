import * as fs from 'node:fs';
import * as path from 'node:path';
import { ProviderResource } from '../provider-resource/provider-resource';
import { CloudAssemblyBuilder } from '../assembly/cloud-assembly';
import { StackOutput } from '../stack-output/stack-output';

/**
 * The session object passed to `IStackSynthesizer.synthesize()`.
 * Provides access to the output directory and the assembly builder
 * for registering synthesized artifacts.
 */
export interface ISynthesisSession {
  /** Absolute path to the output directory (e.g. `/project/cdkx.out`). */
  readonly outdir: string;

  /** The assembly builder — use it to write files and register stack artifacts. */
  readonly assembly: CloudAssemblyBuilder;
}

/**
 * Interface that all stack synthesizers must implement.
 *
 * A synthesizer is responsible for:
 * 1. Collecting all `ProviderResource` descendants from a stack
 * 2. Calling `resource.toJson()` on each to obtain resolved plain objects
 * 3. Serializing those objects to a file in the output directory
 * 4. Registering the output file as an artifact in the `CloudAssemblyBuilder`
 */
export interface IStackSynthesizer {
  /**
   * Called once when the synthesizer is associated with a stack.
   * Use this to store a reference to the stack for use during `synthesize()`.
   */
  bind(stack: IStackRef): void;

  /**
   * Called during `app.synth()` to produce the stack's output artifact.
   */
  synthesize(session: ISynthesisSession): void;

  /**
   * Optional. Returns the artifact IDs of stacks this stack depends on.
   * Called by `App.synth()` before writing any files so that cross-stack
   * cycles can be detected and reported without producing partial output.
   */
  collectDependencies?(): string[];
}

/**
 * Minimal interface describing the stack information a synthesizer needs.
 * Using an interface here instead of the concrete `Stack` class avoids a
 * circular dependency between the synthesizer and the stack modules.
 */
export interface IStackRef {
  /** The artifact ID — used as the output file name (without extension). */
  readonly artifactId: string;

  /** Human-readable display name (typically the construct node path). */
  readonly displayName: string;

  /** Returns all ProviderResource constructs in this stack. */
  getProviderResources(): ProviderResource[];

  /** Returns all StackOutput constructs declared in this stack. */
  getOutputs(): StackOutput[];

  /**
   * Resolves a single value through this stack's resolver pipeline.
   * Used by the synthesizer to resolve output token values at synthesis time.
   */
  resolveOutputValue(value: unknown): unknown;
}

/**
 * Abstract base class for all stack synthesizers.
 *
 * Provides `bind()` and a shared `writeFileTo()` helper so that concrete
 * synthesizers (e.g. `JsonSynthesizer`, `YamlFileSynthesizer`) don't
 * duplicate the logic of creating directories and writing files.
 */
export abstract class BaseStackSynthesizer implements IStackSynthesizer {
  protected stack!: IStackRef;

  public bind(stack: IStackRef): void {
    this.stack = stack;
  }

  public abstract synthesize(session: ISynthesisSession): void;

  public collectDependencies?(): string[];

  protected writeFileTo(dir: string, name: string, content: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, name), content, 'utf-8');
  }
}

/**
 * Synthesizer that produces a JSON file.
 *
 * Output format — a keyed object with two top-level keys:
 * ```json
 * {
 *   "resources": {
 *     "MyStackWebServer3A1B2C3D": {
 *       "type": "hetzner::Server",
 *       "properties": { ... },
 *       "metadata": { "cdkx:path": "MyStack/WebServer/Resource" }
 *     }
 *   },
 *   "outputs": {
 *     "ServerId": { "value": "resolved-value-or-token", "description": "..." }
 *   }
 * }
 * ```
 *
 * The `"outputs"` key is omitted when the stack declares no outputs.
 */
export class JsonSynthesizer extends BaseStackSynthesizer {
  /**
   * Returns the artifact IDs of stacks this stack depends on, by resolving
   * all resource properties and scanning for `{ stackRef }` tokens.
   * No files are written.
   */
  public override collectDependencies(): string[] {
    const resources = Object.assign(
      {},
      ...this.stack.getProviderResources().map((r) => r.toJson()),
    );
    const stackRefs = new Set<string>();
    this.collectStackRefs(resources, stackRefs);
    return Array.from(stackRefs);
  }

  public synthesize(session: ISynthesisSession): void {
    // Merge all per-resource keyed objects into a single map
    const resources = Object.assign(
      {},
      ...this.stack.getProviderResources().map((r) => r.toJson()),
    );

    // Resolve output values through the stack's resolver pipeline
    const stackOutputs = this.stack.getOutputs();
    const outputs: Record<string, { value: unknown; description?: string }> =
      {};
    for (const output of stackOutputs) {
      const resolved = this.stack.resolveOutputValue(output.value);
      const entry: { value: unknown; description?: string } = {
        value: resolved,
      };
      if (output.description !== undefined) {
        entry.description = output.description;
      }
      outputs[output.outputKey] = entry;
    }

    const templateContent: Record<string, unknown> = { resources };
    if (stackOutputs.length > 0) {
      templateContent['outputs'] = outputs;
    }

    const fileName = `${this.stack.artifactId}.json`;
    const content = JSON.stringify(templateContent, null, 2);

    // Collect cross-stack references from the resolved template
    const stackRefs = new Set<string>();
    this.collectStackRefs(resources, stackRefs);

    this.writeFileTo(session.outdir, fileName, content);

    session.assembly.addArtifact({
      id: this.stack.artifactId,
      templateFile: fileName,
      displayName: this.stack.displayName,
      outputKeys:
        stackOutputs.length > 0
          ? stackOutputs.map((o) => o.outputKey)
          : undefined,
      dependencies: stackRefs.size > 0 ? Array.from(stackRefs) : undefined,
    });
  }

  /**
   * Recursively walks a resolved value and collects the `stackRef` string from
   * every `{ stackRef: string, outputKey: string }` object found.
   * Mirrors `collectRefLogicalIds` on `ProviderResource` but for cross-stack refs.
   */
  private collectStackRefs(value: unknown, refs: Set<string>): void {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      for (const item of value) {
        this.collectStackRefs(item, refs);
      }
      return;
    }
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      if (typeof obj['stackRef'] === 'string' && 'outputKey' in obj) {
        refs.add(obj['stackRef']);
        return;
      }
      for (const v of Object.values(obj)) {
        this.collectStackRefs(v, refs);
      }
    }
  }
}

/**
 * Typed wrapper around `js-yaml` that satisfies the no-`any` rule.
 * The cast is localised here — same pattern as `Lazy.any()`.
 */
export class YamlSerializer {
  public static dump(data: unknown): string {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const yaml = require('js-yaml') as { dump: (data: unknown) => string };
    return yaml.dump(data);
  }
}

/**
 * Abstract base for YAML-producing synthesizers.
 * Provides `serialize()` via `YamlSerializer`.
 */
export abstract class YamlSynthesizer extends BaseStackSynthesizer {
  protected serialize(data: unknown): string {
    return YamlSerializer.dump(data);
  }
}

export interface YamlFileSynthesizerOptions {
  /** Absolute or relative path to the directory where YAML files will be written. */
  readonly outputDir: string;

  /**
   * Optional output filename override for the synthesized YAML file.
   * When set, this filename is used instead of deriving it from the resource's
   * `name` property or logicalId. Follows the one-stack-per-file model.
   *
   * @example
   * ```ts
   * new YamlFileSynthesizer({ outputDir: '.', fileName: 'multipass.yaml' })
   * ```
   */
  readonly fileName?: string;
}

/**
 * Synthesizer that writes one YAML file per root resource into `outputDir`.
 *
 * A resource is a **root** if none of its properties contain a `{ ref, attr }`
 * token pointing to another resource in the same stack. Resources whose
 * `{ ref, attr }` token matches a sibling resource are **children** — they are
 * nested under their parent's YAML output under a key derived from the last
 * segment of their type name, pluralised with a plain `+s`
 * (e.g. `Multipass::VM::Network` → `networks`).
 *
 * Fields whose value is a `{ ref, attr }` token are excluded from the YAML
 * output entirely (they are the composition signal, not user data).
 *
 * If a resource declares an `outputFileName` string property, that value is
 * used as the output filename and excluded from the YAML content. Otherwise
 * the filename defaults to `${props.name}.yaml` when a `name` property
 * exists, or `${logicalId}.yaml`.
 *
 * Registers artifacts with type `cdkx:local-files` in the cloud assembly.
 */
export class YamlFileSynthesizer extends YamlSynthesizer {
  private readonly outputDir: string;
  private readonly fileName?: string;

  constructor(options: YamlFileSynthesizerOptions) {
    super();
    this.outputDir = options.outputDir;
    this.fileName = options.fileName;
  }

  public synthesize(): void {
    const resources = this.stack.getProviderResources();

    // Build a map from logicalId → resource for sibling lookup
    const byId = new Map<string, ProviderResource>();
    for (const r of resources) {
      byId.set(r.logicalId, r);
    }

    // Resolve each resource's output data through the pipeline so that
    // IResolvable instances become plain { ref, attr } / { ref } objects
    // before we inspect or serialize them.
    const resolvedDataOf = new Map<string, Record<string, unknown>>();
    for (const resource of resources) {
      const raw = resource.toOutputData();
      const resolved = this.resolveData(raw, resource);
      resolvedDataOf.set(
        resource.logicalId,
        resolved as Record<string, unknown>,
      );
    }

    // --- Pass 1: { ref, attr } child-composition (resource as child of another) ---
    // A resource is a child when one of its top-level fields IS a { ref, attr } token
    // pointing to a sibling. The token field is excluded from the child's output and
    // the child is nested under the sibling's YAML under a pluralised type-name key.
    const parentOf = new Map<string, string>(); // childLogicalId → parentLogicalId
    const refFieldsOf = new Map<string, Set<string>>(); // logicalId → token field names

    for (const resource of resources) {
      const data = resolvedDataOf.get(resource.logicalId) ?? {};
      const tokenFields = new Set<string>();
      for (const [field, value] of Object.entries(data)) {
        const ref = this.extractRefAttr(value);
        if (ref !== null && byId.has(ref)) {
          parentOf.set(resource.logicalId, ref);
          tokenFields.add(field);
        }
      }
      refFieldsOf.set(resource.logicalId, tokenFields);
    }

    // --- Pass 2: { ref } whole-object absorption ---
    // A resource is absorbed when another resource's array field contains
    // { ref: logicalId } (no attr) tokens pointing to it. Absorbed resources
    // do not produce their own files; their full resolved data is inlined into
    // the referencing resource's array field.
    const absorbedIds = new Set<string>();
    this.collectAbsorbedIds(resources, resolvedDataOf, byId, absorbedIds);

    // Partition into roots: neither a child nor absorbed
    const roots = resources.filter(
      (r) => !parentOf.has(r.logicalId) && !absorbedIds.has(r.logicalId),
    );
    const children = resources.filter((r) => parentOf.has(r.logicalId));

    // Group { ref, attr } children by parent
    const childrenOf = new Map<string, ProviderResource[]>();
    for (const child of children) {
      const parentId = parentOf.get(child.logicalId) ?? '';
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      const siblings = childrenOf.get(parentId);
      if (siblings) siblings.push(child);
    }

    // Detect filename collisions before writing anything
    const usedFileNames = new Set<string>();
    for (const root of roots) {
      const name = this.deriveFileName(
        resolvedDataOf.get(root.logicalId) ?? {},
        root.logicalId,
      );
      if (usedFileNames.has(name)) {
        throw new Error(
          `YamlFileSynthesizer: filename collision — two or more root resources ` +
            `would produce '${name}'. Use the fileNames option to assign unique filenames.`,
        );
      }
      usedFileNames.add(name);
    }

    // Write one file per root resource
    for (const root of roots) {
      const rootResolved = resolvedDataOf.get(root.logicalId) ?? {};
      const fileName = this.deriveFileName(rootResolved, root.logicalId);
      const content = this.buildRootContent(
        rootResolved,
        childrenOf.get(root.logicalId) ?? [],
        resolvedDataOf,
        refFieldsOf,
        byId,
      );
      const yamlContent = this.serialize(content);
      this.writeFileTo(this.outputDir, fileName, yamlContent);
    }
  }

  /**
   * Walks all resources and marks as absorbed any resource whose logicalId
   * appears as a `{ ref }` (no attr) token inside an array field of another
   * resource. A resource may be absorbed by multiple parents simultaneously
   * (shared reference).
   */
  private collectAbsorbedIds(
    resources: ProviderResource[],
    resolvedDataOf: Map<string, Record<string, unknown>>,
    byId: Map<string, ProviderResource>,
    absorbedIds: Set<string>,
  ): void {
    for (const resource of resources) {
      const data = resolvedDataOf.get(resource.logicalId) ?? {};
      for (const value of Object.values(data)) {
        if (!Array.isArray(value)) continue;
        for (const item of value) {
          const ref = this.extractWholeRef(item);
          if (ref !== null && byId.has(ref)) {
            absorbedIds.add(ref);
          }
        }
      }
    }
  }

  /**
   * Builds the plain object for a root resource, composing its children
   * under their pluralised type-name key.
   */
  private buildRootContent(
    rootData: Record<string, unknown>,
    children: ProviderResource[],
    resolvedDataOf: Map<string, Record<string, unknown>>,
    refFieldsOf: Map<string, Set<string>>,
    byId: Map<string, ProviderResource>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(rootData)) {
      result[field] = this.resolveWholeRefs(value, resolvedDataOf, byId);
    }

    // Compose { ref, attr } children under their pluralised type-name key
    for (const child of children) {
      const compositionKey = this.deriveCompositionKey(child.type);
      const childData = resolvedDataOf.get(child.logicalId) ?? {};
      const childTokenFields = refFieldsOf.get(child.logicalId) ?? new Set();
      const childContent: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(childData)) {
        if (childTokenFields.has(field)) continue;
        childContent[field] = value;
      }
      if (!result[compositionKey]) {
        result[compositionKey] = [];
      }
      (result[compositionKey] as unknown[]).push(childContent);
    }

    return result;
  }

  /**
   * Recursively replaces `{ ref }` (whole-object) tokens with the full resolved
   * data of the referenced resource. Handles arrays and nested objects.
   */
  private resolveWholeRefs(
    value: unknown,
    resolvedDataOf: Map<string, Record<string, unknown>>,
    byId: Map<string, ProviderResource>,
  ): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => {
        const ref = this.extractWholeRef(item);
        if (ref !== null && byId.has(ref)) {
          const refData = resolvedDataOf.get(ref) ?? {};
          // Recursively resolve nested whole-refs inside the absorbed resource
          return this.resolveWholeRefs(refData, resolvedDataOf, byId);
        }
        return this.resolveWholeRefs(item, resolvedDataOf, byId);
      });
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = this.resolveWholeRefs(v, resolvedDataOf, byId);
      }
      return result;
    }
    return value;
  }

  /**
   * Derives the YAML output filename for a root resource.
   *
   * Priority:
   * 1. `fileName` option (synthesizer-level override)
   * 2. `${name}.yaml` when a `name` property exists in the resolved data
   * 3. `${logicalId}.yaml`
   */
  private deriveFileName(
    data: Record<string, unknown>,
    logicalId: string,
  ): string {
    if (typeof this.fileName === 'string') {
      return this.fileName;
    }
    if (typeof data['name'] === 'string') {
      return `${data['name']}.yaml`;
    }
    return `${logicalId}.yaml`;
  }

  /**
   * Resolves a resource's output data through the built-in resolver pipeline
   * so that `IResolvable` tokens become plain `{ ref, attr }` objects.
   */
  private resolveData(data: unknown, resource: ProviderResource): unknown {
    // Lazily import to avoid circular deps — same pattern as ProviderResource.toJson()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ResolverPipeline } =
      require('../resolvables/resolver-pipeline') as {
        ResolverPipeline: {
          withBuiltins(): {
            resolve(
              key: string[],
              value: unknown,
              resource: object,
              provider: string,
            ): unknown;
          };
        };
      };
    const pipeline = ResolverPipeline.withBuiltins();
    const providerId = resource.type.split('::')[0].toLowerCase();
    return pipeline.resolve([], data, resource, providerId);
  }

  /**
   * Derives the composition key from the last segment of a resource type name,
   * lower-cased and pluralised with a plain `+s`.
   * e.g. `Multipass::VM::Network` → `networks`
   */
  private deriveCompositionKey(typeName: string): string {
    const segments = typeName.split('::');
    const last = segments[segments.length - 1].toLowerCase();
    return `${last}s`;
  }

  /**
   * If `value` is a `{ ref: string, attr: string }` token object, returns
   * the `ref` string. Otherwise returns `null`.
   */
  private extractRefAttr(value: unknown): string | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const obj = value as Record<string, unknown>;
    if (
      typeof obj['ref'] === 'string' &&
      typeof obj['attr'] === 'string' &&
      Object.keys(obj).length === 2
    ) {
      return obj['ref'];
    }
    return null;
  }

  /**
   * If `value` is a `{ ref: string }` whole-object token (no `attr`), returns
   * the `ref` string. Otherwise returns `null`.
   */
  private extractWholeRef(value: unknown): string | null {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const obj = value as Record<string, unknown>;
    if (
      typeof obj['ref'] === 'string' &&
      !('attr' in obj) &&
      Object.keys(obj).length === 1
    ) {
      return obj['ref'];
    }
    return null;
  }
}
