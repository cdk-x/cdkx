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

// ─── Internal manifest shape (mirrors @cdk-x/core cloud-assembly.ts) ─────────

interface ManifestArtifact {
  type: string;
  provider: string;
  environment: Record<string, unknown>;
  properties: { templateFile: string };
  displayName?: string;
  outputKeys?: string[];
}

interface ManifestJson {
  version: string;
  artifacts: Record<string, ManifestArtifact>;
}

// ─── Internal stack template shape ────────────────────────────────────────────

interface TemplateResourceEntry {
  type: string;
  properties?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
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

    // Build a set of all output keys across all stacks so we can infer
    // cross-stack dependencies: stack B depends on stack A if any of B's
    // resource properties contain { ref } tokens pointing to a resource
    // in A. However, at read time we do the simpler manifest-level check:
    // B depends on A when A declares an output key that B's template
    // references via its own output values or properties.
    // The full { ref, attr } dependency scan is left to DeploymentPlanner.
    // Here we compute the simpler output-key-based dependency: if stack B's
    // template outputs reference an outputKey declared by stack A, B depends on A.

    // First pass: read all stack templates and build output key → stackId map.
    const outputKeyToStack = new Map<string, string>();
    for (const stackId of stackIds) {
      const artifact = manifest.artifacts[stackId];
      for (const key of artifact.outputKeys ?? []) {
        outputKeyToStack.set(key, stackId);
      }
    }

    // Second pass: fully parse each stack and determine dependencies.
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
      const dependencies = this.inferDependencies(
        stackId,
        template,
        outputKeyToStack,
      );

      const stack: AssemblyStack = {
        id: stackId,
        provider: artifact.provider,
        environment: artifact.environment,
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
      const resource: AssemblyResource = {
        logicalId,
        type: entry.type,
        properties: entry.properties ?? {},
        ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
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

  /**
   * Infer stack-level dependencies by scanning the template for `{ ref }`
   * tokens in output values. A cross-stack output dependency is declared
   * when stack A's outputs contain a `{ ref }` token that resolves to a
   * resource in another stack. Since the engine computes the full token
   * dependency graph in `DeploymentPlanner`, here we only infer the simpler
   * case: if ANY string value in this stack's outputs/properties starts with
   * a pattern that matches an output key declared by another stack.
   *
   * In practice, cross-stack token resolution happens via `StackOutput`
   * constructs — the engine reads completed stack outputs from `EngineState`.
   * This method is a best-effort heuristic for ordering purposes; the planner
   * does the authoritative dependency resolution.
   */
  private inferDependencies(
    stackId: string,
    template: StackTemplate,
    outputKeyToStack: Map<string, string>,
  ): string[] {
    const deps = new Set<string>();

    // Scan all resource properties for { ref, attr } tokens.
    // A { ref } pointing to a logical ID that belongs to another stack
    // means this stack depends on that stack.
    // Since we don't have a cross-stack logical ID map here, we skip
    // intra-resource-ref scanning and leave it to DeploymentPlanner.
    // Here we handle the manifest-level output key cross-reference:
    // look for string values matching an output key from another stack.
    const scan = (value: unknown): void => {
      if (value === null || value === undefined) return;
      if (typeof value === 'object' && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        // Check for cross-stack output reference pattern:
        // { ref: '<stackId>.<outputKey>' } is the convention used by
        // StackOutput.importValue() (future). For now, just recurse.
        for (const v of Object.values(obj)) {
          scan(v);
        }
      } else if (Array.isArray(value)) {
        for (const item of value) {
          scan(item);
        }
      } else if (typeof value === 'string') {
        // Check if this string value is an output key from another stack.
        const depStackId = outputKeyToStack.get(value);
        if (depStackId !== undefined && depStackId !== stackId) {
          deps.add(depStackId);
        }
      }
    };

    for (const resource of Object.values(template.resources ?? {})) {
      scan(resource.properties);
    }
    for (const output of Object.values(template.outputs ?? {})) {
      scan(output.value);
    }

    return Array.from(deps);
  }
}
