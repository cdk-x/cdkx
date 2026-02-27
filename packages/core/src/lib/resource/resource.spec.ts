import { Construct } from 'constructs';
import { App } from '../app/app.js';
import { Stack } from '../stack/stack.js';
import { Provider } from '../provider/provider.js';
import { Resource } from './resource.js';
import { RemovalPolicy } from '../removal-policy.js';
import { ProviderResource } from '../provider-resource/provider-resource.js';

class TestProvider extends Provider {
  public readonly identifier = 'test';
}

class TestResource extends Resource {
  constructor(scope: Construct, id: string) {
    super(scope, id, {});
    new ProviderResource(this, 'Default', { type: 'test::Resource' });
  }
}

describe('Resource', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App({ outdir: '/tmp/cdkx-test-resource' });
    stack = new Stack(app, 'TestStack', { provider: new TestProvider() });
  });

  it('sets logicalId from node path', () => {
    const resource = new TestResource(stack, 'MyResource');
    expect(resource.logicalId).toBe('TestStack/MyResource');
  });

  it('applyRemovalPolicy delegates to defaultChild ProviderResource', () => {
    const resource = new TestResource(stack, 'MyResource');
    expect(() => resource.applyRemovalPolicy(RemovalPolicy.DESTROY)).not.toThrow();
  });

  it('throws when applyRemovalPolicy called without a ProviderResource defaultChild', () => {
    class BareResource extends Resource {
      constructor(scope: Construct, id: string) {
        super(scope, id, {});
      }
    }
    const resource = new BareResource(stack, 'BareResource');
    expect(() => resource.applyRemovalPolicy(RemovalPolicy.RETAIN)).toThrow(
      'Cannot apply removal policy to a resource without a provider resource',
    );
  });
});
