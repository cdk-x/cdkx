import { JsonSchemaAdapter, type JsonSchema } from './json-schema-adapter.js';

const DRAFT_07 = 'http://json-schema.org/draft-07/schema#';

const options = {
  resourceType: 'Workflow',
  apiVersion: 'github.cdk-x.com/v1',
  mode: 'synth-only' as const,
};

describe('JsonSchemaAdapter', () => {
  describe('detectDialect', () => {
    it('returns "draft-07" for a draft-07 $schema URI', () => {
      expect(JsonSchemaAdapter.detectDialect({ $schema: DRAFT_07 })).toBe(
        'draft-07',
      );
    });

    it('throws for a missing $schema', () => {
      expect(() => JsonSchemaAdapter.detectDialect({})).toThrow(
        /Unsupported JSON Schema dialect/,
      );
    });

    it('throws for an unsupported dialect', () => {
      expect(() =>
        JsonSchemaAdapter.detectDialect({
          $schema: 'https://json-schema.org/draft/2020-12/schema',
        }),
      ).toThrow(/Unsupported JSON Schema dialect/);
    });
  });

  describe('toIr', () => {
    it('turns the schema root into an IrResourceNode using the supplied classification', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        description: 'A GitHub Actions workflow.',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      const { resource, components } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource).toEqual({
        resourceType: 'Workflow',
        apiVersion: 'github.cdk-x.com/v1',
        mode: 'synth-only',
        description: 'A GitHub Actions workflow.',
        properties: [
          {
            name: 'name',
            type: { shape: 'primitive', primitive: 'string' },
            required: true,
            description: undefined,
          },
        ],
      });
      expect(components).toEqual([]);
    });

    it('maps primitive types', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          name: { type: 'string' },
          count: { type: 'integer' },
          amount: { type: 'number' },
          active: { type: 'boolean' },
        },
      };

      const { resource } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource.properties).toEqual([
        expect.objectContaining({
          name: 'name',
          type: { shape: 'primitive', primitive: 'string' },
        }),
        expect.objectContaining({
          name: 'count',
          type: { shape: 'primitive', primitive: 'number' },
        }),
        expect.objectContaining({
          name: 'amount',
          type: { shape: 'primitive', primitive: 'number' },
        }),
        expect.objectContaining({
          name: 'active',
          type: { shape: 'primitive', primitive: 'boolean' },
        }),
      ]);
    });

    it('treats a bare untyped object property as unknown', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: { on: { type: 'object' } },
      };

      const { resource } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource.properties[0].type).toEqual({ shape: 'unknown' });
    });

    it('maps a string-keyed additionalProperties object to a record', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          env: { type: 'object', additionalProperties: { type: 'string' } },
        },
      };

      const { resource } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource.properties[0].type).toEqual({
        shape: 'record',
        valueType: { shape: 'primitive', primitive: 'string' },
      });
    });

    it('maps an inline enum, naming it after the property', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          type: { type: 'string', enum: ['uploaded', 'managed'] },
        },
      };

      const { resource } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource.properties[0].type).toEqual({
        shape: 'enum',
        name: 'Type',
        values: ['uploaded', 'managed'],
      });
    });

    it('maps a nested inline object (no $ref) to an inline-shape, not a Component', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          contact: {
            type: 'object',
            properties: { email: { type: 'string' } },
            required: ['email'],
          },
        },
      };

      const { resource, components } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource.properties[0].type).toEqual({
        shape: 'inline-shape',
        name: 'Contact',
        properties: [
          {
            name: 'email',
            type: { shape: 'primitive', primitive: 'string' },
            required: true,
            description: undefined,
          },
        ],
      });
      expect(components).toEqual([]);
    });

    it('resolves a single $ref property into a component-ref with collection "single"', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: { owner: { $ref: '#/definitions/person' } },
        definitions: {
          person: { properties: { name: { type: 'string' } } },
        },
      };

      const { resource, components } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource.properties[0].type).toEqual({
        shape: 'component-ref',
        target: 'Person',
        collection: 'single',
      });
      expect(components).toEqual([
        {
          name: 'Person',
          description: undefined,
          properties: [
            {
              name: 'name',
              type: { shape: 'primitive', primitive: 'string' },
              required: false,
              description: undefined,
            },
          ],
        },
      ]);
    });

    it('resolves an array-of-$ref property into a component-ref with collection "array"', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          steps: { type: 'array', items: { $ref: '#/definitions/step' } },
        },
        definitions: {
          step: { properties: { run: { type: 'string' } } },
        },
      };

      const { resource, components } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource.properties[0].type).toEqual({
        shape: 'component-ref',
        target: 'Step',
        collection: 'array',
      });
      expect(components.map((c) => c.name)).toEqual(['Step']);
    });

    it('resolves an additionalProperties-$ref map property into a component-ref with collection "map"', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          jobs: {
            type: 'object',
            additionalProperties: { $ref: '#/definitions/normalJob' },
          },
        },
        definitions: {
          normalJob: { properties: { name: { type: 'string' } } },
        },
      };

      const { resource, components } = JsonSchemaAdapter.toIr(schema, options);

      expect(resource.properties[0].type).toEqual({
        shape: 'component-ref',
        target: 'NormalJob',
        collection: 'map',
      });
      expect(components.map((c) => c.name)).toEqual(['NormalJob']);
    });

    it('reaches Components transitively, at more than one level of nesting', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          jobs: {
            type: 'object',
            additionalProperties: { $ref: '#/definitions/normalJob' },
          },
        },
        definitions: {
          normalJob: {
            properties: {
              steps: { type: 'array', items: { $ref: '#/definitions/step' } },
            },
          },
          step: { properties: { run: { type: 'string' } } },
        },
      };

      const { components } = JsonSchemaAdapter.toIr(schema, options);

      expect(components.map((c) => c.name)).toEqual(['NormalJob', 'Step']);
    });

    it('resolves the same definition only once when referenced from multiple places', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          primary: { $ref: '#/definitions/person' },
          backup: { $ref: '#/definitions/person' },
        },
        definitions: {
          person: { properties: { name: { type: 'string' } } },
        },
      };

      const { components } = JsonSchemaAdapter.toIr(schema, options);

      expect(components).toHaveLength(1);
    });

    it('throws for a $ref pointing at an undefined definition', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: { owner: { $ref: '#/definitions/missing' } },
      };

      expect(() => JsonSchemaAdapter.toIr(schema, options)).toThrow(
        /Unresolvable \$ref/,
      );
    });

    it('throws for a $ref that is not a local "#/definitions/<name>" pointer', () => {
      const schema: JsonSchema = {
        $schema: DRAFT_07,
        properties: {
          owner: { $ref: './other.schema.json#/definitions/person' },
        },
      };

      expect(() => JsonSchemaAdapter.toIr(schema, options)).toThrow(
        /Unsupported \$ref/,
      );
    });
  });
});
