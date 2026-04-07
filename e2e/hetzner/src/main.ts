import { App } from '@cdk-x/core';
import { NetworkStack } from './network-stack';
import { ComputeStack } from './compute-stack';

const app = new App();

const networking = new NetworkStack(app);

new ComputeStack(app, {
  // Import outputs from the networking stack.
  // This automatically infers the cross-stack dependency — no manual
  // addDependency() call required.
  networkId: networking.networkIdOutput.importValue(),
  floatingIpId: networking.floatingIpIdOutput.importValue(),
  loadBalancerId: networking.loadBalancerIdOutput.importValue(),
});

app.synth();
