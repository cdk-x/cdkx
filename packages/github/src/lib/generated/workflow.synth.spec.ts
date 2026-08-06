import { App, Stack, Synthesizer } from '@cdk-x/core';
import { DEPLOY_CONFIGS } from './workflow.deploy.generated.js';
import { Job, Step, Workflow } from './workflow.generated.js';

describe('Workflow synth', () => {
  it('inlines Job and Step children into the synthesized manifest, at two levels of nesting', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const workflow = new Workflow(stack, 'CI', { name: 'CI' });
    const job = new Job(workflow, 'build', { name: 'Build' });
    new Step(job, 'checkout', { uses: 'actions/checkout@v4' });
    new Step(job, 'test', { run: 'npm test' });

    const manifest = Synthesizer.synthesize(app)['Stack'];
    const entry = manifest[workflow.node.path];

    expect(entry.apiVersion).toBe('github.cdk-x.com/v1');
    expect(entry.resourceType).toBe('Workflow');
    expect(entry.properties).toEqual({
      name: 'CI',
      jobs: {
        build: {
          name: 'Build',
          steps: [{ uses: 'actions/checkout@v4' }, { run: 'npm test' }],
        },
      },
    });
  });

  it('never gives Job or Step their own manifest entry', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const workflow = new Workflow(stack, 'CI');
    const job = new Job(workflow, 'build');
    new Step(job, 'checkout');

    const manifest = Synthesizer.synthesize(app)['Stack'];

    expect(Object.keys(manifest)).toEqual([workflow.node.path]);
  });
});

describe('workflow.deploy.generated', () => {
  it('declares Workflow as synth-only, keyed by apiVersion/resourceType', () => {
    expect(DEPLOY_CONFIGS['github.cdk-x.com/v1/Workflow']).toEqual({
      mode: 'synth-only',
    });
  });
});
