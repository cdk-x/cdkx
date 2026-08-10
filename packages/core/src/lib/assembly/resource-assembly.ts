import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ManifestEntry } from '../synth/synth.js';

/**
 * Schema version for the resource assembly's `manifest.json`. Bump this on
 * breaking changes to the on-disk shape.
 */
export const MANIFEST_VERSION = '1.0.0';

/**
 * Stack-level properties describing where a Stack artifact's output lives.
 */
export interface StackArtifactProperties {
  /**
   * The Stack's template file name, relative to the resource assembly's
   * output directory (e.g. `"GithubStack.json"`).
   */
  readonly templateFile: string;
}

/**
 * A single Stack's entry within `manifest.json` — points at the file
 * holding that Stack's synthesized resources.
 */
export interface StackArtifact {
  /**
   * The artifact type discriminator. Always `"cdkx:stack"` — the only
   * artifact type a resource assembly produces today.
   */
  readonly artifactType: 'cdkx:stack';

  /**
   * Stack-level properties describing where this Stack's output lives.
   */
  readonly properties: StackArtifactProperties;
}

/**
 * The full content of the `manifest.json` file written to an App's output
 * directory — an index of every Stack artifact in the resource assembly.
 */
export interface ResourceAssemblyManifest {
  /**
   * Schema version, see {@link MANIFEST_VERSION}.
   */
  readonly version: string;

  /**
   * Every Stack artifact in this resource assembly, keyed by Stack id.
   */
  readonly artifacts: Record<string, StackArtifact>;
}

/**
 * Writes an App's synthesized manifests to disk as a resource assembly: one
 * `<StackId>.json` file per Stack, plus a `manifest.json` index referencing
 * each of them. Mirrors the AWS CDK cloud assembly's manifest/template
 * split, generalized beyond cloud resources — a Stack's resources may be
 * cloud infrastructure, GitHub configuration, or any other provider's
 * resource type.
 * Not instantiable — mirrors the static-only utility class pattern used
 * elsewhere in the package (Stack.of(), Resource.of()).
 */
export class ResourceAssemblyWriter {
  private constructor() {} // no instances — static-only class

  /**
   * Writes every Stack's manifest to `<outdir>/<stackId>.json`, then writes
   * the `manifest.json` index referencing them.
   *
   * @param outdir - the directory to write the resource assembly to.
   * Created (recursively) if it doesn't already exist.
   * @param manifests - the synthesized manifests, keyed by Stack id, as
   * produced by {@link Synthesizer.synthesize}.
   * @example
   * ResourceAssemblyWriter.write(app.outdir, Synthesizer.synthesize(app));
   */
  public static write(
    outdir: string,
    manifests: Record<string, Record<string, ManifestEntry>>,
  ): void {
    fs.mkdirSync(outdir, { recursive: true });

    const artifacts: Record<string, StackArtifact> = {};
    for (const [stackId, manifest] of Object.entries(manifests)) {
      const templateFile = `${stackId}.json`;
      fs.writeFileSync(
        path.join(outdir, templateFile),
        JSON.stringify(manifest, null, 2),
      );
      artifacts[stackId] = {
        artifactType: 'cdkx:stack',
        properties: { templateFile },
      };
    }

    const manifest: ResourceAssemblyManifest = {
      version: MANIFEST_VERSION,
      artifacts,
    };
    fs.writeFileSync(
      path.join(outdir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
    );
  }
}
