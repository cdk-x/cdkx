import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import * as path from 'node:path';

export interface GoRepoCheckResult {
  ok: boolean;
  message?: string;
}

/**
 * Verifies the per-library GitHub repository a jsii library's Go bindings
 * publish into (`github.com/cdk-x/cdkx-<name>-go`) actually exists and is
 * reachable, before handing off to `publib-golang` - which would otherwise
 * fail with a confusing raw git-clone error deep inside its own process.
 */
export class GoRepoPrecondition {
  private constructor() {}

  /**
   * @param projectRoot - the absolute path to the project being published.
   * @returns `{ ok: true }` if the project's configured Go module repository
   * is reachable, or `{ ok: false, message }` pointing at CONTRIBUTING.md's
   * "Publishing Go bindings" section otherwise.
   */
  public static check(projectRoot: string): GoRepoCheckResult {
    const packageJson = JSON.parse(
      readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'),
    );
    const moduleName: string | undefined =
      packageJson.jsii?.targets?.go?.moduleName;
    if (!moduleName) {
      return {
        ok: false,
        message:
          'No jsii.targets.go.moduleName configured in package.json - nothing to publish.',
      };
    }

    const repoUrl = `https://${moduleName}.git`;
    try {
      execFileSync('git', ['ls-remote', '--exit-code', repoUrl], {
        stdio: 'ignore',
      });
      return { ok: true };
    } catch {
      return {
        ok: false,
        message:
          `Go module repository "${moduleName}" is not reachable. Create it first ` +
          `(see CONTRIBUTING.md, "Publishing Go bindings") before running jsii-publish-go.`,
      };
    }
  }
}
