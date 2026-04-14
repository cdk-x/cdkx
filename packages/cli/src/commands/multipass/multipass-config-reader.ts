import { readFileSync } from 'fs';
import { load } from 'js-yaml';

export interface MultipassInstanceConfig {
  name: string;
  image?: string;
  cpus?: number;
  memory?: string;
  disk?: string;
}

export interface MultipassYaml {
  instances: MultipassInstanceConfig[];
}

/**
 * Reads and validates a multipass.yaml configuration file.
 */
export class MultipassConfigReader {
  /**
   * Reads and parses a multipass.yaml file.
   * Throws if the file cannot be read, parsed, or has no instances.
   */
  static read(configPath: string): MultipassYaml {
    let raw: string;
    try {
      raw = readFileSync(configPath, 'utf-8');
    } catch {
      throw new Error(`multipass.yaml not found: ${configPath}`);
    }

    const parsed = load(raw) as MultipassYaml;

    if (!parsed || !Array.isArray(parsed.instances)) {
      throw new Error(
        `Invalid multipass.yaml: expected an 'instances' array in ${configPath}`,
      );
    }

    return parsed;
  }

  /**
   * Resolves the target instances from a config file.
   *
   * - If `all` is true, returns all instances.
   * - Otherwise validates that every requested name exists in the config.
   *
   * Throws if any requested name is not found.
   */
  static resolve(
    configPath: string,
    names: string[],
    all: boolean,
  ): MultipassInstanceConfig[] {
    const config = MultipassConfigReader.read(configPath);

    if (all) {
      return config.instances;
    }

    if (names.length === 0) {
      throw new Error(
        'Specify at least one instance name or use --all to target all instances.',
      );
    }

    const missing = names.filter(
      (n) => !config.instances.some((i) => i.name === n),
    );

    if (missing.length > 0) {
      const known = config.instances.map((i) => i.name).join(', ');
      throw new Error(
        `Unknown instance(s): ${missing.join(', ')}.\nDefined in ${configPath}: ${known}`,
      );
    }

    return config.instances.filter((i) => names.includes(i.name));
  }
}
