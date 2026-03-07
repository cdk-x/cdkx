import { readFileSync } from 'fs';

/**
 * Shape of the `cdkx.json` configuration file.
 *
 * Used by `synth`, `deploy`, and future `destroy` commands.
 */
export interface CdkxConfig {
  /** Shell command to run the user's compiled app (e.g. `node app.js`). */
  app: string;
  /** Output directory for synthesis artifacts (default: `'cdkx.out'`). */
  output?: string;
}

/**
 * Read and parse a `cdkx.json` file from the given absolute path.
 * Throws if the file cannot be read or parsed.
 */
export function readConfig(configPath: string): CdkxConfig {
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as CdkxConfig;
}
