import { MultipassProviderRuntime } from './multipass-provider-runtime';
import { MultipassInstanceHandler } from './handlers';

describe('MultipassProviderRuntime', () => {
  let runtime: MultipassProviderRuntime;

  beforeEach(() => {
    runtime = new MultipassProviderRuntime();
  });

  it('registers the Instance handler', () => {
    const handler = runtime.getHandler('Multipass::Compute::Instance');
    expect(handler).toBeInstanceOf(MultipassInstanceHandler);
  });

  it('lists registered resource types', () => {
    const types = runtime.listResourceTypes();
    expect(types).toContain('Multipass::Compute::Instance');
  });

  it('throws for an unknown resource type', () => {
    expect(() => runtime.getHandler('Unknown::Type')).toThrow(
      /no handler registered/i,
    );
  });
});
