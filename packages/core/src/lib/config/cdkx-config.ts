/**
 * Shape of the `cdkx.json` configuration file.
 *
 * Used by `synth`, `deploy`, `destroy`, and future commands.
 * Lives in `@cdk-x/core` so both engine and CLI can import it
 * without circular dependencies.
 */
export interface CdkxConfig {
  /** Shell command to run the user's compiled app (e.g. `node app.js`). */
  app: string;
  /** Output directory for synthesis artifacts (default: `'cdkx.out'`). */
  output?: string;
}
