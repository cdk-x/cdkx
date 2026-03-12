import { HetznerProviderRuntime } from './hetzner-provider-runtime';
import { HetznerNetworkHandler } from './handlers';

describe('HetznerProviderRuntime', () => {
  let runtime: HetznerProviderRuntime;

  beforeEach(() => {
    runtime = new HetznerProviderRuntime();
  });

  it('registers the Network handler', () => {
    const handler = runtime.getHandler('Hetzner::Networking::Network');
    expect(handler).toBeInstanceOf(HetznerNetworkHandler);
  });

  it('lists registered resource types', () => {
    const types = runtime.listResourceTypes();
    expect(types).toContain('Hetzner::Networking::Network');
  });

  it('throws for an unknown resource type', () => {
    expect(() => runtime.getHandler('Unknown::Type')).toThrow(
      /no handler registered/i,
    );
  });
});
