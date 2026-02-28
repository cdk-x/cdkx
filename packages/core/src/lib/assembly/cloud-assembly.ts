import * as fs from 'node:fs';
import * as path from 'node:path';

/** Schema version for the manifest file. Increment on breaking changes. */
export const MANIFEST_VERSION = '1.0.0';

/**
 * Artifact type discriminator. Currently only `'cdkx:stack'` is defined.
 * Future types may include `'cdkx:asset-manifest'`, `'cdkx:tree'`, etc.
 */
export type ArtifactType = 'cdkx:stack';

/**
 * Describes a single stack artifact in the synthesis output.
 * Written into `manifest.json` — contains only non-sensitive metadata.
 *
 * Shape (per artifact entry in `artifacts`):
 * ```json
 * {
 *   "type": "cdkx:stack",
 *   "provider": "hetzner",
 *   "environment": { "project": "my-project", "datacenter": "nbg1" },
 *   "properties": { "templateFile": "HetznerStack.json" },
 *   "displayName": "HetznerStack"
 * }
 * ```
 */
export interface StackArtifact {
  /** Artifact type discriminator — always `'cdkx:stack'` for stack artifacts. */
  readonly type: ArtifactType;

  /** Provider identifier (e.g. `'kubernetes'`, `'hetzner'`). From `Provider.identifier`. */
  readonly provider: string;

  /**
   * Provider-specific deployment target metadata.
   * Populated from `Provider.getEnvironment()`. Contains non-sensitive information
   * that the runtime engine needs to know WHERE to deploy (e.g. cluster name,
   * datacenter, project ID). Never contains credentials.
   */
  readonly environment: Record<string, unknown>;

  /** Stack-level properties used by the runtime engine. */
  readonly properties: {
    /** Output file name (e.g. `'HetznerStack.json'`, `'KubernetesStack.json'`). */
    readonly templateFile: string;
  };

  /** Human-readable display name. Typically the construct node path. */
  readonly displayName?: string;
}

/**
 * The full content of the `manifest.json` file written to `cdkx.out/`.
 */
export interface CloudAssemblyManifest {
  /** Schema version — used by the CLI to detect incompatible manifests. */
  readonly version: string;

  /**
   * All artifacts in this assembly, keyed by their artifact ID.
   * The artifact ID is the stack's `artifactId` (derived from the construct node path).
   */
  readonly artifacts: Record<string, StackArtifact>;
}

/**
 * Input shape for `CloudAssemblyBuilder.addArtifact()`.
 * Carries the artifact ID alongside the artifact data.
 */
export interface AddArtifactOptions {
  /** Unique artifact ID within the assembly. Used as the key in `artifacts`. */
  readonly id: string;

  /** Provider identifier. */
  readonly provider: string;

  /** Provider environment metadata from `Provider.getEnvironment()`. */
  readonly environment: Record<string, unknown>;

  /** Output file name. */
  readonly templateFile: string;

  /** Human-readable display name. */
  readonly displayName?: string;
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
  private readonly artifacts: Record<string, StackArtifact> = {};

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
  public addArtifact(options: AddArtifactOptions): void {
    if (this.artifacts[options.id] !== undefined) {
      throw new Error(
        `Duplicate artifact ID '${options.id}'. Each stack must have a unique artifact ID.`,
      );
    }
    const artifact: StackArtifact = {
      type: 'cdkx:stack',
      provider: options.provider,
      environment: options.environment,
      properties: { templateFile: options.templateFile },
      ...(options.displayName !== undefined
        ? { displayName: options.displayName }
        : {}),
    };
    this.artifacts[options.id] = artifact;
  }

  /**
   * Seals the assembly: writes `manifest.json` and returns the immutable `CloudAssembly`.
   * Should be called exactly once, at the end of `App.synth()`.
   */
  public buildAssembly(): CloudAssembly {
    const manifest: CloudAssemblyManifest = {
      version: MANIFEST_VERSION,
      artifacts: { ...this.artifacts },
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
    return this.manifest.artifacts[id];
  }

  /**
   * Returns all stack artifacts in this assembly as an array (convenience getter).
   */
  public get stacks(): StackArtifact[] {
    return Object.values(this.manifest.artifacts);
  }
}
