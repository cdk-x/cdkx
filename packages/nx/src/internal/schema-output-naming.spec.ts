import { SchemaOutputNaming } from './schema-output-naming';

describe('SchemaOutputNaming', () => {
  describe('baseName', () => {
    it('strips a ".schema.json" suffix', () => {
      expect(SchemaOutputNaming.baseName('schemas/workflow.schema.json')).toBe(
        'workflow',
      );
    });

    it('strips a plain ".json" suffix', () => {
      expect(SchemaOutputNaming.baseName('schemas/workflow.json')).toBe(
        'workflow',
      );
    });

    it('ignores the containing directory', () => {
      expect(
        SchemaOutputNaming.baseName('some/nested/dir/step.schema.json'),
      ).toBe('step');
    });
  });
});
