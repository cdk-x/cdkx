import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { App, Stack } from '@cdk-x/core';
import { GhbWorkflow } from './github-workflow.generated.js';

function tmpOutdir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-test-'));
}

describe('GhbWorkflow synth', () => {
  it('round-trips real GitHub Actions keywords through synth, including kebab-case property names', () => {
    const app = new App({ outdir: tmpOutdir() });
    const stack = new Stack(app, 'GithubStack');

    new GhbWorkflow(stack, 'Ci', {
      name: 'CI',
      on: 'push',
      runName: 'CI run for ${{ github.sha }}',
      jobs: {
        build: {
          runsOn: 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v4' },
            { name: 'Build', run: 'npm run build' },
          ],
        },
      },
    });

    const manifest = app.synth();
    const [entry] = Object.values(manifest['GithubStack'] ?? {});

    expect(entry?.resourceType).toBe('Workflow');
    expect(entry?.apiVersion).toBe('github.cdk-x.com/v1');
    expect(entry?.properties).toEqual({
      name: 'CI',
      on: 'push',
      'run-name': 'CI run for ${{ github.sha }}',
      jobs: {
        build: {
          'runs-on': 'ubuntu-latest',
          steps: [
            { uses: 'actions/checkout@v4' },
            { name: 'Build', run: 'npm run build' },
          ],
        },
      },
    });
  });

  it('discriminates between NormalJob and ReusableWorkflowCallJob in the same jobs map', () => {
    const app = new App({ outdir: tmpOutdir() });
    const stack = new Stack(app, 'GithubStack');

    new GhbWorkflow(stack, 'Ci', {
      on: 'push',
      jobs: {
        build: {
          runsOn: 'ubuntu-latest',
          steps: [{ uses: 'actions/checkout@v4' }],
        },
        deploy: {
          uses: './.github/workflows/deploy.yml',
          with: { environment: 'production' },
        },
      },
    });

    const manifest = app.synth();
    const [entry] = Object.values(manifest['GithubStack'] ?? {});
    const jobs = entry?.properties['jobs'] as Record<string, unknown>;

    expect(jobs['build']).toEqual({
      'runs-on': 'ubuntu-latest',
      steps: [{ uses: 'actions/checkout@v4' }],
    });
    expect(jobs['deploy']).toEqual({
      uses: './.github/workflows/deploy.yml',
      with: { environment: 'production' },
    });
  });

  it('omits undefined optional properties from the synthesized output', () => {
    const app = new App({ outdir: tmpOutdir() });
    const stack = new Stack(app, 'GithubStack');

    new GhbWorkflow(stack, 'Ci', {
      on: 'push',
      jobs: { build: { runsOn: 'ubuntu-latest' } },
    });

    const manifest = app.synth();
    const [entry] = Object.values(manifest['GithubStack'] ?? {});

    expect(entry?.properties).not.toHaveProperty('name');
    expect(entry?.properties).not.toHaveProperty('run-name');
    const jobs = entry?.properties['jobs'] as Record<string, unknown>;
    expect(jobs['build']).not.toHaveProperty('steps');
  });
});
