import { hetznerRuntime } from './hetzner-runtime.js';

describe('hetznerRuntime', () => {
  it('should work', () => {
    expect(hetznerRuntime()).toEqual('hetzner-runtime');
  });
});
