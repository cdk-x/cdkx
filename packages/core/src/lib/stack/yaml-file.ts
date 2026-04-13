import { Construct } from 'constructs';
import { Stack } from './stack';
import { YamlFileSynthesizer } from '../synthesizer/synthesizer';

export interface YamlFileProps {
  /**
   * The name of the YAML file to generate (e.g. `multipass.yaml`).
   */
  readonly fileName: string;

  /**
   * Directory where the YAML file will be written.
   * @default '.'
   */
  readonly outputDir?: string;

  /**
   * Optional human-readable name for this stack.
   * @see StackProps.stackName
   */
  readonly stackName?: string;

  /**
   * Optional human-readable description for this stack.
   */
  readonly description?: string;
}

/**
 * A Stack that generates a YAML file at synthesis time.
 *
 * `YamlFile` is a friendlier alternative to constructing a `Stack` with an
 * explicit `YamlFileSynthesizer`. The synthesizer is pre-configured internally;
 * the caller only needs to declare the output filename and (optionally) the
 * target directory.
 *
 * Resources are added as direct children of the `YamlFile` instance, exactly
 * as they would be for a regular `Stack`.
 *
 * @example
 * const workspace = new Workspace();
 *
 * const multipass = new YamlFile(workspace, 'DevVMs', {
 *   fileName: 'multipass.yaml',
 * });
 *
 * const bridge = new MltNetwork(multipass, 'Bridge', { name: 'bridge', mode: 'auto' });
 * const devVm = new MltInstance(multipass, 'DevVm', {
 *   name: 'dev',
 *   networks: [bridge.ref],
 * });
 * new MltConfig(multipass, 'Config', { instances: [devVm.ref] });
 *
 * workspace.synth();
 * // Writes: ./multipass.yaml
 */
export class YamlFile extends Stack {
  constructor(scope: Construct, id: string, props: YamlFileProps) {
    super(scope, id, {
      synthesizer: new YamlFileSynthesizer({
        outputDir: props.outputDir ?? '.',
        fileName: props.fileName,
      }),
      stackName: props.stackName,
      description: props.description,
    });
  }
}
