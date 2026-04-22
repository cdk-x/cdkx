import { Construct } from 'constructs';
import { App } from '../app/app';
import { Acknowledgements } from '../acknowledgements/acknowledgements';
import { Annotations } from './annotations';
import { AnnotationCollector } from './annotation-collector';

describe('AnnotationCollector', () => {
  afterEach(() => {
    // Clean up singletons
    try {
      const apps = [new App()];
      Acknowledgements.clear(apps[0]);
    } catch {
      // Ignore
    }
  });

  describe('collect()', () => {
    it('collects annotations from a single construct', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addWarning('warn-id', 'Test warning');

      const result = AnnotationCollector.collect(app);

      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0]).toMatchObject({
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

      const result = AnnotationCollector.collect(app);

      expect(result.annotations).toHaveLength(2);
      expect(result.annotations.map((a) => a.constructPath)).toContain('Parent');
      expect(result.annotations.map((a) => a.constructPath)).toContain('Parent/Child');
    });

    it('sorts annotations by level: errors first, then warnings, then info', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addInfo('info-id', 'Info message');
      Annotations.of(construct).addError('Error message');
      Annotations.of(construct).addWarning('warn-id', 'Warning message');

      const result = AnnotationCollector.collect(app);

      expect(result.annotations[0].level).toBe('error');
      expect(result.annotations[1].level).toBe('warning');
      expect(result.annotations[2].level).toBe('info');
    });

    it('returns empty array when no annotations exist', () => {
      const app = new App();
      // No annotations added

      const result = AnnotationCollector.collect(app);

      expect(result.annotations).toEqual([]);
    });

    it('tracks used IDs', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addWarning('warn-1', 'First warning');
      Annotations.of(construct).addWarning('warn-2', 'Second warning');
      Annotations.of(construct).addInfo('info-1', 'Info message');

      const result = AnnotationCollector.collect(app);

      expect(result.usedIds.has('warn-1')).toBe(true);
      expect(result.usedIds.has('warn-2')).toBe(true);
      expect(result.usedIds.has('info-1')).toBe(true);
      expect(result.usedIds.has('unused-id')).toBe(false);
    });

    it('filters out acknowledged annotations', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addWarning('acknowledged-id', 'This warning is acknowledged');
      Annotations.of(construct).addWarning('normal-id', 'This warning is not acknowledged');

      // Acknowledge the first warning
      Annotations.of(construct).acknowledge('acknowledged-id');

      const result = AnnotationCollector.collect(app);

      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].id).toBe('normal-id');
    });
  });
});
