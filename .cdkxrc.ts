import { Workspace, YamlFile } from '@cdk-x/core';
import { MltConfig, MltInstance } from '@cdk-x/multipass';

const workspace = new Workspace();

const multipass = new YamlFile(workspace, 'DevVMs', {
  fileName: 'multipass.yaml',
});

const devVm = new MltInstance(multipass, 'DevVm', {
  name: 'dev',
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
});

new MltConfig(multipass, 'Config', {
  instances: [devVm.ref],
});

workspace.synth();
