import { App, AppProps } from './app';

export interface WorkspaceProps extends AppProps {}

/**
 * The root of the cdkx construct tree for local configuration workflows.
 *
 * `Workspace` is a semantic alias for `App` designed for use in `.cdkxrc.ts`
 * files that generate local configuration files (YAML, JSON) rather than
 * deploying cloud resources. The name better communicates the intent: this
 * is the workspace being configured, not a cloud application being deployed.
 *
 * @example
 * const workspace = new Workspace();
 *
 * const multipass = new YamlFile(workspace, 'DevVMs', {
 *   fileName: 'multipass.yaml',
 * });
 * new MltInstance(multipass, 'DevVm', { name: 'dev', ... });
 *
 * workspace.synth();
 */
export class Workspace extends App {
  constructor(props: WorkspaceProps = {}) {
    super(props);
  }
}
