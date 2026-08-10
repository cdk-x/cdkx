import type { JSONSchema4 } from 'json-schema';
import { Json2jsiiAdapter } from './json2jsii-adapter.js';
import type { UnionOverride } from '../union-override/union-override.js';

describe('Json2jsiiAdapter.generate', () => {
  it('generates a props interface for a simple schema', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        'runs-on': { type: 'string' },
      },
    };

    const result = Json2jsiiAdapter.generate(schema, {
      resourceType: 'Workflow',
      pointer: '#',
    });

    expect(result.propsTypeName).toBe('WorkflowProps');
    expect(result.source).toContain('export interface WorkflowProps');
    expect(result.source).toContain('readonly name?: string;');
    expect(result.source).toContain('readonly runsOn?: string;');
  });

  it('never emits toJson_* functions — serialization is generated separately', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };

    const result = Json2jsiiAdapter.generate(schema, {
      resourceType: 'Workflow',
      pointer: '#',
    });

    expect(result.source).not.toContain('toJson_');
    expect(result.source).not.toContain('export function');
  });

  it('resolves a definitions-relative pointer for a non-root Resource (future GVK use case)', () => {
    const schema: JSONSchema4 = {
      definitions: {
        Pod: {
          type: 'object',
          properties: { apiVersion: { type: 'string' } },
        },
      },
    };

    const result = Json2jsiiAdapter.generate(schema, {
      resourceType: 'Pod',
      pointer: '#/definitions/Pod',
    });

    expect(result.propsTypeName).toBe('PodProps');
    expect(result.source).toContain('export interface PodProps');
  });

  it('threads $ref-reachable definitions through correctly', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        permissions: { $ref: '#/definitions/permissions' },
      },
      definitions: {
        permissions: {
          type: 'object',
          properties: { contents: { type: 'string' } },
        },
      },
    };

    const result = Json2jsiiAdapter.generate(schema, {
      resourceType: 'Workflow',
      pointer: '#',
    });

    expect(result.source).toContain('export interface Permissions');
    expect(result.source).toContain('readonly permissions?: Permissions;');
  });

  it('throws on an unsupported root pointer', () => {
    expect(() =>
      Json2jsiiAdapter.generate(
        {},
        { resourceType: 'X', pointer: '#/paths/weird' },
      ),
    ).toThrow(/Unsupported Resource root pointer/);
  });

  describe('union overrides', () => {
    // Matches the real github-workflow.json shape: the oneOf is written
    // *inline* at the additionalProperties site, with no intermediate
    // named $ref (there is no "#/definitions/job" in the real schema).
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        jobs: {
          additionalProperties: {
            oneOf: [
              { $ref: '#/definitions/normalJob' },
              { $ref: '#/definitions/reusableWorkflowCallJob' },
            ],
          },
        },
      },
      definitions: {
        normalJob: {
          type: 'object',
          properties: { 'runs-on': { type: 'string' } },
        },
        reusableWorkflowCallJob: {
          type: 'object',
          properties: { uses: { type: 'string' } },
        },
      },
    };

    const jobOverride: UnionOverride = {
      unionTypeName: 'Job',
      variants: [
        {
          definitionName: 'reusableWorkflowCallJob',
          typeName: 'ReusableWorkflowCallJob',
          isVariant: (x) => `'uses' in (${x})`,
        },
        {
          definitionName: 'normalJob',
          typeName: 'NormalJob',
          isVariant: () => 'true',
        },
      ],
    };

    it('emits the real union type instead of json2jsii\'s default "any" fallback', () => {
      const result = Json2jsiiAdapter.generate(
        schema,
        { resourceType: 'Workflow', pointer: '#' },
        { unionOverrides: [jobOverride] },
      );

      expect(result.source).toContain(
        'export type Job = ReusableWorkflowCallJob | NormalJob;',
      );
      expect(result.source).toContain(
        'readonly jobs?: { [key: string]: Job };',
      );
      expect(result.source).not.toContain(
        'readonly jobs?: { [key: string]: any };',
      );
    });

    it('emits both variant structs as real, named interfaces', () => {
      const result = Json2jsiiAdapter.generate(
        schema,
        { resourceType: 'Workflow', pointer: '#' },
        { unionOverrides: [jobOverride] },
      );

      expect(result.source).toContain('export interface NormalJob');
      expect(result.source).toContain('readonly runsOn?: string;');
      expect(result.source).toContain(
        'export interface ReusableWorkflowCallJob',
      );
      expect(result.source).toContain('readonly uses?: string;');
    });

    it('throws when a variant references an unknown definition', () => {
      expect(() =>
        Json2jsiiAdapter.generate(
          schema,
          { resourceType: 'Workflow', pointer: '#' },
          {
            unionOverrides: [
              {
                unionTypeName: 'Job',
                variants: [
                  {
                    definitionName: 'doesNotExist',
                    typeName: 'DoesNotExist',
                    isVariant: () => 'true',
                  },
                ],
              },
            ],
          },
        ),
      ).toThrow(/unknown definition "doesNotExist"/);
    });
  });
});
