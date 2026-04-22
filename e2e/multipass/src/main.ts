import * as path from 'path';
import { Annotations, App, Asset, Stack, StackOutput } from '@cdk-x/core';
import { MltInstance } from '@cdk-x/multipass';

const app = new App();

const stack = new Stack(app, 'Network');

const cloudInit = new Asset(stack, 'CloudInit', {
  path: path.resolve(__dirname, '../cloud-init.yaml'),
});

// Directory asset: stages the full `cloud-init/` folder under
// `cdkx.out/assets/asset.<hash>/`. Kept alongside the file asset above to
// exercise the directory-packaging path end-to-end.
new Asset(stack, 'CloudInitDir', {
  directoryPath: path.resolve(__dirname, '../cloud-init'),
});

const instance = new MltInstance(stack, 'Instance', {
  name: 'cdk-x-multipass-e2e',
  image: 'jammy',
  cpus: 1,
  memory: '1G',
  networks: [{ name: 'en0', mode: 'auto' }],
  mounts: [
    { source: path.resolve(__dirname, '../cdkx.out'), target: '/cdkx.out' },
  ],
  cloudInit: cloudInit.absolutePath,
});

Annotations.of(stack).addWarning('10003', 'This is a test warning for E2E');

new StackOutput(stack, 'InstanceName', {
  value: instance.attrIpAddress,
});

new StackOutput(stack, 'InstanceUser', {
  value: instance.attrSshUser,
});

app.synth();
