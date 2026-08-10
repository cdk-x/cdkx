import type { JSONSchema4 } from 'json-schema';
import { UnionDetector } from './union-detector.js';
import type { UnionOverride } from '../union-override/union-override.js';

const JOBS_SCHEMA: JSONSchema4 = {
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
      required: ['runs-on'],
      properties: { 'runs-on': { type: 'string' }, steps: { type: 'array' } },
    },
    reusableWorkflowCallJob: {
      type: 'object',
      required: ['uses'],
      properties: { uses: { type: 'string' }, with: { type: 'object' } },
    },
  },
};

describe('UnionDetector.detectAndResolve — auto-resolution', () => {
  it('auto-derives the discriminant and union name for the real jobs/normalJob/reusableWorkflowCallJob shape', () => {
    const [resolved] = UnionDetector.detectAndResolve(JOBS_SCHEMA);

    expect(resolved?.unionTypeName).toBe('Job');
    expect(resolved?.variants.map((v) => v.typeName)).toEqual([
      'NormalJob',
      'ReusableWorkflowCallJob',
    ]);
    // last variant is the unconditional fallback
    expect(resolved?.variants[1]?.isVariant('x')).toBe('true');
    // the non-last variant checks its exclusive required field, converted
    // to the TS property name — the discriminant runs against the still-
    // camelCased TS value at serialization time, not the raw schema key.
    expect(resolved?.variants[0]?.isVariant('x')).toBe("'runsOn' in (x)");
  });

  it('deduplicates the same union shape found at multiple locations', () => {
    const schema: JSONSchema4 = {
      properties: {
        jobs: {
          additionalProperties: {
            oneOf: [
              { $ref: '#/definitions/normalJob' },
              { $ref: '#/definitions/reusableWorkflowCallJob' },
            ],
          },
        },
        otherJobs: {
          additionalProperties: {
            oneOf: [
              { $ref: '#/definitions/reusableWorkflowCallJob' },
              { $ref: '#/definitions/normalJob' },
            ],
          },
        },
      },
      definitions: JOBS_SCHEMA.definitions,
    };

    const resolved = UnionDetector.detectAndResolve(schema);

    expect(resolved).toHaveLength(1);
  });

  it('falls back to "AOrB" naming when there is no shared suffix', () => {
    const schema: JSONSchema4 = {
      properties: {
        target: {
          oneOf: [
            { $ref: '#/definitions/deployment' },
            { $ref: '#/definitions/statefulSet' },
          ],
        },
      },
      definitions: {
        deployment: {
          type: 'object',
          required: ['replicas'],
          properties: { replicas: { type: 'number' } },
        },
        statefulSet: {
          type: 'object',
          required: ['serviceName'],
          properties: { serviceName: { type: 'string' } },
        },
      },
    };

    const [resolved] = UnionDetector.detectAndResolve(schema);

    expect(resolved?.unionTypeName).toBe('DeploymentOrStatefulSet');
  });

  it('resolves a 3-variant union, using exactly one unconditional fallback', () => {
    const schema: JSONSchema4 = {
      properties: {
        target: {
          oneOf: [
            { $ref: '#/definitions/a' },
            { $ref: '#/definitions/b' },
            { $ref: '#/definitions/c' },
          ],
        },
      },
      definitions: {
        a: { type: 'object', required: ['aOnly'], properties: { aOnly: {} } },
        b: { type: 'object', required: ['bOnly'], properties: { bOnly: {} } },
        c: { type: 'object', required: ['cOnly'], properties: { cOnly: {} } },
      },
    };

    const [resolved] = UnionDetector.detectAndResolve(schema);

    expect(resolved?.variants.map((v) => v.isVariant('x'))).toEqual([
      "'aOnly' in (x)",
      "'bOnly' in (x)",
      'true',
    ]);
  });
});

describe('UnionDetector.detectAndResolve — what does NOT count as a candidate', () => {
  it('ignores a oneOf mixing $ref and inline branches', () => {
    const schema: JSONSchema4 = {
      properties: {
        on: {
          oneOf: [{ $ref: '#/definitions/event' }, { type: 'array' }],
        },
      },
      definitions: { event: { type: 'string' } },
    };

    expect(UnionDetector.detectAndResolve(schema)).toEqual([]);
  });

  it('ignores a constraint-only oneOf (branches are {required} only)', () => {
    const schema: JSONSchema4 = {
      properties: {
        step: {
          oneOf: [{ required: ['uses'] }, { required: ['run'] }],
        },
      },
    };

    expect(UnionDetector.detectAndResolve(schema)).toEqual([]);
  });

  it('ignores a single-branch oneOf', () => {
    const schema: JSONSchema4 = {
      properties: { x: { oneOf: [{ $ref: '#/definitions/a' }] } },
      definitions: { a: { type: 'object' } },
    };

    expect(UnionDetector.detectAndResolve(schema)).toEqual([]);
  });
});

describe('UnionDetector.detectAndResolve — ambiguous unions', () => {
  it('throws when more than one variant lacks a uniquely-required discriminant', () => {
    const schema: JSONSchema4 = {
      properties: {
        target: {
          oneOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }],
        },
      },
      definitions: {
        a: { type: 'object', properties: { shared: {} } },
        b: { type: 'object', properties: { shared: {} } },
      },
    };

    expect(() => UnionDetector.detectAndResolve(schema)).toThrow(
      /Cannot auto-resolve the union between a, b/,
    );
  });

  it('an explicit override rescues an otherwise-ambiguous union', () => {
    const schema: JSONSchema4 = {
      properties: {
        target: {
          oneOf: [{ $ref: '#/definitions/a' }, { $ref: '#/definitions/b' }],
        },
      },
      definitions: {
        a: { type: 'object', properties: { shared: {} } },
        b: { type: 'object', properties: { shared: {} } },
      },
    };
    const override: UnionOverride = {
      unionTypeName: 'AOrB',
      variants: [
        {
          definitionName: 'a',
          typeName: 'A',
          isVariant: () => 'someCustomCheck(x)',
        },
        { definitionName: 'b', typeName: 'B', isVariant: () => 'true' },
      ],
    };

    const resolved = UnionDetector.detectAndResolve(schema, [override]);

    expect(resolved).toEqual([override]);
  });

  it('an explicit override takes precedence even when auto-resolution would succeed', () => {
    const explicitOverride: UnionOverride = {
      unionTypeName: 'CustomJobName',
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

    const resolved = UnionDetector.detectAndResolve(JOBS_SCHEMA, [
      explicitOverride,
    ]);

    expect(resolved).toEqual([explicitOverride]);
  });
});
