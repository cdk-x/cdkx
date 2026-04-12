/**
 * Integration test: SSH runbook topology synthesis.
 *
 * Builds and synthesizes a minimal SSH construct tree:
 *
 *   SshStack
 *   ├── WebRunbook   SshRunbook  — declares the target host
 *   └── Nginx        SshPackage  — receives connection attrs via getAtt() tokens
 *
 * Verifies:
 *   - Synthesis completes without errors
 *   - Both resources appear in the stack JSON
 *   - SshPackage connection props are { ref, attr } tokens pointing to SshRunbook
 */
import * as os from 'node:os';
import * as path from 'node:path';
import { App, Stack } from '@cdk-x/core';
import { SynthHelpers } from '@cdk-x/testing';
import { SshRunbook, SshPackage } from '../../src/lib/generated';

const OUTDIR = path.join(os.tmpdir(), 'cdkx-ssh-test-synth');

type ResourceEntry = {
  type: string;
  properties: Record<string, unknown>;
  metadata: Record<string, unknown>;
};
type StackOutput = Record<string, ResourceEntry>;

let stackOut: StackOutput;
let runbookLogicalId: string;
let packageLogicalId: string;

beforeAll(() => {
  const app = new App({ outdir: OUTDIR });
  const stack = new Stack(app, 'SshStack', {});

  const runbook = new SshRunbook(stack, 'WebRunbook', {
    runbookId: 'web-runbook',
    host: '1.2.3.4',
    user: 'ubuntu',
    privateKeyPath: '/home/user/.ssh/id_rsa',
  });
  //runbookLogicalId = runbook.attrRunbookId;

  const pkg = new SshPackage(stack, 'Nginx', {
    packageName: 'nginx',
    runbookId: runbook.runbookId,
    host: runbook.host,
    user: runbook.user,
    privateKeyPath: runbook.privateKeyPath,
  });
  packageLogicalId = pkg.packageName;

  app.synth();

  stackOut = (
    SynthHelpers.readJson(path.join(OUTDIR, 'SshStack.json')) as {
      resources: StackOutput;
    }
  ).resources;
});

describe('resource count', () => {
  it('stack contains exactly 2 resources', () => {
    expect(Object.keys(stackOut)).toHaveLength(2);
  });
});

describe('SshRunbook', () => {
  it('has type SSH::Exec::Runbook', () => {
    expect(stackOut[packageLogicalId.].type).toBe('SSH::Exec::Runbook');
  });

  it('synthesizes host, user and privateKeyPath as literal values', () => {
    const props = stackOut[runbookLogicalId].properties;
    expect(props['host']).toBe('1.2.3.4');
    expect(props['user']).toBe('ubuntu');
    expect(props['privateKeyPath']).toBe('/home/user/.ssh/id_rsa');
  });
});

describe('SshPackage', () => {
  it('has type SSH::System::Package', () => {
    expect(stackOut[packageLogicalId].type).toBe('SSH::System::Package');
  });

  it('packageName is nginx', () => {
    expect(stackOut[packageLogicalId].properties['packageName']).toBe('nginx');
  });

  it('runbookId is a token pointing to runbook executionId', () => {
    expect(stackOut[packageLogicalId].properties['runbookId']).toEqual({
      ref: runbookLogicalId,
      attr: 'executionId',
    });
  });

  it('host is a token pointing to runbook attrHost', () => {
    expect(stackOut[packageLogicalId].properties['host']).toEqual({
      ref: runbookLogicalId,
      attr: 'host',
    });
  });

  it('user is a token pointing to runbook attrUser', () => {
    expect(stackOut[packageLogicalId].properties['user']).toEqual({
      ref: runbookLogicalId,
      attr: 'user',
    });
  });

  it('privateKeyPath is a token pointing to runbook attrPrivateKeyPath', () => {
    expect(stackOut[packageLogicalId].properties['privateKeyPath']).toEqual({
      ref: runbookLogicalId,
      attr: 'privateKeyPath',
    });
  });
});
