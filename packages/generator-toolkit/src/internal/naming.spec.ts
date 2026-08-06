import { Naming } from './naming.js';

describe('Naming', () => {
  describe('toPascalCase', () => {
    it('capitalizes a single lowercase word', () => {
      expect(Naming.toPascalCase('step')).toBe('Step');
    });

    it('converts kebab-case to PascalCase', () => {
      expect(Naming.toPascalCase('runs-on')).toBe('RunsOn');
    });

    it('converts snake_case to PascalCase', () => {
      expect(Naming.toPascalCase('runs_on')).toBe('RunsOn');
    });

    it('splits an already-camelCase word into separate words', () => {
      expect(Naming.toPascalCase('normalJob')).toBe('NormalJob');
    });
  });

  describe('toCamelCase', () => {
    it('lowercases the first letter of a single word', () => {
      expect(Naming.toCamelCase('Step')).toBe('step');
    });

    it('converts kebab-case to camelCase', () => {
      expect(Naming.toCamelCase('runs-on')).toBe('runsOn');
    });
  });

  describe('isValidIdentifier', () => {
    it('returns true for a plain identifier', () => {
      expect(Naming.isValidIdentifier('name')).toBe(true);
    });

    it('returns false for a string containing a hyphen', () => {
      expect(Naming.isValidIdentifier('runs-on')).toBe(false);
    });

    it('returns false for a string starting with a digit', () => {
      expect(Naming.isValidIdentifier('1name')).toBe(false);
    });
  });
});
