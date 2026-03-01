import { HetznerProvider } from './hetzner.js';

describe('HetznerProvider', () => {
  it('should have identifier "Hetzner"', () => {
    const provider = new HetznerProvider();
    expect(provider.identifier).toBe('Hetzner');
  });
});
