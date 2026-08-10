import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { App, Stack } from '@cdk-x/core';
import { GhbDependabot, ScheduleInterval } from './dependabot.generated.js';

function tmpOutdir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-test-'));
}

describe('GhbDependabot synth', () => {
  it('round-trips real dependabot.yml keywords through synth, including kebab-case property names', () => {
    const app = new App({ outdir: tmpOutdir() });
    const stack = new Stack(app, 'GithubStack');

    new GhbDependabot(stack, 'Config', {
      version: 2,
      enableBetaEcosystems: true,
      updates: [
        {
          packageEcosystem: 'npm',
          directory: '/',
          schedule: { interval: ScheduleInterval.DAILY },
        },
      ],
    });

    const manifest = app.synth();
    const [entry] = Object.values(manifest['GithubStack'] ?? {});

    expect(entry?.resourceType).toBe('Dependabot');
    expect(entry?.apiVersion).toBe('github.cdk-x.com/v1');
    expect(entry?.properties).toEqual({
      version: 2,
      'enable-beta-ecosystems': true,
      updates: [
        {
          'package-ecosystem': 'npm',
          directory: '/',
          schedule: { interval: 'daily' },
        },
      ],
    });
  });

  it('omits undefined optional properties from the synthesized output', () => {
    const app = new App({ outdir: tmpOutdir() });
    const stack = new Stack(app, 'GithubStack');

    new GhbDependabot(stack, 'Config', {
      version: 2,
      updates: [{ packageEcosystem: 'pip', directory: '/' }],
    });

    const manifest = app.synth();
    const [entry] = Object.values(manifest['GithubStack'] ?? {});

    expect(entry?.properties).not.toHaveProperty('enable-beta-ecosystems');
    const updates = entry?.properties['updates'] as Record<string, unknown>[];
    expect(updates[0]).not.toHaveProperty('schedule');
  });
});
