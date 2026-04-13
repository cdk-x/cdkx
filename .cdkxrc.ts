import { App, Stack, YamlFileSynthesizer } from '@cdk-x/core';
import { MltConfig, MltInstance, MltMount, MltNetwork } from '@cdk-x/multipass';

const app = new App();

const stack = new Stack(app, 'DevVMs', {
  synthesizer: new YamlFileSynthesizer({
    outputDir: '.',
    fileName: 'multipass.yaml',
  }),
});

const bridge = new MltNetwork(stack, 'Bridge', { name: 'bridge', mode: 'auto' });

const codeMount = new MltMount(stack, 'CodeMount', {
  source: '/Users/antonio/code',
  target: '/home/ubuntu/code',
});

const devVm = new MltInstance(stack, 'DevVm', {
  name: 'dev',
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
  networks: [bridge.ref],
  mounts: [codeMount.ref],
});

new MltConfig(stack, 'Config', {
  instances: [devVm.ref],
});

app.synth();
