import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  AssemblyOutput,
  AssemblyResource,
  AssemblyStack,
} from './assembly-types';

// ─── Injected I/O deps ────────────────────────────────────────────────────────

export interface CloudAssemblyReaderDeps {
  /** Read a file and return its UTF-8 content. */
  readonly readFile?: (filePath: string) => string;
  /** Check whether a file exists. */
  readonly fileExists?: (filePath: string) => boolean;
}

// ─── Internal manifest shape (mirrors @cdkx-io/core cloud-assembly.ts) ─────────

interface ManifestArtifact {
  type: string;
  properties: { templateFile: string };
  displayName?: string;
  outputKeys?: string[];
  dependencies?: string[];
}

interface ManifestJson {
  version: string;
  artifacts: Record<string, ManifestArtifact>;
}

// ─── Internal stack template shape ────────────────────────────────────────────

interface TemplateResourceEntry {
  type: string;
  provider?: string;
  properties?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  dependsOn?: string[];
}

interface TemplateOutputEntry {
  value: unknown;
  description?: string;
}

interface StackTemplate {
  resources?: Record<string, TemplateResourceEntry>;
  outputs?: Record<string, TemplateOutputEntry>;
}

// ─── CloudAssemblyReader ──────────────────────────────────────────────────────

/**
 * Reads a cdkx cloud assembly from disk.
 *
 * Given the absolute path to an output directory (e.g. `cdkx.out/`),
 * `CloudAssemblyReader` parses `manifest.json` and each referenced stack
 * template to produce a fully-typed `AssemblyStack[]` ready for the
 * `DeploymentPlanner`.
 *
 * All I/O is synchronous and injectable for testing.
 *
 * @example
 * ```ts
 * const reader = new CloudAssemblyReader('/project/cdkx.out');
 * const stacks = reader.read();
 * ```
 */
export class CloudAssemblyReader {
  private readonly readFile: (filePath: string) => string;
  private readonly fileExists: (filePath: string) => boolean;

  constructor(
    /** Absolute path to the cloud assembly output directory. */
    private readonly outdir: string,
    deps: CloudAssemblyReaderDeps = {},
  ) {
    this.readFile = deps.readFile ?? ((p) => fs.readFileSync(p, 'utf-8'));
    this.fileExists = deps.fileExists ?? ((p) => fs.existsSync(p));
  }

  /**
   * Read and parse the full cloud assembly.
   *
   * Reads `manifest.json`, then each stack template referenced in it.
   * Infers cross-stack dependencies from `outputKeys` in the manifest.
   *
   * @throws if `manifest.json` is not found or is malformed.
   * @throws if any stack template file referenced in the manifest is missing.
   */
  public read(): AssemblyStack[] {
    const manifest = this.readManifest();
    const stacks = this.readStacks(manifest);
    return stacks;
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private readManifest(): ManifestJson {
    const manifestPath = path.join(this.outdir, 'manifest.json');
    if (!this.fileExists(manifestPath)) {
      throw new Error(
        `Cloud assembly manifest not found at '${manifestPath}'. ` +
          `Run 'cdkx synth' first to generate the cloud assembly.`,
      );
    }
    const raw = this.readFile(manifestPath);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new Error(
        `Failed to parse manifest.json at '${manifestPath}': invalid JSON.`,
      );
    }
    return parsed as ManifestJson;
  }

  private readStacks(manifest: ManifestJson): AssemblyStack[] {
    const stackIds = Object.keys(manifest.artifacts);

    return stackIds.map((stackId) => {
      const artifact = manifest.artifacts[stackId];
      const templatePath = path.join(
        this.outdir,
        artifact.properties.templateFile,
      );

      if (!this.fileExists(templatePath)) {
        throw new Error(
          `Stack template '${artifact.properties.templateFile}' not found at '${templatePath}'.`,
        );
      }

      const raw = this.readFile(templatePath);
      let template: StackTemplate;
      try {
        template = JSON.parse(raw) as StackTemplate;
      } catch {
        throw new Error(
          `Failed to parse stack template '${artifact.properties.templateFile}': invalid JSON.`,
        );
      }

      const resources = this.parseResources(template);
      const outputs = this.parseOutputs(template);
      const outputKeys = artifact.outputKeys ?? [];
      // Read stack dependencies directly from the manifest field written by
      // the synthesizer. This replaces the previous heuristic string-scan.
      const dependencies = artifact.dependencies ?? [];

      const stack: AssemblyStack = {
        id: stackId,
        templateFile: artifact.properties.templateFile,
        ...(artifact.displayName !== undefined
          ? { displayName: artifact.displayName }
          : {}),
        resources,
        outputs,
        outputKeys,
        dependencies,
      };
      return stack;
    });
  }

  private parseResources(template: StackTemplate): AssemblyResource[] {
    const resourceMap = template.resources ?? {};
    return Object.entries(resourceMap).map(([logicalId, entry]) => {
      // Extract provider from type if not explicitly set (backward compat)
      const providerId =
        entry.provider ?? entry.type.split('::')[0].toLowerCase();

      const resource: AssemblyResource = {
        logicalId,
        type: entry.type,
        provider: providerId,
        properties: entry.properties ?? {},
        ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
        ...(entry.dependsOn !== undefined && entry.dependsOn.length > 0
          ? { dependsOn: entry.dependsOn }
          : {}),
      };
      return resource;
    });
  }

  private parseOutputs(
    template: StackTemplate,
  ): Record<string, AssemblyOutput> {
    const outputMap = template.outputs ?? {};
    const result: Record<string, AssemblyOutput> = {};
    for (const [key, entry] of Object.entries(outputMap)) {
      result[key] = {
        value: entry.value,
        ...(entry.description !== undefined
          ? { description: entry.description }
          : {}),
      };
    }
    return result;
  }
}
