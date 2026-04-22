import { Construct } from 'constructs';
import { App } from '../app/app';
import { Annotations } from './annotations';

describe('Annotations', () => {
  describe('Annotations.of()', () => {
    it('returns an Annotations instance for a construct', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      const annotations = Annotations.of(construct);

      expect(annotations).toBeInstanceOf(Annotations);
    });

    it('returns the same Annotations instance for the same scope', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      const annotations1 = Annotations.of(construct);
      const annotations2 = Annotations.of(construct);

      expect(annotations1).toBe(annotations2);
    });
  });

  describe('addWarning()', () => {
    it('stores warning annotation in construct metadata', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addWarning('test-id', 'This is a warning');

      const metadata = construct.node.metadata;
      const warningEntry = metadata.find(
        (m) =>
          m.type === 'warning' && m.data === 'This is a warning [ack: test-id]',
      );
      expect(warningEntry).toBeDefined();
    });

    it('deduplicates identical warnings', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addWarning('test-id', 'Duplicate warning');
      Annotations.of(construct).addWarning('test-id', 'Duplicate warning');

      const metadata = construct.node.metadata;
      const warningEntries = metadata.filter(
        (m) => m.type === 'warning' && m.data?.includes('Duplicate warning'),
      );
      expect(warningEntries).toHaveLength(1);
    });
  });

  describe('addInfo()', () => {
    it('stores info annotation in construct metadata', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addInfo('info-id', 'This is info');

      const metadata = construct.node.metadata;
      const infoEntry = metadata.find(
        (m) => m.type === 'info' && m.data === 'This is info [ack: info-id]',
      );
      expect(infoEntry).toBeDefined();
    });
  });

  describe('addError()', () => {
    it('stores error annotation in construct metadata without ack tag', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addError('This is an error');

      const metadata = construct.node.metadata;
      const errorEntry = metadata.find(
        (m) => m.type === 'error' && m.data === 'This is an error',
      );
      expect(errorEntry).toBeDefined();
    });
  });

  describe('clear()', () => {
    it('removes all annotations from a construct', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).addWarning('id1', 'Warning 1');
      Annotations.of(construct).addInfo('id2', 'Info 1');

      Annotations.clear(construct);

      const metadata = construct.node.metadata;
      const annotationEntries = metadata.filter(
        (m) => m.type === 'warning' || m.type === 'info' || m.type === 'error'
      );
      expect(annotationEntries).toHaveLength(0);
    });
  });

  describe('acknowledge()', () => {
    it('acknowledges a warning ID for the scope', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).acknowledge('my-warning-id');

      // Should be able to check if acknowledged
      expect(Annotations.isAcknowledged(construct, 'my-warning-id')).toBe(true);
    });

    it('does not affect other IDs', () => {
      const app = new App();
      const construct = new Construct(app, 'MyConstruct');

      Annotations.of(construct).acknowledge('warning-1');

      expect(Annotations.isAcknowledged(construct, 'warning-2')).toBe(false);
    });

    it('parent acknowledgement applies to children', () => {
      const app = new App();
      const parent = new Construct(app, 'Parent');
      const child = new Construct(parent, 'Child');

      Annotations.of(parent).acknowledge('parent-warning');

      // Child should inherit parent's acknowledgement
      expect(Annotations.isAcknowledged(child, 'parent-warning')).toBe(true);
    });
  });
});
