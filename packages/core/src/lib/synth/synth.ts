import type { App } from '../app/app.js';
import { Resolvable } from '../resolvable/resolvable.js';
import type { PropertyValue } from '../resolvable/resolvable.js';
import { Resource } from '../resource/resource.js';
import { Stack } from '../stack/stack.js';

/**
 * A single Resource's synthesized entry within a Stack's {@link Manifest}.
 */
export interface ManifestEntry {
  /**
   * The resource type identifier, as declared by `Resource.type`.
   */
  readonly type: string;

  /**
   * This Resource's serialized properties — any IResolvable values have
   * been replaced with their resolved (placeholder) form.
   */
  readonly properties: Record<string, PropertyValue>;

  /**
   * The logical ids (Resource.node.path) of every Resource this entry
   * depends on, composed from both explicit `addDependency()` calls and
   * IResolvable references found within its properties.
   */
  readonly dependsOn: string[];
}

/**
 * A Stack's synthesized output: every Resource it contains, keyed by
 * logical id (`Resource.node.path`).
 */
export type Manifest = Record<string, ManifestEntry>;

/**
 * Thrown by {@link Synthesizer.synthesize} when a Stack's Resources form a
 * dependency cycle.
 */
export class CycleError extends Error {
  /**
   * @param cycle - the logical ids forming the cycle, in traversal order,
   * with the first id repeated at the end to close the loop.
   */
  constructor(public readonly cycle: string[]) {
    super(`Dependency cycle detected: ${cycle.join(' -> ')}`);
  }
}

/**
 * Turns an App's construct tree into a synthesized Manifest per Stack.
 * Not instantiable — mirrors the static-only utility class pattern used
 * elsewhere in the package (Stack.of(), Resource.of()).
 */
export class Synthesizer {
  private constructor() {} // no instances — static-only class

  /**
   * Synthesizes every Stack in an App into its Manifest, validating
   * dependencies (rejecting cycles and cross-stack references) along the
   * way.
   *
   * @param app - the App to synthesize.
   * @returns a map of Stack id to that Stack's synthesized Manifest.
   * @example
   * ```ts
   * const manifests = Synthesizer.synthesize(app);
   * ```
   */
  public static synthesize(app: App): Record<string, Manifest> {
    const stacks = app.node.children.filter(Stack.isStack);
    const resourcesByPath = new Map<string, Resource>(
      app.node
        .findAll()
        .filter(Resource.isResource)
        .map((resource) => [resource.node.path, resource]),
    );

    const result: Record<string, Manifest> = {};
    for (const stack of stacks) {
      result[stack.node.id] = Synthesizer.synthesizeStack(
        stack,
        resourcesByPath,
      );
    }
    return result;
  }

  private static synthesizeStack(
    stack: Stack,
    resourcesByPath: Map<string, Resource>,
  ): Manifest {
    const manifest: Manifest = {};

    for (const resource of stack.getResources()) {
      const rawProps = resource._toProperties();
      manifest[resource.node.path] = {
        type: resource.type,
        properties: Synthesizer.serializeResolvables(rawProps),
        dependsOn: Synthesizer.composeDependsOn(
          resource,
          rawProps,
          resourcesByPath,
        ),
      };
    }

    Synthesizer.detectCycles(manifest);
    return manifest;
  }

  // explicit (every construct.node.dependencies in the resource's subtree,
  // resolved to its owning Resource via Resource.of()) unioned with
  // inferred (IResolvable refs found while walking rawProps) — both funnel
  // through addTarget() so the cross-stack veto applies uniformly to
  // either origin.
  private static composeDependsOn(
    resource: Resource,
    rawProps: Record<string, PropertyValue>,
    resourcesByPath: Map<string, Resource>,
  ): string[] {
    const ownStack = Stack.of(resource);
    const dependsOn = new Set<string>();

    const addTarget = (target: Resource): void => {
      if (target === resource) return;
      const targetStack = Stack.of(target);
      if (targetStack !== ownStack) {
        throw new Error(
          `Cannot add dependency: '${resource.node.path}' (Stack '${ownStack.node.path}') ` +
            `cannot depend on '${target.node.path}' (Stack '${targetStack.node.path}'). ` +
            `Cross-stack dependencies are not supported yet — move both to the same Stack.`,
        );
      }
      dependsOn.add(target.node.path);
    };

    for (const construct of resource.node.findAll()) {
      for (const dep of construct.node.dependencies) {
        addTarget(Resource.of(dep));
      }
    }

    Synthesizer.walkForReferences(rawProps, (ref) => {
      const target = resourcesByPath.get(ref);
      if (target) addTarget(target);
    });

    return [...dependsOn];
  }

  private static walkForReferences(
    value: PropertyValue,
    onRef: (ref: string) => void,
  ): void {
    if (Resolvable.isResolvable(value)) {
      const resolved = value.resolve();
      if (
        typeof resolved === 'object' &&
        resolved !== null &&
        typeof (resolved as { ref?: unknown }).ref === 'string'
      ) {
        onRef((resolved as { ref: string }).ref);
      }
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) Synthesizer.walkForReferences(item, onRef);
      return;
    }
    if (typeof value === 'object' && value !== null) {
      for (const item of Object.values(value)) {
        Synthesizer.walkForReferences(item, onRef);
      }
    }
  }

  private static serializeResolvables(
    value: Record<string, PropertyValue>,
  ): Record<string, PropertyValue> {
    return Synthesizer.serializeValue(value) as Record<string, PropertyValue>;
  }

  private static serializeValue(value: PropertyValue): PropertyValue {
    if (Resolvable.isResolvable(value)) {
      return Synthesizer.serializeValue(value.resolve() as PropertyValue);
    }
    if (Array.isArray(value)) {
      return value.map((item) => Synthesizer.serializeValue(item));
    }
    if (typeof value === 'object' && value !== null) {
      const result: Record<string, PropertyValue> = {};
      for (const [key, item] of Object.entries(value)) {
        result[key] = Synthesizer.serializeValue(item);
      }
      return result;
    }
    return value;
  }

  // classic DFS with an "on the current path" set; iterates every key as a
  // root to also cover disconnected components.
  private static detectCycles(manifest: Manifest): void {
    const visited = new Set<string>();
    const inProgress = new Set<string>();
    const pathStack: string[] = [];

    const visit = (id: string): void => {
      if (inProgress.has(id)) {
        const cycleStart = pathStack.indexOf(id);
        throw new CycleError([...pathStack.slice(cycleStart), id]);
      }
      if (visited.has(id)) return;

      visited.add(id);
      inProgress.add(id);
      pathStack.push(id);

      for (const dep of manifest[id]?.dependsOn ?? []) {
        visit(dep);
      }

      inProgress.delete(id);
      pathStack.pop();
    };

    for (const id of Object.keys(manifest)) {
      visit(id);
    }
  }
}
