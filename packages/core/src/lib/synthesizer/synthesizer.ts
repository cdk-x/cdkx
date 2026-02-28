import * as fs from 'node:fs';
import * as path from 'node:path';
import { ProviderResource } from '../provider-resource/provider-resource.js';
import { CloudAssemblyBuilder } from '../assembly/cloud-assembly.js';

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

  /** The provider identifier (e.g. `'kubernetes'`, `'hetzner'`). */
  readonly providerIdentifier: string;

  /**
   * Provider-specific deployment target metadata.
   * Populated from `Provider.getEnvironment()`.
   */
  readonly environment: Record<string, unknown>;

  /** Human-readable display name (typically the construct node path). */
  readonly displayName: string;

  /** Returns all ProviderResource constructs in this stack. */
  getProviderResources(): ProviderResource[];
}

/**
 * Synthesizer that produces a JSON file.
 *
 * Output format — a keyed object where each key is the resource's logical ID:
 * ```json
 * {
 *   "MyStackWebServer3A1B2C3D": {
 *     "type": "hetzner::Server",
 *     "properties": { ... },
 *     "metadata": { "cdkx:path": "MyStack/WebServer/Resource" }
 *   },
 *   "MyStackFirewallE5F6A7B8": {
 *     "type": "hetzner::Firewall",
 *     "properties": { ... },
 *     "metadata": { "cdkx:path": "MyStack/Firewall" }
 *   }
 * }
 * ```
 */
export class JsonSynthesizer implements IStackSynthesizer {
  protected stack!: IStackRef;

  public bind(stack: IStackRef): void {
    this.stack = stack;
  }

  public synthesize(session: ISynthesisSession): void {
    // Merge all per-resource keyed objects into a single map
    const resourceMap = Object.assign({}, ...this.stack.getProviderResources().map((r) => r.toJson()));
    const fileName = `${this.stack.artifactId}.json`;
    const content = JSON.stringify(resourceMap, null, 2);

    this.writeFile(session.outdir, fileName, content);

    session.assembly.addArtifact({
      id: this.stack.artifactId,
      provider: this.stack.providerIdentifier,
      environment: this.stack.environment,
      templateFile: fileName,
      displayName: this.stack.displayName,
    });
  }

  protected writeFile(outdir: string, fileName: string, content: string): void {
    if (!fs.existsSync(outdir)) {
      fs.mkdirSync(outdir, { recursive: true });
    }
    fs.writeFileSync(path.join(outdir, fileName), content, 'utf-8');
  }
}
