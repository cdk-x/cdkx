import { ansible } from './ansible.js';

describe('ansible', () => {
  it('should work', () => {
    expect(ansible()).toEqual('ansible');
  });
});
