import { Construct } from 'constructs';
import { App } from '../app/app.js';
import { Resource } from '../resource/resource.js';
import { Stack } from '../stack/stack.js';
import { Component } from './component.js';

class DummyComponent extends Component {
  protected toProperties(): Record<string, unknown> {
    return {};
  }
}

class DummyResource extends Resource {
  public readonly resourceType = 'Dummy';
  public readonly apiVersion = 'dummy.cdk-x.com/v1';

  protected toProperties(): Record<string, unknown> {
    return {};
  }
}

describe('Component', () => {
  describe('containment', () => {
    it('constructs without error when its direct parent is a Resource', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const resource = new DummyResource(stack, 'Resource');

      expect(() => new DummyComponent(resource, 'Component')).not.toThrow();
    });

    it('constructs without error through intermediate plain Constructs before reaching a Resource', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const resource = new DummyResource(stack, 'Resource');
      const organizational = new Construct(resource, 'Organizational');

      expect(
        () => new DummyComponent(organizational, 'Component'),
      ).not.toThrow();
    });

    it('constructs without error when nested inside another Component that descends from a Resource', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const resource = new DummyResource(stack, 'Resource');
      const play = new DummyComponent(resource, 'Play');

      expect(() => new DummyComponent(play, 'Task')).not.toThrow();
    });

    it('throws when constructed directly inside a Stack', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');

      expect(() => new DummyComponent(stack, 'Component')).toThrow(
        /must descend from a Resource/,
      );
    });

    it('throws when constructed under a plain Construct that hangs directly off a Stack', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const organizational = new Construct(stack, 'Organizational');

      expect(() => new DummyComponent(organizational, 'Component')).toThrow(
        /must descend from a Resource/,
      );
    });
  });

  describe('isComponent', () => {
    it('returns true for a Component instance', () => {
      const app = new App();
      const stack = new Stack(app, 'Stack');
      const resource = new DummyResource(stack, 'Resource');
      const component = new DummyComponent(resource, 'Component');

      expect(Component.isComponent(component)).toBe(true);
    });

    it('returns false for a non-Component value', () => {
      expect(Component.isComponent({})).toBe(false);
    });
  });
});
