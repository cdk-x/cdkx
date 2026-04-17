import { App, Stack, StackOutput } from '@cdk-x/core';
import { MltInstance } from '@cdk-x/multipass';

const app = new App();

const stack = new Stack(app, 'Network');

const instance = new MltInstance(stack, 'Instance', {
  name: 'cdk-x-multipass-e2e',
  image: 'jammy',
  cpus: 1,
  memory: '1G',
});

new StackOutput(stack, 'InstanceName', {
  value: instance.attrIpAddress,
});

new StackOutput(stack, 'InstanceUser', {
  value: instance.attrSshUser,
});

app.synth();
