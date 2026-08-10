import { TypeNaming } from './type-naming.js';

describe('TypeNaming.extractDefinitionName', () => {
  it('extracts the name from a #/definitions/ ref', () => {
    expect(TypeNaming.extractDefinitionName('#/definitions/normalJob')).toBe(
      'normalJob',
    );
  });

  it('extracts the name from a #/$defs/ ref', () => {
    expect(TypeNaming.extractDefinitionName('#/$defs/normalJob')).toBe(
      'normalJob',
    );
  });

  it('throws on an unsupported ref', () => {
    expect(() =>
      TypeNaming.extractDefinitionName('https://example.com/schema.json'),
    ).toThrow(/Unsupported \$ref/);
  });
});

describe('TypeNaming.typeNameFromDefinitionName', () => {
  it('PascalCases a camelCase definition name', () => {
    expect(TypeNaming.typeNameFromDefinitionName('normalJob')).toBe(
      'NormalJob',
    );
  });

  it('PascalCases a kebab-case definition name', () => {
    expect(TypeNaming.typeNameFromDefinitionName('multi-ecosystem-group')).toBe(
      'MultiEcosystemGroup',
    );
  });

  it('leaves an already-PascalCase name unchanged', () => {
    expect(TypeNaming.typeNameFromDefinitionName('Job')).toBe('Job');
  });
});
