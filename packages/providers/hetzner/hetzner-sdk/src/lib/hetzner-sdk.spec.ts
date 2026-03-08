import { hetznerSdk } from './hetzner-sdk.js';

describe('hetznerSdk', () => {
  it('should work', () => {
    expect(hetznerSdk()).toEqual('hetzner-sdk');
  });
});
