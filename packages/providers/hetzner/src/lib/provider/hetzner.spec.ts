import { Location } from '../common/common.js';
import { HetznerProvider } from './hetzner.js';

const MINIMAL_PROPS = {
  projectName: 'my-project',
  apiToken: 'test-token-abc123',
};

describe('HetznerProvider', () => {
  describe('identifier', () => {
    it('should have identifier "Hetzner"', () => {
      const provider = new HetznerProvider(MINIMAL_PROPS);
      expect(provider.identifier).toBe('Hetzner');
    });
  });

  describe('apiToken', () => {
    it('should expose apiToken via getter', () => {
      const provider = new HetznerProvider(MINIMAL_PROPS);
      expect(provider.apiToken).toBe('test-token-abc123');
    });
  });

  describe('getEnvironment()', () => {
    it('should include projectName when only required props are provided', () => {
      const provider = new HetznerProvider(MINIMAL_PROPS);
      expect(provider.getEnvironment()).toEqual({
        projectName: 'my-project',
      });
    });

    it('should include location when provided', () => {
      const provider = new HetznerProvider({
        ...MINIMAL_PROPS,
        location: Location.NBG1,
      });
      expect(provider.getEnvironment()).toEqual({
        projectName: 'my-project',
        location: 'nbg1',
      });
    });

    it('should include datacenter when provided', () => {
      const provider = new HetznerProvider({
        ...MINIMAL_PROPS,
        datacenter: 'nbg1-dc3',
      });
      expect(provider.getEnvironment()).toEqual({
        projectName: 'my-project',
        datacenter: 'nbg1-dc3',
      });
    });

    it('should include both location and datacenter when both are provided', () => {
      const provider = new HetznerProvider({
        ...MINIMAL_PROPS,
        location: Location.FSN1,
        datacenter: 'fsn1-dc14',
      });
      expect(provider.getEnvironment()).toEqual({
        projectName: 'my-project',
        location: 'fsn1',
        datacenter: 'fsn1-dc14',
      });
    });

    it('should not include location when undefined', () => {
      const provider = new HetznerProvider({
        ...MINIMAL_PROPS,
        location: undefined,
      });
      expect(provider.getEnvironment()).not.toHaveProperty('location');
    });

    it('should not include datacenter when undefined', () => {
      const provider = new HetznerProvider({
        ...MINIMAL_PROPS,
        datacenter: undefined,
      });
      expect(provider.getEnvironment()).not.toHaveProperty('datacenter');
    });

    it('should never include apiToken in environment output', () => {
      const provider = new HetznerProvider({
        ...MINIMAL_PROPS,
        location: Location.HEL1,
        datacenter: 'hel1-dc2',
      });
      const env = provider.getEnvironment();
      expect(env).not.toHaveProperty('apiToken');
      expect(Object.values(env)).not.toContain('test-token-abc123');
    });
  });
});
