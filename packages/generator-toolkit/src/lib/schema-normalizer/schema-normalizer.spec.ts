import type { JSONSchema4 } from 'json-schema';
import { SchemaNormalizer } from './schema-normalizer.js';

describe('SchemaNormalizer.normalize — allOf', () => {
  it('collapses a pure single-$ref allOf wrapper straight to $ref', () => {
    const schema: JSONSchema4 = {
      definitions: {
        create: {
          $comment: 'https://example.com',
          description: 'Runs on create.',
          allOf: [{ $ref: '#/definitions/eventObject' }],
        },
        eventObject: { additionalProperties: true },
      },
    };

    const result = SchemaNormalizer.normalize(schema);

    expect(result.definitions?.['create']).toEqual({
      $comment: 'https://example.com',
      description: 'Runs on create.',
      $ref: '#/definitions/eventObject',
    });
  });

  it('drops the allOf wrapper (keeping local properties) when the node has its own shape', () => {
    const schema: JSONSchema4 = {
      definitions: {
        workflow_run: {
          allOf: [{ $ref: '#/definitions/eventObject' }],
          description: 'Runs on workflow_run.',
          properties: {
            types: { type: 'array', items: { type: 'string' } },
          },
        },
        eventObject: { additionalProperties: true },
      },
    };

    const result = SchemaNormalizer.normalize(schema);

    expect(result.definitions?.['workflow_run']).toEqual({
      description: 'Runs on workflow_run.',
      properties: {
        types: { type: 'array', items: { type: 'string' } },
      },
    });
  });

  it('leaves a multi-branch allOf (if/then/else) untouched', () => {
    const schema: JSONSchema4 = {
      definitions: {
        workflowDispatchInput: {
          type: 'object',
          properties: { type: { type: 'string' }, default: {} },
          allOf: [
            {
              if: { properties: { type: { const: 'string' } } },
              then: { properties: { default: { type: 'string' } } },
            },
          ],
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const node = result.definitions?.['workflowDispatchInput'] as JSONSchema4;

    expect(node.allOf).toHaveLength(1);
    expect((node.allOf?.[0] as JSONSchema4).if).toBeDefined();
  });
});

describe('SchemaNormalizer.normalize — constraint-only oneOf', () => {
  it('drops a oneOf where every branch is just {required} and notes the exclusivity', () => {
    const schema: JSONSchema4 = {
      definitions: {
        step: {
          type: 'object',
          additionalProperties: false,
          description: 'A single task in a job.',
          properties: {
            uses: { type: 'string' },
            run: { type: 'string' },
            wait: { type: 'string' },
          },
          oneOf: [
            { required: ['uses'] },
            { required: ['run'] },
            { required: ['wait'] },
          ],
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const node = result.definitions?.['step'] as JSONSchema4;

    expect(node.oneOf).toBeUndefined();
    expect(node.properties).toEqual({
      uses: { type: 'string' },
      run: { type: 'string' },
      wait: { type: 'string' },
    });
    expect(node.description).toBe(
      'A single task in a job.\n\nExactly one of: uses, run, wait must be set.',
    );
  });

  it('leaves a real structural-variant oneOf (branches are $refs to different definitions) untouched', () => {
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
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const jobsValue = (result.properties?.['jobs'] as JSONSchema4)
      .additionalProperties as JSONSchema4;

    expect(jobsValue.oneOf).toEqual([
      { $ref: '#/definitions/normalJob' },
      { $ref: '#/definitions/reusableWorkflowCallJob' },
    ]);
  });
});

describe('SchemaNormalizer.normalize — patternProperties', () => {
  it('moves a single dynamic-key pattern into additionalProperties (the "jobs" shape)', () => {
    const schema: JSONSchema4 = {
      properties: {
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
          minProperties: 1,
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const jobs = result.properties?.['jobs'] as JSONSchema4;

    expect(jobs.patternProperties).toBeUndefined();
    expect(jobs.additionalProperties).toEqual({
      oneOf: [
        { $ref: '#/definitions/normalJob' },
        { $ref: '#/definitions/reusableWorkflowCallJob' },
      ],
    });
    expect(jobs.minProperties).toBe(1);
  });

  it('expands a literal-alternation pattern into named properties (the "branches"/"branches-ignore" shape)', () => {
    const schema: JSONSchema4 = {
      definitions: {
        workflow_run: {
          properties: {
            types: { type: 'array', items: { type: 'string' } },
          },
          patternProperties: {
            '^branches(-ignore)?$': {},
          },
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const node = result.definitions?.['workflow_run'] as JSONSchema4;

    expect(node.patternProperties).toBeUndefined();
    expect(node.properties).toEqual({
      types: { type: 'array', items: { type: 'string' } },
      branches: {},
      'branches-ignore': {},
    });
  });

  it('drops the pattern entirely when a real additionalProperties already exists (the "matrix" shape)', () => {
    const schema: JSONSchema4 = {
      definitions: {
        matrixInclude: {
          type: 'object',
          patternProperties: {
            '^(in|ex)clude$': {
              oneOf: [{ $ref: '#/definitions/expressionSyntax' }],
            },
          },
          additionalProperties: {
            oneOf: [{ $ref: '#/definitions/expressionSyntax' }],
          },
          minProperties: 1,
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const node = result.definitions?.['matrixInclude'] as JSONSchema4;

    expect(node.patternProperties).toBeUndefined();
    expect(node.additionalProperties).toEqual({
      oneOf: [{ $ref: '#/definitions/expressionSyntax' }],
    });
  });

  it('throws on more than one dynamic-key pattern with no properties or additionalProperties sibling', () => {
    const schema: JSONSchema4 = {
      definitions: {
        weird: {
          patternProperties: {
            '^[a-z]+$': { type: 'string' },
            '^[A-Z]+$': { type: 'number' },
          },
        },
      },
    };

    expect(() => SchemaNormalizer.normalize(schema)).toThrow(
      /Unsupported patternProperties shape/,
    );
  });
});

describe('SchemaNormalizer.normalize — if/then/else annotation', () => {
  it('appends a @remarks note to a node whose allOf contains an if branch', () => {
    const schema: JSONSchema4 = {
      definitions: {
        workflowDispatchInput: {
          type: 'object',
          description: 'A workflow_dispatch input.',
          properties: { type: { type: 'string' }, default: {} },
          allOf: [
            {
              if: { properties: { type: { const: 'string' } } },
              then: { properties: { default: { type: 'string' } } },
            },
          ],
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const node = result.definitions?.['workflowDispatchInput'] as JSONSchema4;

    expect(node.description).toContain('A workflow_dispatch input.');
    expect(node.description).toContain('@remarks');
    expect(node.allOf).toHaveLength(1); // structurally untouched
  });
});

describe('SchemaNormalizer.normalize — recursive self-ref documentation', () => {
  it('appends a @remarks note to #/definitions/configuration', () => {
    const schema: JSONSchema4 = {
      definitions: {
        configuration: {
          description: 'A configuration value.',
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

    const result = SchemaNormalizer.normalize(schema);
    const node = result.definitions?.['configuration'] as JSONSchema4;

    expect(node.description).toContain('A configuration value.');
    expect(node.description).toContain('recursive');
  });

  it('is a no-op when there is no configuration definition', () => {
    const schema: JSONSchema4 = { definitions: { foo: { type: 'string' } } };

    expect(() => SchemaNormalizer.normalize(schema)).not.toThrow();
  });
});

describe('SchemaNormalizer.normalize — inline union branch name synthesis', () => {
  it('hoists an inline branch of a real structural-variant union into a named definition', () => {
    const schema: JSONSchema4 = {
      definitions: {
        job: {
          oneOf: [
            { $ref: '#/definitions/normalJob' },
            {
              type: 'object',
              properties: { uses: { type: 'string' } },
            },
          ],
        },
        normalJob: {
          type: 'object',
          properties: { runsOn: { type: 'string' } },
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const job = result.definitions?.['job'] as JSONSchema4;

    expect(job.oneOf?.[0]).toEqual({ $ref: '#/definitions/normalJob' });
    const secondBranch = job.oneOf?.[1] as JSONSchema4;
    expect(secondBranch.$ref).toMatch(/^#\/definitions\/JobVariant2$/);
    expect(result.definitions?.['JobVariant2']).toEqual({
      type: 'object',
      properties: { uses: { type: 'string' } },
    });
  });

  it('does not hoist branches of a constraint-only oneOf (not a real variant union)', () => {
    const schema: JSONSchema4 = {
      definitions: {
        step: {
          type: 'object',
          properties: { uses: { type: 'string' }, run: { type: 'string' } },
          oneOf: [{ required: ['uses'] }, { required: ['run'] }],
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);

    // constraint-only oneOf is dropped entirely before hoisting ever runs
    expect(result.definitions?.['step']).not.toHaveProperty('oneOf');
    expect(Object.keys(result.definitions ?? {})).toEqual(['step']);
  });

  it('does not hoist a mixed primitive/$ref oneOf (the real "cancel-in-progress" shape)', () => {
    // Real github-workflow.json shape: concurrency.cancel-in-progress is
    // `oneOf: [{ type: 'boolean' }, { $ref: expressionSyntax }]` — a bare
    // primitive alongside a $ref is NOT a real struct-variant union (it's
    // the same class of accepted-permissive mixed union as root `on`), and
    // must not be hoisted into a fake named union UnionDetector would then
    // wrongly try to auto-resolve.
    const schema: JSONSchema4 = {
      properties: {
        concurrency: {
          type: 'object',
          properties: {
            'cancel-in-progress': {
              oneOf: [
                { type: 'boolean' },
                { $ref: '#/definitions/expressionSyntax' },
              ],
            },
          },
        },
      },
      definitions: {
        expressionSyntax: { type: 'string' },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const property = (
      (result.properties?.['concurrency'] as JSONSchema4).properties as Record<
        string,
        JSONSchema4
      >
    )['cancel-in-progress'] as JSONSchema4;

    expect(property.oneOf).toEqual([
      { type: 'boolean' },
      { $ref: '#/definitions/expressionSyntax' },
    ]);
    expect(Object.keys(result.definitions ?? {})).toEqual(['expressionSyntax']);
  });

  it('does not hoist an inline-object/$ref-to-primitive oneOf (the real "env" shape)', () => {
    // Real github-workflow.json shape: env is
    // `oneOf: [{ type: 'object', additionalProperties: {...} },
    //          { $ref: stringContainingExpressionSyntax }]` — the second
    // branch IS a $ref, but its *target* is a plain string type. Being a
    // $ref at all isn't sufficient evidence of object-shapedness; the
    // referenced definition must actually be resolved and checked.
    const schema: JSONSchema4 = {
      properties: { env: { $ref: '#/definitions/env' } },
      definitions: {
        env: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            { $ref: '#/definitions/stringContainingExpressionSyntax' },
          ],
        },
        stringContainingExpressionSyntax: { type: 'string' },
      },
    };

    const result = SchemaNormalizer.normalize(schema);
    const env = result.definitions?.['env'] as JSONSchema4;

    expect(env.oneOf).toEqual([
      { type: 'object', additionalProperties: { type: 'string' } },
      { $ref: '#/definitions/stringContainingExpressionSyntax' },
    ]);
    expect(Object.keys(result.definitions ?? {})).toEqual([
      'env',
      'stringContainingExpressionSyntax',
    ]);
  });
});

describe('SchemaNormalizer.normalize — real-schema regression', () => {
  it('produces the expected shape for the real jobs/normalJob/step pattern', () => {
    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
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
          minProperties: 1,
        },
      },
      definitions: {
        normalJob: {
          type: 'object',
          properties: {
            'runs-on': { type: 'string' },
            steps: {
              type: 'array',
              items: { $ref: '#/definitions/step' },
            },
          },
        },
        reusableWorkflowCallJob: {
          type: 'object',
          properties: { uses: { type: 'string' } },
        },
        step: {
          type: 'object',
          additionalProperties: false,
          properties: {
            uses: { type: 'string' },
            run: { type: 'string' },
          },
          oneOf: [{ required: ['uses'] }, { required: ['run'] }],
        },
      },
    };

    const result = SchemaNormalizer.normalize(schema);

    const jobs = result.properties?.['jobs'] as JSONSchema4;
    expect(jobs.patternProperties).toBeUndefined();
    expect(jobs.additionalProperties).toEqual({
      oneOf: [
        { $ref: '#/definitions/normalJob' },
        { $ref: '#/definitions/reusableWorkflowCallJob' },
      ],
    });

    const step = result.definitions?.['step'] as JSONSchema4;
    expect(step.oneOf).toBeUndefined();
    expect(step.properties).toEqual({
      uses: { type: 'string' },
      run: { type: 'string' },
    });
  });
});
