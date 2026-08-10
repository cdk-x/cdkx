import { UnionOverrideMatcher, type UnionOverride } from './union-override.js';

describe('UnionOverrideMatcher.matches', () => {
  const override: UnionOverride = {
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

  it('matches an inline oneOf whose branches are exactly the variant $refs, in any order', () => {
    expect(
      UnionOverrideMatcher.matches(
        {
          oneOf: [
            { $ref: '#/definitions/normalJob' },
            { $ref: '#/definitions/reusableWorkflowCallJob' },
          ],
        },
        override,
      ),
    ).toBe(true);
  });

  it('matches anyOf the same way', () => {
    expect(
      UnionOverrideMatcher.matches(
        {
          anyOf: [
            { $ref: '#/definitions/reusableWorkflowCallJob' },
            { $ref: '#/definitions/normalJob' },
          ],
        },
        override,
      ),
    ).toBe(true);
  });

  it('does not match a node with no oneOf/anyOf', () => {
    expect(UnionOverrideMatcher.matches({ type: 'object' }, override)).toBe(
      false,
    );
  });

  it('does not match a oneOf with a different set of $refs', () => {
    expect(
      UnionOverrideMatcher.matches(
        {
          oneOf: [
            { $ref: '#/definitions/normalJob' },
            { $ref: '#/definitions/somethingElse' },
          ],
        },
        override,
      ),
    ).toBe(false);
  });

  it('does not match a oneOf with an inline (non-$ref) branch', () => {
    expect(
      UnionOverrideMatcher.matches(
        {
          oneOf: [{ $ref: '#/definitions/normalJob' }, { type: 'object' }],
        },
        override,
      ),
    ).toBe(false);
  });

  it('does not match a constraint-only oneOf (wrong branch count)', () => {
    expect(
      UnionOverrideMatcher.matches(
        { oneOf: [{ required: ['uses'] }] },
        override,
      ),
    ).toBe(false);
  });

  it('handles non-object input safely', () => {
    expect(UnionOverrideMatcher.matches(null, override)).toBe(false);
    expect(UnionOverrideMatcher.matches('string', override)).toBe(false);
    expect(UnionOverrideMatcher.matches(undefined, override)).toBe(false);
  });
});
