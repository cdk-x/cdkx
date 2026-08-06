import type { ExecutorContext } from '@nx/devkit';
import * as fs from 'node:fs';
import * as path from 'node:path';

import executor from './executor';

jest.mock('node:fs');

function makeContext(): ExecutorContext {
  return {
    root: '/workspace',
    cwd: '/workspace',
    isVerbose: false,
    projectName: 'github',
    projectGraph: { nodes: {}, dependencies: {} },
    projectsConfigurations: {
      version: 2,
      projects: { github: { root: 'packages/github' } },
    },
    nxJsonConfiguration: {},
  };
}

const WORKFLOW_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  properties: {
    name: { type: 'string' },
  },
};

describe('generate-l1 executor', () => {
  beforeEach(() => {
    jest
      .mocked(fs.readFileSync)
      .mockReturnValue(JSON.stringify(WORKFLOW_SCHEMA));
    jest.mocked(fs.mkdirSync).mockReturnValue(undefined as unknown as string);
    jest.mocked(fs.writeFileSync).mockReturnValue(undefined);
  });

  it('writes a *.generated.ts and *.deploy.generated.ts file per schema entry', async () => {
    const result = await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/workflow.schema.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
          },
        ],
      },
      makeContext(),
    );

    expect(result).toEqual({ success: true });
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(
        '/workspace',
        'packages/github',
        'src/lib/generated',
        'workflow.generated.ts',
      ),
      expect.stringContaining('export class Workflow extends Resource'),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(
        '/workspace',
        'packages/github',
        'src/lib/generated',
        'workflow.deploy.generated.ts',
      ),
      expect.stringContaining("mode: 'synth-only'"),
    );
  });

  it('honors a custom outputDir', async () => {
    await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        outputDir: 'custom/output',
        schemas: [
          {
            file: 'schemas/workflow.schema.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
          },
        ],
      },
      makeContext(),
    );

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join('/workspace', 'packages/github', 'custom/output'),
      { recursive: true },
    );
  });

  it('reads each schema file relative to the project root', async () => {
    await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/workflow.schema.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
          },
        ],
      },
      makeContext(),
    );

    expect(fs.readFileSync).toHaveBeenCalledWith(
      path.join(
        '/workspace',
        'packages/github',
        'schemas/workflow.schema.json',
      ),
      'utf-8',
    );
  });

  it('derives the output base name from the schema file, stripping ".schema.json"', async () => {
    await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/workflow.schema.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
          },
        ],
      },
      makeContext(),
    );

    const writtenPaths = jest
      .mocked(fs.writeFileSync)
      .mock.calls.map(([target]) => target);
    expect(writtenPaths).toEqual(
      expect.arrayContaining([
        expect.stringContaining('workflow.generated.ts'),
      ]),
    );
  });

  it('returns a failure result instead of throwing when a schema file is invalid JSON', async () => {
    jest.mocked(fs.readFileSync).mockReturnValue('not json');

    const result = await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/broken.schema.json',
            resourceType: 'Broken',
            mode: 'synth-only',
          },
        ],
      },
      makeContext(),
    );

    expect(result).toEqual({ success: false, message: expect.any(String) });
  });

  it('returns a failure result when the schema declares an unsupported dialect', async () => {
    jest
      .mocked(fs.readFileSync)
      .mockReturnValue(JSON.stringify({ properties: {} }));

    const result = await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/workflow.schema.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
          },
        ],
      },
      makeContext(),
    );

    expect(result).toEqual({
      success: false,
      message: expect.stringContaining('Unsupported JSON Schema dialect'),
    });
  });
});
