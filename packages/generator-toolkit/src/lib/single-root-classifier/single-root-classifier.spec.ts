import { SingleRootClassifier } from './single-root-classifier.js';

describe('SingleRootClassifier', () => {
  it('returns exactly one root at pointer "#" with the given resourceType', () => {
    const classified = SingleRootClassifier.classify(
      { type: 'object', properties: {} },
      { resourceType: 'Workflow' },
    );

    expect(classified.roots).toEqual([
      { resourceType: 'Workflow', pointer: '#' },
    ]);
  });

  it('ignores the schema document shape', () => {
    const classified = SingleRootClassifier.classify(
      { definitions: { foo: {}, bar: {} } },
      { resourceType: 'Dependabot' },
    );

    expect(classified.roots).toEqual([
      { resourceType: 'Dependabot', pointer: '#' },
    ]);
  });

  it('throws when resourceType is empty', () => {
    expect(() =>
      SingleRootClassifier.classify({}, { resourceType: '' }),
    ).toThrow(/resourceType/);
  });
});
