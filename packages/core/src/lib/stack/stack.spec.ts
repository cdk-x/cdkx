import { Construct } from 'constructs';
import { App } from '../app/app.js';
import { Resource } from '../resource/resource.js';
import type { PropertyValue } from '../resolvable/resolvable.js';
import { Stack } from './stack.js';

class DummyResource extends Resource {
  public readonly type = 'Dummy::Resource';

  protected toProperties(): Record<string, PropertyValue> {
    return {};
  }
}

describe('Stack', () => {
  it('can be constructed as a child of an App', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');

    expect(stack.node.scope).toBe(app);
  });

  describe('of', () => {
    it('returns the stack itself when called directly on a Stack instance', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');

      expect(Stack.of(stack)).toBe(stack);
    });

    it('returns the owning stack when called on a descendant Resource', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const resource = new DummyResource(stack, 'Resource');

      expect(Stack.of(resource)).toBe(stack);
    });

    it('throws when the construct has no Stack ancestor', () => {
      const app = new App();

      expect(() => Stack.of(app)).toThrow(/No Stack found/);
    });
  });

  describe('isStack', () => {
    it('returns false for a non-Stack value', () => {
      expect(Stack.isStack({})).toBe(false);
    });
  });

  describe('getResources', () => {
    it('returns all descendant Resources, including those nested under intermediate plain Constructs', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const direct = new DummyResource(stack, 'Direct');
      const organizational = new Construct(stack, 'Organizational');
      const nested = new DummyResource(organizational, 'Nested');

      expect(stack.getResources()).toEqual(
        expect.arrayContaining([direct, nested]),
      );
    });

    it('excludes descendants that are not Resources', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      new Construct(stack, 'Organizational');

      expect(stack.getResources()).toEqual([]);
    });
  });
});
