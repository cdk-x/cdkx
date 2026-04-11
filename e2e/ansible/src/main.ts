import { App } from '@cdk-x/core';
import { InfraStack } from './infra-stack';
import { AnsibleStack } from './ansible-stack';

const app = new App();

const infra = new InfraStack(app);

new AnsibleStack(app, {
  // The server IP resolves at deploy time from the Infra stack output.
  serverIp: infra.serverIpOutput.importValue(),
});

app.synth();
