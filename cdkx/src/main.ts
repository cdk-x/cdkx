import { App, Stack } from '@cdk-x/core';
import { GhbWorkflow } from '@cdk-x/github';

const app = new App();
const stack = new Stack(app, 'CdkxAppStack');

// Mirrors .github/workflows/ci.yml — synthesized here rather than
// hand-maintained, as a first example of this app's projen-style purpose:
// defining this repo's own GitHub configuration as cdkx constructs.
new GhbWorkflow(stack, 'Ci', {
  name: 'CI',
  on: {
    push: { branches: ['main'] },
    pull_request: {},
  },
  permissions: {
    actions: 'read',
    contents: 'read',
  },
  jobs: {
    main: {
      runsOn: 'ubuntu-latest',
      steps: [
        {
          uses: 'actions/checkout@v7',
          with: { filter: 'tree:0', 'fetch-depth': 0 },
        },
        { uses: 'pnpm/action-setup@v6' },
        {
          uses: 'actions/setup-node@v7',
          with: { 'node-version': 24, cache: 'pnpm' },
        },
        { run: 'pnpm install --frozen-lockfile' },
        { run: 'npx nx format:check --base="remotes/origin/main"' },
        { run: 'npx nx run-many -t lint test build typecheck e2e' },
      ],
    },
  },
});

app.synth();
