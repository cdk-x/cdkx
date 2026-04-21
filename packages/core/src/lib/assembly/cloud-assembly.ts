import * as fs from 'node:fs';
import * as path from 'node:path';
import { AnnotationEntry } from '../annotations/annotation-types';

/** Schema version for the manifest file. Increment on breaking changes. */
export const MANIFEST_VERSION = '1.0.0';

/**
 * Artifact type discriminator.
 * - `'cdkx:stack'` — a cloud-deploy stack (JSON template, processed by the engine).
 * - `'cdkx:local-files'` — a file-rendering stack (YAML files written to the repo, not deployed).
 * - `'cdkx:asset'` — a staged asset (file or directory) referenced by stack resources.
 */
export type ArtifactType = 'cdkx:stack' | 'cdkx:local-files' | 'cdkx:asset';

/** How an asset is packaged on disk. */
export type AssetPackaging = 'file' | 'directory';

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

  /** Stack-level properties used by the runtime engine. */
  readonly properties: {
    /** Output file name (e.g. `'HetznerStack.json'`, `'KubernetesStack.json'`). */
    readonly templateFile: string;
  };

  /** Human-readable display name. Typically the construct node path. */
  readonly displayName?: string;

  /**
   * Keys of all outputs declared in this stack.
   * Listed here so the engine can discover cross-stack dependencies by reading
   * `manifest.json` alone, without parsing each stack template file.
   * Actual resolved values are written to the stack template under `"outputs"`.
   */
  readonly outputKeys?: string[];

  /**
   * Artifact IDs of stacks this stack depends on.
   * Populated at synthesis time when `StackOutput.importValue()` tokens are
   * detected in the resolved template. Used by the engine to order stack
   * deployment waves.
   */
  readonly dependencies?: string[];

  /**
   * Annotations (info, warnings, errors) attached to constructs in this stack.
   * Used for auditing and reporting by external tools.
   */
  readonly annotations?: AnnotationEntry[];
}

/**
 * A staged asset artifact entry in `manifest.json`.
 *
 * Shape (per artifact entry in `artifacts`):
 * ```json
 * {
 *   "type": "cdkx:asset",
 *   "properties": {
 *     "hash": "abc123ef…",
 *     "path": "assets/asset.abc123ef/cloud-init.yaml",
 *     "packaging": "file"
 *   }
 * }
 * ```
 */
export interface AssetArtifact {
  /** Artifact type discriminator — always `'cdkx:asset'`. */
  readonly type: 'cdkx:asset';

  /** Asset-level properties used by the runtime engine. */
  readonly properties: {
    /** SHA-256 hex digest of the asset's content. */
    readonly hash: string;
    /** Path to the staged asset, relative to the assembly outdir. */
    readonly path: string;
    /** How the asset is packaged (`'file'` or `'directory'`). */
    readonly packaging: AssetPackaging;
  };
}

/**
 * Any artifact entry in the assembly manifest.
 * Discriminate on `type` to narrow to `StackArtifact` or `AssetArtifact`.
 */
export type ManifestArtifact = StackArtifact | AssetArtifact;

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
  readonly artifacts: Record<string, ManifestArtifact>;
}

/**
 * Input shape for `CloudAssemblyBuilder.addArtifact()`.
 * Carries the artifact ID alongside the artifact data.
 */
export interface AddArtifactOptions {
  /** Unique artifact ID within the assembly. Used as the key in `artifacts`. */
  readonly id: string;

  /** Output file name. */
  readonly templateFile: string;

  /** Human-readable display name. */
  readonly displayName?: string;

  /**
   * Keys of all outputs declared in this stack (optional).
   * When present, the engine can resolve cross-stack output dependencies
   * from the manifest without reading the full stack template.
   */
  readonly outputKeys?: string[];

  /**
   * Artifact IDs of stacks this stack depends on (optional).
   * Inferred at synthesis time from `{ stackRef }` tokens in the resolved
   * template. When present, the engine uses these to order deployment waves.
   */
  readonly dependencies?: string[];

  /**
   * Artifact type. Defaults to `'cdkx:stack'` when omitted.
   * File-rendering synthesizers (e.g. `YamlFileSynthesizer`) pass `'cdkx:local-files'`.
   */
  readonly artifactType?: ArtifactType;
}

/**
 * Input shape for `CloudAssemblyBuilder.addAssetArtifact()`.
 */
export interface AddAssetArtifactOptions {
  /** Unique artifact ID within the assembly (e.g. `'asset.<hash>'`). */
  readonly id: string;

  /** SHA-256 hex digest of the asset's content. */
  readonly hash: string;

  /** Path to the staged asset, relative to the assembly outdir. */
  readonly path: string;

  /** How the asset is packaged on disk. */
  readonly packaging: AssetPackaging;
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
  private readonly artifacts: Record<string, ManifestArtifact> = {};

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
      type: options.artifactType ?? 'cdkx:stack',
      properties: { templateFile: options.templateFile },
      ...(options.displayName !== undefined
        ? { displayName: options.displayName }
        : {}),
      ...(options.outputKeys !== undefined && options.outputKeys.length > 0
        ? { outputKeys: options.outputKeys }
        : {}),
      ...(options.dependencies !== undefined && options.dependencies.length > 0
        ? { dependencies: options.dependencies }
        : {}),
    };
    this.artifacts[options.id] = artifact;
  }

  /**
   * Registers an asset artifact.
   * Called by `Asset.synthesizeAsset()` after staging the file on disk.
   */
  public addAssetArtifact(options: AddAssetArtifactOptions): void {
    if (this.artifacts[options.id] !== undefined) {
      throw new Error(
        `Duplicate artifact ID '${options.id}'. Each artifact must have a unique ID.`,
      );
    }
    const artifact: AssetArtifact = {
      type: 'cdkx:asset',
      properties: {
        hash: options.hash,
        path: options.path,
        packaging: options.packaging,
      },
    };
    this.artifacts[options.id] = artifact;
  }

  /**
   * Adds annotations to a stack artifact.
   * Called by App.synth() after collecting annotations from the construct tree.
   */
  public addAnnotations(
    artifactId: string,
    annotations: AnnotationEntry[],
  ): void {
    const artifact = this.artifacts[artifactId];
    if (artifact === undefined) {
      throw new Error(
        `Cannot add annotations: artifact '${artifactId}' not found. ` +
          `Make sure addArtifact() is called before addAnnotations().`,
      );
    }
    // Use type assertion since we're modifying a readonly field during building
    (
      this.artifacts[artifactId] as unknown as {
        annotations: AnnotationEntry[];
      }
    ).annotations = annotations;
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
   * Returns the stack artifact for a given ID, or `undefined` if not found
   * or if the ID refers to a non-stack artifact.
   */
  public getStack(id: string): StackArtifact | undefined {
    const artifact = this.manifest.artifacts[id];
    return artifact !== undefined && artifact.type !== 'cdkx:asset'
      ? (artifact as StackArtifact)
      : undefined;
  }

  /**
   * Returns all stack artifacts in this assembly (asset artifacts are excluded).
   */
  public get stacks(): StackArtifact[] {
    return Object.values(this.manifest.artifacts).filter(
      (a): a is StackArtifact => a.type !== 'cdkx:asset',
    );
  }
}
