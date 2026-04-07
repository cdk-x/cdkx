import { readFileSync } from 'fs';
import { type CdkxConfig } from '@cdk-x/core';

// Re-export CdkxConfig so existing CLI consumers don't break
export { type CdkxConfig } from '@cdk-x/core';

/**
 * Read and parse a `cdkx.json` file from the given absolute path.
 * Throws if the file cannot be read or parsed.
 */
export function readConfig(configPath: string): CdkxConfig {
  const raw = readFileSync(configPath, 'utf-8');
  return JSON.parse(raw) as CdkxConfig;
}
