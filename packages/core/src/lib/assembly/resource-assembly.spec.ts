import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ManifestEntry } from '../synth/synth.js';
import {
  MANIFEST_VERSION,
  ResourceAssemblyWriter,
  type ResourceAssemblyManifest,
} from './resource-assembly.js';

function tmpOutdir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-test-'));
}

const dummyEntry: ManifestEntry = {
  resourceType: 'Dummy',
  apiVersion: 'dummy.cdk-x.com/v1',
  properties: { name: 'thing' },
  dependsOn: [],
};

describe('ResourceAssemblyWriter', () => {
  it('writes one <stackId>.json file per stack with that stack manifest', () => {
    const outdir = tmpOutdir();

    ResourceAssemblyWriter.write(outdir, {
      GithubStack: { Ci: dummyEntry },
    });

    const written = JSON.parse(
      fs.readFileSync(path.join(outdir, 'GithubStack.json'), 'utf-8'),
    );
    expect(written).toEqual({ Ci: dummyEntry });
  });

  it('writes manifest.json indexing every stack artifact', () => {
    const outdir = tmpOutdir();

    ResourceAssemblyWriter.write(outdir, {
      GithubStack: { Ci: dummyEntry },
      OtherStack: {},
    });

    const manifest = JSON.parse(
      fs.readFileSync(path.join(outdir, 'manifest.json'), 'utf-8'),
    ) as ResourceAssemblyManifest;

    expect(manifest).toEqual({
      version: MANIFEST_VERSION,
      artifacts: {
        GithubStack: {
          artifactType: 'cdkx:stack',
          properties: { templateFile: 'GithubStack.json' },
        },
        OtherStack: {
          artifactType: 'cdkx:stack',
          properties: { templateFile: 'OtherStack.json' },
        },
      },
    });
  });

  it('creates the output directory when it does not exist', () => {
    const outdir = path.join(tmpOutdir(), 'nested', 'assembly');

    ResourceAssemblyWriter.write(outdir, {});

    expect(fs.existsSync(path.join(outdir, 'manifest.json'))).toBe(true);
  });
});
