import type { JSONSchema4 } from 'json-schema';
import { PropsSerializerGenerator } from './props-serializer-generator.js';
import type { UnionOverride } from '../union-override/union-override.js';

describe('PropsSerializerGenerator.generate', () => {
  it('emits a static-only class, never a loose exported function', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };

    const source = PropsSerializerGenerator.generate(
      schema,
      { resourceType: 'Workflow', pointer: '#' },
      'WorkflowProps',
      { serializerClassName: 'WorkflowSerializer' },
    );

    expect(source).toContain('class WorkflowSerializer {');
    expect(source).toContain('private constructor() {}');
    expect(source).not.toMatch(/^export function/m);
  });

  it('does not export the serializer class — it is pure implementation detail', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };

    const source = PropsSerializerGenerator.generate(
      schema,
      { resourceType: 'Workflow', pointer: '#' },
      'WorkflowProps',
      { serializerClassName: 'WorkflowSerializer' },
    );

    expect(source).not.toContain('export class WorkflowSerializer');
    expect(source).toMatch(/^class WorkflowSerializer \{/m);
  });

  it('converts a primitive property with a plain identity accessor', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: { name: { type: 'string' } },
    };

    const source = PropsSerializerGenerator.generate(
      schema,
      { resourceType: 'Workflow', pointer: '#' },
      'WorkflowProps',
      { serializerClassName: 'WorkflowSerializer' },
    );

    expect(source).toContain('"name": obj.name,');
  });

  it('converts a kebab-case property to its camelCase accessor, keeping the original schema key', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: { 'runs-on': { type: 'string' } },
    };

    const source = PropsSerializerGenerator.generate(
      schema,
      { resourceType: 'Workflow', pointer: '#' },
      'WorkflowProps',
      { serializerClassName: 'WorkflowSerializer' },
    );

    expect(source).toContain('"runs-on": obj.runsOn,');
  });

  it('recurses into a $ref-nested struct and emits its own toJson method', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: { permissions: { $ref: '#/definitions/permissions' } },
      definitions: {
        permissions: {
          type: 'object',
          properties: { contents: { type: 'string' } },
        },
      },
    };

    const source = PropsSerializerGenerator.generate(
      schema,
      { resourceType: 'Workflow', pointer: '#' },
      'WorkflowProps',
      { serializerClassName: 'WorkflowSerializer' },
    );

    expect(source).toContain(
      '"permissions": this.toJsonPermissions(obj.permissions),',
    );
    expect(source).toContain(
      'public static toJsonPermissions(obj: Permissions | undefined)',
    );
    expect(source).toContain('"contents": obj.contents,');
  });

  it('passes through a $ref to an enum definition (no recursion, no method emitted)', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: { architecture: { $ref: '#/definitions/architecture' } },
      definitions: {
        architecture: { type: 'string', enum: ['ARM32', 'x64', 'x86'] },
      },
    };

    const source = PropsSerializerGenerator.generate(
      schema,
      { resourceType: 'Workflow', pointer: '#' },
      'WorkflowProps',
      { serializerClassName: 'WorkflowSerializer' },
    );

    expect(source).toContain('"architecture": obj.architecture,');
    expect(source).not.toContain('toJsonArchitecture');
  });

  it('converts an array of a nested struct via .map()', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        steps: { type: 'array', items: { $ref: '#/definitions/step' } },
      },
      definitions: {
        step: { type: 'object', properties: { uses: { type: 'string' } } },
      },
    };

    const source = PropsSerializerGenerator.generate(
      schema,
      { resourceType: 'Workflow', pointer: '#' },
      'WorkflowProps',
      { serializerClassName: 'WorkflowSerializer' },
    );

    expect(source).toContain(
      '"steps": obj.steps?.map((item: any) => this.toJsonStep(item)),',
    );
    expect(source).toContain('public static toJsonStep(');
  });

  it('converts a map (additionalProperties) of a nested struct via Object.entries', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        env: { additionalProperties: { $ref: '#/definitions/envVar' } },
      },
      definitions: {
        envVar: { type: 'object', properties: { value: { type: 'string' } } },
      },
    };

    const source = PropsSerializerGenerator.generate(
      schema,
      { resourceType: 'Workflow', pointer: '#' },
      'WorkflowProps',
      { serializerClassName: 'WorkflowSerializer' },
    );

    expect(source).toContain('Object.entries(obj.env)');
    expect(source).toContain('this.toJsonEnvVar(entry[1])');
  });

  it('does not infinitely recurse on a self-referential (recursive) definition', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        env: { additionalProperties: { $ref: '#/definitions/configuration' } },
      },
      definitions: {
        configuration: {
          oneOf: [
            { type: 'string' },
            {
              type: 'object',
              additionalProperties: { $ref: '#/definitions/configuration' },
            },
          ],
        },
      },
    };

    expect(() =>
      PropsSerializerGenerator.generate(
        schema,
        { resourceType: 'Workflow', pointer: '#' },
        'WorkflowProps',
        { serializerClassName: 'WorkflowSerializer' },
      ),
    ).not.toThrow();
  });

  describe('union overrides — the real jobs/normalJob/step scenario', () => {
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
          properties: {
            'runs-on': { type: 'string' },
            steps: { type: 'array', items: { $ref: '#/definitions/step' } },
          },
        },
        reusableWorkflowCallJob: {
          type: 'object',
          properties: { uses: { type: 'string' } },
        },
        step: { type: 'object', properties: { uses: { type: 'string' } } },
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

    it('discriminates the map value between the two real variants', () => {
      const source = PropsSerializerGenerator.generate(
        schema,
        { resourceType: 'Workflow', pointer: '#' },
        'WorkflowProps',
        {
          serializerClassName: 'WorkflowSerializer',
          unionOverrides: [jobOverride],
        },
      );

      expect(source).toContain("'uses' in (entry[1])");
      expect(source).toContain(
        'this.toJsonReusableWorkflowCallJob(entry[1] as ReusableWorkflowCallJob)',
      );
      expect(source).toContain('this.toJsonNormalJob(entry[1] as NormalJob)');
    });

    it('emits toJson methods for both variants and their own nested types', () => {
      const source = PropsSerializerGenerator.generate(
        schema,
        { resourceType: 'Workflow', pointer: '#' },
        'WorkflowProps',
        {
          serializerClassName: 'WorkflowSerializer',
          unionOverrides: [jobOverride],
        },
      );

      expect(source).toContain('public static toJsonNormalJob(');
      expect(source).toContain('public static toJsonReusableWorkflowCallJob(');
      expect(source).toContain('public static toJsonStep(');
      expect(source).toContain(
        '"steps": obj.steps?.map((item: any) => this.toJsonStep(item)),',
      );
    });

    it('every method is emitted exactly once even though Step/NormalJob could be reached more than once', () => {
      const source = PropsSerializerGenerator.generate(
        schema,
        { resourceType: 'Workflow', pointer: '#' },
        'WorkflowProps',
        {
          serializerClassName: 'WorkflowSerializer',
          unionOverrides: [jobOverride],
        },
      );

      const occurrences = source.split('public static toJsonStep(').length - 1;
      expect(occurrences).toBe(1);
    });
  });
});
