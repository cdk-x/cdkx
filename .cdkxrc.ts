import { App, Stack, YamlFileSynthesizer } from '@cdk-x/core';
import { MltConfig, MltInstance } from '@cdk-x/multipass';

const app = new App();

const stack = new Stack(app, 'DevVMs', {
  synthesizer: new YamlFileSynthesizer({
    outputDir: '.',
    fileName: 'multipass.yaml',
  }),
});

const config = new MltConfig(stack, 'Config');

new MltInstance(stack, 'DevVm', {
  name: 'dev',
  configId: config.attrConfigId,
  image: 'jammy',
  cpus: 4,
  memory: '4G',
  disk: '20G',
});

app.synth();
