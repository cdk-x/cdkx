import { Workspace, YamlFile } from '@cdk-x/core';
import { MltConfig, MltInstance, MltMount, MltNetwork } from '@cdk-x/multipass';

const workspace = new Workspace();

const multipass = new YamlFile(workspace, 'DevVMs', {
  fileName: 'multipass.yaml',
});

const bridge = new MltNetwork(multipass, 'Bridge', { name: 'bridge', mode: 'auto' });

const codeMount = new MltMount(multipass, 'CodeMount', {
  source: '/Users/antonio/code',
  target: '/home/ubuntu/code',
});

const devVm = new MltInstance(multipass, 'DevVm', {
  name: 'dev',
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
  networks: [bridge.ref],
  mounts: [codeMount.ref],
});

new MltConfig(multipass, 'Config', {
  instances: [devVm.ref],
});

workspace.synth();
