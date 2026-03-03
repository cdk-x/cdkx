import { Construct } from 'constructs';
import { App } from '../app/app';
import { Stack } from '../stack/stack';
import { Provider } from '../provider/provider';
import { Resource } from './resource';
import { RemovalPolicy } from '../removal-policy';
import { ProviderResource } from '../provider-resource/provider-resource';

class TestProvider extends Provider {
  public readonly identifier = 'test';
}

class TestResource extends Resource {
  public readonly l1: ProviderResource;
  constructor(scope: Construct, id: string) {
    super(scope, id);
    this.l1 = new ProviderResource(this, 'Default', { type: 'test::Resource' });
    this.node.defaultChild = this.l1;
  }
}

describe('Resource', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App({ outdir: '/tmp/cdkx-test-resource' });
    stack = new Stack(app, 'TestStack', { provider: new TestProvider() });
  });

  it('sets logicalId from node path (L2 path, not L1)', () => {
    const resource = new TestResource(stack, 'MyResource');
    expect(resource.logicalId).toBe('TestStack/MyResource');
  });

  it('applyRemovalPolicy delegates to defaultChild ProviderResource', () => {
    const resource = new TestResource(stack, 'MyResource');
    expect(() =>
      resource.applyRemovalPolicy(RemovalPolicy.DESTROY),
    ).not.toThrow();
  });

  it('throws when applyRemovalPolicy called without a ProviderResource defaultChild', () => {
    class BareResource extends Resource {
      constructor(scope: Construct, id: string) {
        super(scope, id);
      }
    }
    const resource = new BareResource(stack, 'BareResource');
    expect(() => resource.applyRemovalPolicy(RemovalPolicy.RETAIN)).toThrow(
      'Cannot apply removal policy to a resource without a provider resource',
    );
  });
});
