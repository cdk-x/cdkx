import type { ExecutorContext } from '@nx/devkit';
import * as path from 'node:path';

/**
 * Resolves the absolute on-disk root of the project an Nx executor is
 * currently running against, from its {@link ExecutorContext}.
 */
export class NxProjectRoots {
  private constructor() {}

  /**
   * @param context - the executor context Nx passes to every executor.
   * @returns the absolute path to the current project's root directory.
   */
  public static resolve(context: ExecutorContext): string {
    const projectName = context.projectName;
    if (!projectName) {
      throw new Error('Executor context is missing a projectName.');
    }
    const project = context.projectsConfigurations?.projects[projectName];
    if (!project) {
      throw new Error(`Unknown project "${projectName}" in executor context.`);
    }
    return path.join(context.root, project.root);
  }
}
