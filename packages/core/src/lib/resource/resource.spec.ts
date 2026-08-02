import { Construct } from 'constructs';
import { App } from '../app/app.js';
import { Resolvable } from '../resolvable/resolvable.js';
import { Stack } from '../stack/stack.js';
import { Resource } from './resource.js';

class DummyResource extends Resource {
  public readonly type = 'Dummy::Resource';

  protected toProperties(): Record<string, unknown> {
    return {};
  }
}

describe('Resource', () => {
  describe('getAtt', () => {
    it('returns a value that satisfies Resolvable.isResolvable', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const resource = new DummyResource(stack, 'Resource');

      expect(Resolvable.isResolvable(resource.getAtt('x'))).toBe(true);
    });

    it('resolves to an object referencing the resource path and the attribute name', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const resource = new DummyResource(stack, 'Resource');

      expect(resource.getAtt('x').resolve()).toEqual({
        ref: resource.node.path,
        attr: 'x',
      });
    });
  });

  describe('nesting prevention', () => {
    it('throws when a Resource is constructed directly inside another Resource', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const parent = new DummyResource(stack, 'Parent');

      expect(() => new DummyResource(parent, 'Child')).toThrow(
        /cannot be nested/,
      );
    });

    it('throws when a Resource is nested inside another Resource through an intermediate plain Construct', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const parent = new DummyResource(stack, 'Parent');
      const organizational = new Construct(parent, 'Organizational');

      expect(() => new DummyResource(organizational, 'Child')).toThrow(
        /cannot be nested/,
      );
    });
  });

  describe('addDependency', () => {
    it('adds the target to node.dependencies when both resources belong to the same Stack', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const a = new DummyResource(stack, 'A');
      const b = new DummyResource(stack, 'B');

      a.addDependency(b);

      expect(a.node.dependencies).toContain(b);
    });

    it('throws when the target Resource belongs to a different Stack', () => {
      const app = new App();
      const stackA = new Stack(app, 'StackA');
      const stackB = new Stack(app, 'StackB');
      const a = new DummyResource(stackA, 'A');
      const b = new DummyResource(stackB, 'B');

      expect(() => a.addDependency(b)).toThrow(/Cross-stack dependencies/);
    });
  });

  describe('of', () => {
    it('returns the resource itself when called on a Resource instance', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const resource = new DummyResource(stack, 'Resource');

      expect(Resource.of(resource)).toBe(resource);
    });
  });

  describe('isResource', () => {
    it('returns false for a non-Resource value', () => {
      expect(Resource.isResource({})).toBe(false);
    });
  });
});
