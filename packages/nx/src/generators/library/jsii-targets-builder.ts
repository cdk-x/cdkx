import type { JsiiLanguage } from './schema';

interface JsiiTargets {
  python?: { distName: string; module: string };
  java?: { package: string; maven: { groupId: string; artifactId: string } };
  dotnet?: { namespace: string; packageId: string };
  go?: { moduleName: string };
}

/**
 * Derives per-language jsii target config from a library's name, following
 * the same naming convention as `packages/core`.
 */
export class JsiiTargetsBuilder {
  private constructor() {}

  /**
   * Builds the `jsii.targets` block for a library's `package.json`, scoped
   * to only the requested languages. npm/JS bindings are always implicit in
   * jsii and never appear as a key here.
   *
   * @param name - the kebab-case library name.
   * @param className - the PascalCase form of `name`.
   * @param languages - the jsii target languages to include.
   * @returns the `jsii.targets` object, following `packages/core`'s naming
   * convention (`com.cdkx.<name>` for Java, `cdkx.<name>` for Python,
   * `CdkX.<ClassName>` for .NET, and one dedicated
   * `github.com/cdk-x/cdkx-<name>-go` repository per library for Go).
   */
  public static build(
    name: string,
    className: string,
    languages: JsiiLanguage[],
  ): JsiiTargets {
    const javaSegment = name.replace(/-/g, '');
    const pythonSegment = name.replace(/-/g, '_');

    const targets: JsiiTargets = {};
    if (languages.includes('python')) {
      targets.python = {
        distName: `cdkx-${name}`,
        module: `cdkx.${pythonSegment}`,
      };
    }
    if (languages.includes('java')) {
      targets.java = {
        package: `com.cdkx.${javaSegment}`,
        maven: { groupId: 'com.cdk-x', artifactId: `cdkx-${name}` },
      };
    }
    if (languages.includes('dotnet')) {
      targets.dotnet = {
        namespace: `CdkX.${className}`,
        packageId: `CdkX.${className}`,
      };
    }
    if (languages.includes('go')) {
      targets.go = { moduleName: `github.com/cdk-x/cdkx-${name}-go` };
    }
    return targets;
  }
}
