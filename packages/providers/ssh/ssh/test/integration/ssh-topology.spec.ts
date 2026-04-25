/**
 * Integration test: SSH provider topology synthesis.
 *
 * Builds and synthesizes a minimal SSH construct tree:
 *
 *   SshStack
 *   ├── NginxScript   SshShellScript — reusable script definition
 *   ├── DeployDoc     SshDocument    — Automation document referencing the script
 *   └── RunOnServer   SshRunDocument — executes the document against a target
 *
 * Verifies:
 *   - Synthesis completes without errors
 *   - All three resources appear in the stack JSON
 *   - Resource types are correct
 */
import * as os from 'node:os';
import * as path from 'node:path';
import { App, Stack } from '@cdk-x/core';
import { SynthHelpers } from '@cdk-x/testing';
import {
  SshShellScript,
  SshDocument,
  SshRunDocument,
} from '../../src/lib/generated';

const OUTDIR = path.join(os.tmpdir(), 'cdkx-ssh-test-synth');

type ResourceEntry = {
  type: string;
  properties: Record<string, unknown>;
  metadata: Record<string, unknown>;
};
type StackOutput = Record<string, ResourceEntry>;

let stackOut: StackOutput;

beforeAll(() => {
  const app = new App({ outdir: OUTDIR });
  const stack = new Stack(app, 'SshStack', {});

  const script = new SshShellScript(stack, 'NginxScript', {
    name: 'nginx-install',
    runCommand: ['apt-get update', 'apt-get install -y nginx'],
  });

  const doc = new SshDocument(stack, 'DeployDoc', {
    name: 'deploy-nginx',
    documentType: 'Automation',
    mainSteps: [
      {
        name: 'install',
        action: 'ssh:runShellScript',
        scriptRef: script.attrName,
        inputs: {
          runCommand: script.attrRunCommand,
        },
      },
    ],
  });

  new SshRunDocument(stack, 'RunOnServer', {
    documentName: doc.attrName,
    documentType: doc.attrDocumentType,
    host: '10.0.0.5',
    user: 'ubuntu',
    privateKeyPath: '/home/user/.ssh/id_rsa',
  });

  app.synth();

  stackOut = (
    SynthHelpers.readJson(path.join(OUTDIR, 'SshStack.json')) as {
      resources: StackOutput;
    }
  ).resources;
});

describe('resource count', () => {
  it('stack contains exactly 3 resources', () => {
    expect(Object.keys(stackOut)).toHaveLength(3);
  });
});

describe('SshShellScript', () => {
  it('has type SSH::Exec::ShellScript', () => {
    const resource = Object.values(stackOut).find(
      (r) => r.type === 'SSH::Exec::ShellScript',
    );
    expect(resource).toBeDefined();
  });
});

describe('SshDocument', () => {
  it('has type SSH::Exec::Document', () => {
    const resource = Object.values(stackOut).find(
      (r) => r.type === 'SSH::Exec::Document',
    );
    expect(resource).toBeDefined();
    expect(resource?.properties['documentType']).toBe('Automation');
  });

  it('mainSteps use { ref, attr } tokens instead of inlined values', () => {
    const resource = Object.values(stackOut).find(
      (r) => r.type === 'SSH::Exec::Document',
    );
    const step = (
      resource?.properties['mainSteps'] as Array<Record<string, unknown>>
    )?.[0];
    expect(step?.['scriptRef']).toMatchObject({ ref: expect.any(String), attr: 'name' });
    const inputs = step?.['inputs'] as Record<string, unknown>;
    expect(inputs?.['runCommand']).toMatchObject({ ref: expect.any(String), attr: 'runCommand' });
  });
});

describe('SshRunDocument', () => {
  it('has type SSH::Exec::RunDocument', () => {
    const resource = Object.values(stackOut).find(
      (r) => r.type === 'SSH::Exec::RunDocument',
    );
    expect(resource).toBeDefined();
    expect(resource?.properties['host']).toBe('10.0.0.5');
  });
});
