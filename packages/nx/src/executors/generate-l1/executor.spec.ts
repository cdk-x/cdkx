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
    jobs: {
      type: 'object',
      patternProperties: {
        '^[_a-zA-Z][a-zA-Z0-9_-]*$': {
          oneOf: [
            { $ref: '#/definitions/normalJob' },
            { $ref: '#/definitions/reusableWorkflowCallJob' },
          ],
        },
      },
      additionalProperties: false,
    },
  },
  definitions: {
    normalJob: {
      type: 'object',
      required: ['runs-on'],
      properties: { 'runs-on': { type: 'string' } },
    },
    reusableWorkflowCallJob: {
      type: 'object',
      required: ['uses'],
      properties: { uses: { type: 'string' } },
    },
  },
};

describe('generate-l1 executor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
            file: 'schemas/github-workflow.json',
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
        'github-workflow.generated.ts',
      ),
      expect.stringContaining('export class Workflow extends Resource'),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(
        '/workspace',
        'packages/github',
        'src/lib/generated',
        'github-workflow.deploy.generated.ts',
      ),
      expect.stringContaining("mode: 'synth-only'"),
    );
  });

  it('applies a configured 3-letter prefix to the Resource class only — never resourceType, Props, or the serializer', async () => {
    await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/github-workflow.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
            prefix: 'Ghb',
          },
        ],
      },
      makeContext(),
    );

    const call = jest
      .mocked(fs.writeFileSync)
      .mock.calls.find(([target]) =>
        String(target).includes('github-workflow.generated.ts'),
      );
    expect(call).toBeDefined();
    const [, generatedSource] = call ?? [];

    expect(generatedSource).toContain(
      'export class GhbWorkflow extends Resource {',
    );
    expect(generatedSource).toContain(
      "public readonly resourceType = 'Workflow';",
    );
    // Props, the serializer, and every nested type stay unprefixed.
    expect(generatedSource).toContain('export interface WorkflowProps');
    expect(generatedSource).not.toContain('GhbWorkflowProps');
    expect(generatedSource).toContain(
      'WorkflowSerializer.toJsonWorkflowProps(this.props)',
    );
    expect(generatedSource).not.toContain('GhbWorkflowSerializer');
  });

  it('returns a failure result for an invalid prefix (not 3 letters, not PascalCase)', async () => {
    const result = await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/github-workflow.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
            prefix: 'GITHUB',
          },
        ],
      },
      makeContext(),
    );

    expect(result).toEqual({
      success: false,
      message: expect.stringContaining('Invalid prefix'),
    });
  });

  it('auto-detects and auto-resolves a real structural-variant union with no config at all', async () => {
    await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/github-workflow.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
          },
        ],
      },
      makeContext(),
    );

    const call = jest
      .mocked(fs.writeFileSync)
      .mock.calls.find(([target]) =>
        String(target).includes('github-workflow.generated.ts'),
      );
    expect(call).toBeDefined();
    const [, generatedSource] = call ?? [];

    // "Job" is auto-derived from the longest common suffix of NormalJob /
    // ReusableWorkflowCallJob, and the discriminant from each variant's own
    // uniquely-required field ("runs-on" / "uses") — no unionOverrides entry.
    expect(generatedSource).toContain(
      'export type Job = NormalJob | ReusableWorkflowCallJob;',
    );
    expect(generatedSource).toContain(
      'readonly jobs?: { [key: string]: Job };',
    );
  });

  it('an explicit unionOverrides entry (escape hatch) takes precedence over auto-detection', async () => {
    await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/github-workflow.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
            unionOverrides: [
              {
                unionTypeName: 'CustomJob',
                variants: [
                  {
                    definitionName: 'reusableWorkflowCallJob',
                    typeName: 'ReusableWorkflowCallJob',
                    discriminantProperty: 'uses',
                  },
                  {
                    definitionName: 'normalJob',
                    typeName: 'NormalJob',
                  },
                ],
              },
            ],
          },
        ],
      },
      makeContext(),
    );

    const call = jest
      .mocked(fs.writeFileSync)
      .mock.calls.find(([target]) =>
        String(target).includes('github-workflow.generated.ts'),
      );
    expect(call).toBeDefined();
    const [, generatedSource] = call ?? [];

    expect(generatedSource).toContain(
      'export type CustomJob = ReusableWorkflowCallJob | NormalJob;',
    );
    expect(generatedSource).toContain(
      'readonly jobs?: { [key: string]: CustomJob };',
    );
  });

  it('fails loudly (not a silent "any") when a detected union cannot be auto-resolved and has no override', async () => {
    jest.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({
        $schema: 'http://json-schema.org/draft-07/schema#',
        properties: {
          target: {
            oneOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }],
          },
        },
        definitions: {
          a: { type: 'object', properties: { shared: { type: 'string' } } },
          b: { type: 'object', properties: { shared: { type: 'string' } } },
        },
      }),
    );

    const result = await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/ambiguous.json',
            resourceType: 'Ambiguous',
            mode: 'synth-only',
          },
        ],
      },
      makeContext(),
    );

    expect(result).toEqual({
      success: false,
      message: expect.stringContaining('Cannot auto-resolve the union'),
    });
  });

  it('throws a clear error when a non-last union override variant has no discriminantProperty', async () => {
    const result = await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/github-workflow.json',
            resourceType: 'Workflow',
            mode: 'synth-only',
            unionOverrides: [
              {
                unionTypeName: 'Job',
                variants: [
                  {
                    definitionName: 'reusableWorkflowCallJob',
                    typeName: 'ReusableWorkflowCallJob',
                  },
                  { definitionName: 'normalJob', typeName: 'NormalJob' },
                ],
              },
            ],
          },
        ],
      },
      makeContext(),
    );

    expect(result).toEqual({
      success: false,
      message: expect.stringContaining('needs a discriminantProperty'),
    });
  });

  it('honors a custom outputDir', async () => {
    await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        outputDir: 'custom/output',
        schemas: [
          {
            file: 'schemas/github-workflow.json',
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
            file: 'schemas/github-workflow.json',
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
        'schemas/github-workflow.json',
      ),
      'utf-8',
    );
  });

  it('derives the output base name from the schema file', async () => {
    await executor(
      {
        apiVersion: 'github.cdk-x.com/v1',
        schemas: [
          {
            file: 'schemas/dependabot.json',
            resourceType: 'Dependabot',
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
        expect.stringContaining('dependabot.generated.ts'),
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
});
