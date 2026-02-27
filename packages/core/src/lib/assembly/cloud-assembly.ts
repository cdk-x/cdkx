import * as fs from 'node:fs';
import * as path from 'node:path';

/** Schema version for the manifest file. Increment on breaking changes. */
export const MANIFEST_VERSION = '1.0.0';

/**
 * Describes a single stack artifact in the synthesis output.
 * Written into `manifest.json` — contains only non-sensitive metadata.
 */
export interface StackArtifact {
  /** Unique artifact ID within the assembly. Also used as the output file name stem. */
  readonly id: string;

  /** Output file name (e.g. `'k8s-stack.yaml'`, `'hetzner-stack.json'`). */
  readonly file: string;

  /** Provider identifier (e.g. `'kubernetes'`, `'hetzner'`). From `Provider.identifier`. */
  readonly provider: string;

  /** Human-readable display name. Typically the construct node path. */
  readonly displayName?: string;
}

/**
 * The full content of the `manifest.json` file written to `cdkx.out/`.
 */
export interface CloudAssemblyManifest {
  /** Schema version — used by the CLI to detect incompatible manifests. */
  readonly version: string;

  /** All stack artifacts in this assembly. */
  readonly stacks: StackArtifact[];
}

/**
 * Mutable builder for a `CloudAssembly`.
 *
 * Created by `App` at the start of synthesis. Synthesizers use it to:
 * - Write output files via `writeFile()`
 * - Register stack artifacts via `addArtifact()`
 *
 * Once all stacks are synthesized, `App` calls `buildAssembly()` which
 * writes `manifest.json` and returns the immutable `CloudAssembly`.
 */
export class CloudAssemblyBuilder {
  private readonly artifacts: StackArtifact[] = [];

  constructor(
    /** Absolute path to the output directory (e.g. `/project/cdkx.out`). */
    public readonly outdir: string,
  ) {}

  /**
   * Writes a file into the output directory.
   * Creates the directory if it does not exist.
   */
  public writeFile(fileName: string, content: string): void {
    if (!fs.existsSync(this.outdir)) {
      fs.mkdirSync(this.outdir, { recursive: true });
    }
    fs.writeFileSync(path.join(this.outdir, fileName), content, 'utf-8');
  }

  /**
   * Registers a stack artifact.
   * Called by each `IStackSynthesizer` after writing its output file.
   */
  public addArtifact(artifact: StackArtifact): void {
    if (this.artifacts.some((a) => a.id === artifact.id)) {
      throw new Error(`Duplicate artifact ID '${artifact.id}'. Each stack must have a unique artifact ID.`);
    }
    this.artifacts.push(artifact);
  }

  /**
   * Seals the assembly: writes `manifest.json` and returns the immutable `CloudAssembly`.
   * Should be called exactly once, at the end of `App.synth()`.
   */
  public buildAssembly(): CloudAssembly {
    const manifest: CloudAssemblyManifest = {
      version: MANIFEST_VERSION,
      stacks: [...this.artifacts],
    };

    this.writeFile('manifest.json', JSON.stringify(manifest, null, 2));

    return new CloudAssembly(this.outdir, manifest);
  }
}

/**
 * Immutable, sealed synthesis output.
 *
 * Returned by `App.synth()`. Represents the complete `cdkx.out/` directory
 * with all stack artifacts registered in `manifest.json`.
 */
export class CloudAssembly {
  constructor(
    /** Absolute path to the output directory. */
    public readonly outdir: string,

    /** The parsed manifest. */
    public readonly manifest: CloudAssemblyManifest,
  ) {}

  /**
   * Returns the artifact for a given stack ID, or `undefined` if not found.
   */
  public getStack(id: string): StackArtifact | undefined {
    return this.manifest.stacks.find((s) => s.id === id);
  }

  /**
   * Returns all stack artifacts in this assembly.
   */
  public get stacks(): StackArtifact[] {
    return this.manifest.stacks;
  }
}
