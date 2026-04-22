import * as path from 'node:path';
import { Construct } from 'constructs';
import { App } from '../app/app';
import { AssetPackaging } from '../assembly/cloud-assembly';
import { ISynthesisSession } from '../synthesizer/synthesizer';
import { AssetHasher } from './asset-hasher';
import { AssetStager } from './asset-stager';

/**
 * Properties for `Asset`. Exactly one of `path` or `directoryPath` must be
 * provided.
 */
export interface AssetProps {
  /**
   * Path to a local file to include in the cloud assembly. Relative paths are
   * resolved against the current working directory at construction time.
   */
  readonly path?: string;

  /**
   * Path to a local directory to include in the cloud assembly. Relative paths
   * are resolved against the current working directory at construction time.
   */
  readonly directoryPath?: string;
}

/**
 * An asset is any file or directory bundled into the cloud assembly during
 * synthesis.
 *
 * At synth time, the source is staged into `cdkx.out/assets/asset.<hash>/` and
 * registered as a `cdkx:asset` artifact in `manifest.json`. L1 constructs
 * consume the staged asset by reading `asset.absolutePath`, which is a plain
 * string known at construction time.
 */
export interface IAsset {
  /** SHA-256 hex digest of the asset's content. */
  readonly assetHash: string;

  /**
   * Absolute filesystem path to the staged asset inside the cloud assembly.
   * For file assets: `<outdir>/assets/asset.<hash>/<fileName>`.
   * For directory assets: `<outdir>/assets/asset.<hash>`.
   */
  readonly absolutePath: string;
}

/**
 * A local-file asset. Hashes the file contents at construction time and
 * exposes the staged file path as a plain string for use in resource
 * properties.
 *
 * @example
 * const asset = new Asset(stack, 'CloudInit', { path: './cloud-init.yaml' });
 * new Server(stack, 'Server', { userData: asset.absolutePath });
 */
export class Asset extends Construct implements IAsset {
  /** Type guard: returns true when `x` is an `Asset` instance. */
  public static isAsset(x: unknown): x is Asset {
    return x instanceof Asset;
  }

  /** SHA-256 hex digest of the file's contents. */
  public readonly assetHash: string;

  /** Absolute path to the source file. */
  public readonly sourcePath: string;

  /**
   * File name that will be used inside the staged asset directory.
   * Undefined for directory-packaged assets — the full tree is staged under
   * `asset.<hash>/` with no wrapping file name.
   */
  public readonly fileName: string | undefined;

  /** Absolute path to the staged asset inside the cloud assembly. */
  public readonly absolutePath: string;

  /** How the asset is packaged on disk. */
  public readonly packaging: AssetPackaging;

  constructor(scope: Construct, id: string, props: AssetProps) {
    super(scope, id);

    const hasPath = props.path !== undefined;
    const hasDirectoryPath = props.directoryPath !== undefined;

    if (hasPath && hasDirectoryPath) {
      throw new Error(
        `Asset '${id}': specify either 'path' or 'directoryPath', not both.`,
      );
    }
    if (!hasPath && !hasDirectoryPath) {
      throw new Error(
        `Asset '${id}': one of 'path' or 'directoryPath' must be provided.`,
      );
    }

    if (hasDirectoryPath) {
      this.sourcePath = path.resolve(props.directoryPath as string);
      this.packaging = 'directory';
      this.fileName = undefined;
      this.assetHash = AssetHasher.hashDirectory(this.sourcePath);
    } else {
      this.sourcePath = path.resolve(props.path as string);
      this.packaging = 'file';
      this.fileName = path.basename(this.sourcePath);
      this.assetHash = AssetHasher.hashFile(this.sourcePath);
    }

    const outdir = path.resolve(App.of(this).outdir);
    const assetDir = path.join(outdir, 'assets', `asset.${this.assetHash}`);
    this.absolutePath =
      this.packaging === 'directory'
        ? assetDir
        : path.join(assetDir, this.fileName as string);
  }

  /**
   * Stages the asset file into the cloud assembly and registers its artifact.
   *
   * Copies the source file to `<outdir>/assets/asset.<hash>/<fileName>` and
   * registers a `cdkx:asset` entry in `manifest.json`. Called by `App.synth()`
   * during Phase 0 (before stack synthesis).
   */
  public synthesizeAsset(session: ISynthesisSession): void {
    const artifactId = `asset.${this.assetHash}`;
    const relativeDir = path.posix.join('assets', artifactId);
    const absoluteDir = path.join(session.outdir, 'assets', artifactId);

    if (this.packaging === 'directory') {
      AssetStager.stageDirectory(this.sourcePath, absoluteDir);
      session.assembly.addAssetArtifact({
        id: artifactId,
        hash: this.assetHash,
        path: relativeDir,
        packaging: 'directory',
      });
      return;
    }

    const fileName = this.fileName as string;
    AssetStager.stageFile(this.sourcePath, absoluteDir, fileName);
    session.assembly.addAssetArtifact({
      id: artifactId,
      hash: this.assetHash,
      path: path.posix.join(relativeDir, fileName),
      packaging: 'file',
    });
  }
}
