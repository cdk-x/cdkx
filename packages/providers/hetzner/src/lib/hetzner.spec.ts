import { HetznerProvider } from './hetzner.js';

describe('HetznerProvider', () => {
  it('should have identifier "hetzner"', () => {
    const provider = new HetznerProvider();
    expect(provider.identifier).toBe('hetzner');
  });
});
