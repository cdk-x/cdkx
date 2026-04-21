import { Construct } from 'constructs';
import { App } from '../app/app';
import { Annotations } from './annotations';
import { AnnotationCollector } from './annotation-collector';

describe('AnnotationCollector', () => {
  describe('collect()', () => {
    it('collects annotations from a single construct', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addWarning('warn-id', 'Test warning');

      const annotations = AnnotationCollector.collect(app);

      expect(annotations).toHaveLength(1);
      expect(annotations[0]).toMatchObject({
        level: 'warning',
        message: 'Test warning [ack: warn-id]',
        constructPath: 'MyConstruct',
      });
    });

    it('collects annotations from all constructs in the tree', () => {
      const app = new App();
      const parent = new Construct(app, 'Parent');
      const child = new Construct(parent, 'Child');

      Annotations.of(parent).addWarning('parent-warn', 'Parent warning');
      Annotations.of(child).addInfo('child-info', 'Child info');

      const annotations = AnnotationCollector.collect(app);

      expect(annotations).toHaveLength(2);
      expect(annotations.map((a) => a.constructPath)).toContain('Parent');
      expect(annotations.map((a) => a.constructPath)).toContain('Parent/Child');
    });

    it('sorts annotations by level: errors first, then warnings, then info', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addInfo('info-id', 'Info message');
      Annotations.of(construct).addError('Error message');
      Annotations.of(construct).addWarning('warn-id', 'Warning message');

      const annotations = AnnotationCollector.collect(app);

      expect(annotations[0].level).toBe('error');
      expect(annotations[1].level).toBe('warning');
      expect(annotations[2].level).toBe('info');
    });

    it('returns empty array when no annotations exist', () => {
      const app = new App();
      // No annotations added

      const annotations = AnnotationCollector.collect(app);

      expect(annotations).toEqual([]);
    });
  });
});
