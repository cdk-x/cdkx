import type { TargetConfiguration } from '@nx/devkit';

import {
  JsiiLanguages,
  type JsiiTargetLanguage,
} from '../../internal/jsii-languages';

// Local toolchain caches (~/.m2, a local NuGet feed, the Go module cache)
// benefit from cross-project packaging happening in dependency order first.
// Mirrors packages/core's hand-written project.json, which only adds the
// `^jsii-package-*` dependency for these three languages, not python/npm.
const CROSS_PROJECT_PACKAGE_DEPS: ReadonlySet<JsiiTargetLanguage> = new Set([
  'java',
  'dotnet',
  'go',
]);

/**
 * Builds the `jsii-*` Nx target set for a jsii-enabled project, given the
 * additional target languages declared in its `package.json`'s
 * `jsii.targets` block. Mirrors `packages/core`'s hand-written target names,
 * dependencies, and outputs exactly, so it can eventually replace them with
 * no behavior change.
 */
export class JsiiTargetsFactory {
  private constructor() {}

  /**
   * @param additionalLanguages - the jsii target languages declared under
   * `jsii.targets` in the project's `package.json` (npm is always added on
   * top of these, since jsii bindings for it are implicit).
   * @returns the full `jsii-compile` / `jsii-docs` / `jsii-package-*` /
   * `jsii-package-all` / `jsii-publish-*` / `nx-release-publish` target set.
   */
  public static build(
    additionalLanguages: JsiiTargetLanguage[],
  ): Record<string, TargetConfiguration> {
    const languages: JsiiTargetLanguage[] = ['npm', ...additionalLanguages];

    const targets: Record<string, TargetConfiguration> = {
      'jsii-compile': {
        executor: '@cdk-x/nx:jsii-compile',
        dependsOn: ['^jsii-compile'],
        outputs: ['{projectRoot}/dist', '{projectRoot}/.jsii'],
        cache: true,
      },
      'jsii-docs': {
        executor: '@cdk-x/nx:jsii-docs',
        dependsOn: ['jsii-compile'],
        outputs: ['{projectRoot}/dist-jsii/docs'],
      },
    };

    for (const language of languages) {
      const packageDeps = ['jsii-compile'];
      if (CROSS_PROJECT_PACKAGE_DEPS.has(language)) {
        packageDeps.push(`^jsii-package-${language}`);
      }

      targets[`jsii-package-${language}`] = {
        executor: '@cdk-x/nx:jsii-package',
        options: { target: language },
        dependsOn: packageDeps,
        outputs: [
          `{projectRoot}/dist-jsii/${JsiiLanguages.packageSubdir(language)}`,
        ],
      };
      targets[`jsii-publish-${language}`] = {
        executor: '@cdk-x/nx:jsii-publish',
        options: { target: language },
        dependsOn: [`jsii-package-${language}`],
      };
    }

    targets['jsii-package-all'] = {
      executor: 'nx:noop',
      dependsOn: ['jsii-docs', ...languages.map((l) => `jsii-package-${l}`)],
    };

    // No executor override here on purpose - this only augments the
    // nx-release-publish target Nx's release feature synthesizes on its own
    // for any publishable project, same as packages/core does today.
    targets['nx-release-publish'] = {
      dependsOn: ['^nx-release-publish', 'jsii-compile'],
    };

    // Augmentation-only (no executor key), which lets this merge with a
    // `build` target inferred by another plugin (e.g. @nx/js/typescript, for
    // any @cdk-x/nx:library-generated project - confirmed empirically, no
    // project.json to conflict with). It does NOT reach a project whose
    // project.json hand-writes its own `build` target - an explicit
    // project.json target fully replaces a same-named inferred one rather
    // than merging with it (confirmed empirically: adding this alone left
    // packages/core's build.dependsOn unchanged). packages/core hand-writes
    // `build`, so its project.json declares this same `dependsOn` directly.
    //
    // Re-declares '^build' explicitly because array-valued keys like
    // dependsOn fully REPLACE across merge layers rather than concatenating -
    // dropping it here would silently lose the '^build' dependency nx.json's
    // targetDefaults for "@nx/js:swc" already establishes.
    targets['build'] = {
      dependsOn: ['^build', 'jsii-package-all'],
    };

    return targets;
  }
}
