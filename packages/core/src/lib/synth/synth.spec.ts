import { App } from '../app/app.js';
import { Component } from '../component/component.js';
import { Resource } from '../resource/resource.js';
import { Stack } from '../stack/stack.js';
import { CycleError, Synthesizer } from './synth.js';

class DummyResource extends Resource {
  public readonly type = 'Dummy::Resource';
  public properties: Record<string, unknown> = {};

  protected toProperties(): Record<string, unknown> {
    return this.properties;
  }
}

class DummyComponent extends Component {}

describe('Synthesizer', () => {
  it('produces empty dependsOn for two unrelated Resources', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const a = new DummyResource(stack, 'A');
    const b = new DummyResource(stack, 'B');

    const manifest = Synthesizer.synthesize(app)['Stack'];

    expect(manifest[a.node.path].dependsOn).toEqual([]);
    expect(manifest[b.node.path].dependsOn).toEqual([]);
  });

  it('reflects an explicit addDependency() call in dependsOn', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const a = new DummyResource(stack, 'A');
    const b = new DummyResource(stack, 'B');
    a.addDependency(b);

    const manifest = Synthesizer.synthesize(app)['Stack'];

    expect(manifest[a.node.path].dependsOn).toEqual([b.node.path]);
    expect(manifest[b.node.path].dependsOn).toEqual([]);
  });

  it('infers a dependency from an IResolvable in properties without an explicit addDependency() call', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const a = new DummyResource(stack, 'A');
    const b = new DummyResource(stack, 'B');
    a.properties = { target: b.getAtt('arn') };

    const manifest = Synthesizer.synthesize(app)['Stack'];

    expect(manifest[a.node.path].dependsOn).toEqual([b.node.path]);
    expect(manifest[a.node.path].properties.target).toEqual({
      ref: b.node.path,
      attr: 'arn',
    });
  });

  it('resolves a dependency declared on a Component to its owning Resource', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const a = new DummyResource(stack, 'A');
    const b = new DummyResource(stack, 'B');
    const comp = new DummyComponent(a, 'Comp');
    comp.node.addDependency(b);

    const manifest = Synthesizer.synthesize(app)['Stack'];

    expect(manifest[a.node.path].dependsOn).toEqual([b.node.path]);
    expect(Object.keys(manifest)).not.toContain(comp.node.path);
  });

  it('throws CycleError for a simple A <-> B dependency cycle', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const a = new DummyResource(stack, 'A');
    const b = new DummyResource(stack, 'B');
    a.addDependency(b);
    b.addDependency(a);

    let thrown: unknown;
    try {
      Synthesizer.synthesize(app);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(CycleError);
    const cycle = (thrown as CycleError).cycle;
    expect(cycle[0]).toBe(cycle[cycle.length - 1]);
    expect(cycle).toEqual(expect.arrayContaining([a.node.path, b.node.path]));
  });

  it('throws a cross-stack error when an IResolvable reference points at a Resource in a different Stack', () => {
    const app = new App();
    const stackA = new Stack(app, 'StackA');
    const stackB = new Stack(app, 'StackB');
    const resourceA = new DummyResource(stackA, 'ResourceA');
    const resourceB = new DummyResource(stackB, 'ResourceB');
    resourceA.properties = { target: resourceB.getAtt('x') };

    expect(() => Synthesizer.synthesize(app)).toThrow(
      /Cross-stack dependencies/,
    );
  });

  it('serializes flat and nested properties with no IResolvable unchanged', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const resource = new DummyResource(stack, 'Resource');
    resource.properties = {
      name: 'hello',
      count: 3,
      nested: { flag: true, list: [1, 2, 3] },
    };

    const manifest = Synthesizer.synthesize(app)['Stack'];

    expect(manifest[resource.node.path].properties).toEqual({
      name: 'hello',
      count: 3,
      nested: { flag: true, list: [1, 2, 3] },
    });
  });

  it('never gives a Component its own manifest entry, at any nesting depth', () => {
    const app = new App();
    const stack = new Stack(app, 'Stack');
    const resource = new DummyResource(stack, 'Resource');
    const comp1 = new DummyComponent(resource, 'Comp1');
    new DummyComponent(comp1, 'Comp2');

    const manifest = Synthesizer.synthesize(app)['Stack'];

    expect(Object.keys(manifest)).toEqual([resource.node.path]);
  });

  it('produces independent manifests per Stack without cross-contamination', () => {
    const app = new App();
    const stackA = new Stack(app, 'StackA');
    const stackB = new Stack(app, 'StackB');
    const a1 = new DummyResource(stackA, 'A1');
    const a2 = new DummyResource(stackA, 'A2');
    a1.addDependency(a2);
    const b1 = new DummyResource(stackB, 'B1');

    const manifests = Synthesizer.synthesize(app);

    expect(Object.keys(manifests)).toEqual(
      expect.arrayContaining(['StackA', 'StackB']),
    );
    expect(Object.keys(manifests)).toHaveLength(2);
    expect(Object.keys(manifests['StackA'])).toEqual(
      expect.arrayContaining([a1.node.path, a2.node.path]),
    );
    expect(Object.keys(manifests['StackA'])).not.toContain(b1.node.path);
    expect(manifests['StackA'][a1.node.path].dependsOn).toEqual([a2.node.path]);
    expect(Object.keys(manifests['StackB'])).toEqual([b1.node.path]);
  });
});
