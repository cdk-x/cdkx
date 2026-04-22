import { Construct } from 'constructs';
import { App } from '../app/app';
import { Acknowledgements } from './acknowledgements';

describe('Acknowledgements', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  afterEach(() => {
    Acknowledgements.clear(app);
  });

  describe('singleton behavior', () => {
    it('should return same instance for same app', () => {
      // Arrange
      const child = new Construct(app, 'Child');

      // Act
      const acks1 = Acknowledgements.of(app);
      const acks2 = Acknowledgements.of(child);

      // Assert
      expect(acks1).toBe(acks2);
    });

    it('should return different instances for different apps', () => {
      // Arrange
      const app2 = new App();

      // Act
      const acks1 = Acknowledgements.of(app);
      const acks2 = Acknowledgements.of(app2);

      // Assert
      expect(acks1).not.toBe(acks2);
      
      // Cleanup
      Acknowledgements.clear(app2);
    });
  });

  describe('add and has', () => {
    it('should acknowledge for exact path', () => {
      // Arrange
      const acks = Acknowledgements.of(app);

      // Act
      acks.add('MyStack/MyResource', 'test-id');

      // Assert
      expect(acks.has('MyStack/MyResource', 'test-id')).toBe(true);
    });

    it('should not acknowledge for different path', () => {
      // Arrange
      const acks = Acknowledgements.of(app);

      // Act
      acks.add('MyStack/MyResource', 'test-id');

      // Assert
      expect(acks.has('OtherStack/OtherResource', 'test-id')).toBe(false);
    });

    it('should acknowledge for child scopes (parent inheritance)', () => {
      // Arrange
      const acks = Acknowledgements.of(app);

      // Act - acknowledge parent
      acks.add('MyStack', 'test-id');

      // Assert - child should be acknowledged
      expect(acks.has('MyStack/MyResource', 'test-id')).toBe(true);
      expect(acks.has('MyStack/MyResource/DeepChild', 'test-id')).toBe(true);
    });

    it('should not acknowledge for sibling scopes', () => {
      // Arrange
      const acks = Acknowledgements.of(app);

      // Act
      acks.add('MyStack/ResourceA', 'test-id');

      // Assert
      expect(acks.has('MyStack/ResourceB', 'test-id')).toBe(false);
    });

    it('should work with IConstruct', () => {
      // Arrange
      const stack = new Construct(app, 'MyStack');
      const resource = new Construct(stack, 'MyResource');
      const acks = Acknowledgements.of(app);

      // Act
      acks.add(stack, 'stack-warning');
      acks.add(resource, 'resource-warning');

      // Assert
      expect(acks.has(stack, 'stack-warning')).toBe(true);
      expect(acks.has(resource, 'stack-warning')).toBe(true); // Inherited from parent
      expect(acks.has(resource, 'resource-warning')).toBe(true);
      expect(acks.has(stack, 'resource-warning')).toBe(false); // Child doesn't affect parent
    });

    it('should support multiple IDs per scope', () => {
      // Arrange
      const acks = Acknowledgements.of(app);

      // Act
      acks.add('MyStack', 'id-1');
      acks.add('MyStack', 'id-2');

      // Assert
      expect(acks.has('MyStack', 'id-1')).toBe(true);
      expect(acks.has('MyStack', 'id-2')).toBe(true);
      expect(acks.has('MyStack', 'id-3')).toBe(false);
    });
  });

  describe('getAcknowledgedIds', () => {
    it('should return empty set for non-acknowledged scope', () => {
      // Arrange
      const acks = Acknowledgements.of(app);

      // Act
      const ids = acks.getAcknowledgedIds('MyStack');

      // Assert
      expect(ids.size).toBe(0);
    });

    it('should return acknowledged IDs for exact scope only', () => {
      // Arrange
      const acks = Acknowledgements.of(app);
      acks.add('MyStack', 'parent-id');
      acks.add('MyStack/Resource', 'child-id');

      // Act
      const stackIds = acks.getAcknowledgedIds('MyStack');
      const resourceIds = acks.getAcknowledgedIds('MyStack/Resource');

      // Assert
      expect([...stackIds]).toEqual(['parent-id']);
      expect([...resourceIds]).toEqual(['child-id']);
    });
  });

  describe('path normalization', () => {
    it('should handle paths with leading slash', () => {
      // Arrange
      const acks = Acknowledgements.of(app);

      // Act
      acks.add('/MyStack', 'test-id');

      // Assert
      expect(acks.has('MyStack', 'test-id')).toBe(true);
      expect(acks.has('/MyStack', 'test-id')).toBe(true);
    });
  });
});
