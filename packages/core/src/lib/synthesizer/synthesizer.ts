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
export class JsonSynthesizer implements IStackSynthesizer {
  protected stack!: IStackRef;

  public bind(stack: IStackRef): void {
    this.stack = stack;
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

    this.writeFile(session.outdir, fileName, content);

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

  protected writeFile(outdir: string, fileName: string, content: string): void {
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir, { recursive: true });
    }
    fs.writeFileSync(path.join(outdir, fileName), content, 'utf-8');
  }
}
