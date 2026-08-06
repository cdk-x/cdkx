import type { IrResourceNode } from '../ir/ir.js';
import { DeployMetadataGenerator } from './deploy-metadata-generator.js';

const resource: IrResourceNode = {
  resourceType: 'Workflow',
  apiVersion: 'github.cdk-x.com/v1',
  deploy: 'render',
  properties: [],
};

describe('DeployMetadataGenerator', () => {
  it('keys DEPLOY_CONFIGS by "<apiVersion>/<resourceType>"', () => {
    const source = DeployMetadataGenerator.generate(resource);

    expect(source).toContain(
      "'github.cdk-x.com/v1/Workflow': { deploy: 'render' },",
    );
  });

  it('emits the declared deploy mode', () => {
    const source = DeployMetadataGenerator.generate({
      ...resource,
      deploy: 'api',
    });

    expect(source).toContain("{ deploy: 'api' }");
  });
});
