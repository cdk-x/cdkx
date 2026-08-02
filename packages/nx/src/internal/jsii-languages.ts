/**
 * The jsii target-language vocabulary used across `@cdk-x/nx`'s Nx target
 * names (`jsii-package-<lang>` / `jsii-publish-<lang>`). `npm` stands for the
 * always-implicit JavaScript/TypeScript bindings.
 */
export type JsiiTargetLanguage = 'npm' | 'python' | 'java' | 'dotnet' | 'go';

/**
 * Translates this plugin's Nx-target-name vocabulary into the vocabulary
 * used by the underlying `jsii-pacmak`/`publib-*` CLIs, since neither of
 * them spells the JS/TS target "npm" the way this plugin's target names do
 * (`jsii-pacmak` calls it `js`; `publib`'s binary is `publib-npm`).
 */
export class JsiiLanguages {
  private constructor() {}

  private static readonly PACMAK_TARGETS: Record<JsiiTargetLanguage, string> = {
    npm: 'js',
    python: 'python',
    java: 'java',
    dotnet: 'dotnet',
    go: 'go',
  };

  private static readonly PUBLIB_BINARIES: Record<JsiiTargetLanguage, string> =
    {
      npm: 'publib-npm',
      python: 'publib-pypi',
      java: 'publib-maven',
      dotnet: 'publib-nuget',
      go: 'publib-golang',
    };

  // Matches jsii-pacmak's own per-language --outdir subfolder naming.
  private static readonly PACKAGE_SUBDIRS: Record<JsiiTargetLanguage, string> =
    {
      npm: 'js',
      python: 'python',
      java: 'java',
      dotnet: 'dotnet',
      go: 'go',
    };

  /**
   * @param language - the Nx-target-name language.
   * @returns the `jsii-pacmak -t <target>` flag value for `language`.
   */
  public static pacmakTarget(language: JsiiTargetLanguage): string {
    return this.PACMAK_TARGETS[language];
  }

  /**
   * @param language - the Nx-target-name language.
   * @returns the `publib-*` binary name that publishes `language`'s
   * packaged bindings.
   */
  public static publibBinary(language: JsiiTargetLanguage): string {
    return this.PUBLIB_BINARIES[language];
  }

  /**
   * @param language - the Nx-target-name language.
   * @returns the `dist-jsii/<subdir>` folder `jsii-pacmak` writes
   * `language`'s packaged bindings into.
   */
  public static packageSubdir(language: JsiiTargetLanguage): string {
    return this.PACKAGE_SUBDIRS[language];
  }
}
