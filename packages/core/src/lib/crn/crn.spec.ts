import { Crn } from './crn';

describe('Crn', () => {
  describe('parse', () => {
    it('should extract all components from a full CRN', () => {
      const crnString =
        'crn:cdkx:hetzner:networking:fsn1:proj-123:network/45678';

      const crn = Crn.parse(crnString);

      expect(crn.provider).toBe('hetzner');
      expect(crn.domain).toBe('networking');
      expect(crn.region).toBe('fsn1');
      expect(crn.account).toBe('proj-123');
      expect(crn.resourceType).toBe('network');
      expect(crn.resourceId).toBe('45678');
    });
  });

  describe('format', () => {
    it('should build CRN string from all components', () => {
      const crn = Crn.format({
        provider: 'hetzner',
        domain: 'networking',
        region: 'fsn1',
        account: 'proj-123',
        resourceType: 'network',
        resourceId: '45678',
      });

      expect(crn).toBe(
        'crn:cdkx:hetzner:networking:fsn1:proj-123:network/45678',
      );
    });

    it('should build CRN without optional region and account', () => {
      const crn = Crn.format({
        provider: 'multipass',
        domain: 'compute',
        resourceType: 'instance',
        resourceId: 'my-vm',
      });

      expect(crn).toBe('crn:cdkx:multipass:compute:instance/my-vm');
    });

    it('should build CRN with resource name', () => {
      const crn = Crn.format({
        provider: 'hetzner',
        domain: 'compute',
        region: 'nbg1',
        account: 'proj-456',
        resourceType: 'server',
        resourceName: 'web-server',
        resourceId: '98765',
      });

      expect(crn).toBe(
        'crn:cdkx:hetzner:compute:nbg1:proj-456:server:web-server/98765',
      );
    });
  });

  describe('isCrn', () => {
    it('should return true for valid CRN strings', () => {
      expect(
        Crn.isCrn('crn:cdkx:hetzner:networking:fsn1:proj-123:network/45678'),
      ).toBe(true);
      expect(Crn.isCrn('crn:cdkx:multipass:compute:instance/my-vm')).toBe(true);
    });

    it('should return false for invalid strings', () => {
      expect(Crn.isCrn('not-a-crn')).toBe(false);
      expect(Crn.isCrn('arn:aws:ec2:us-east-1:123:instance/i-123')).toBe(false);
      expect(Crn.isCrn(null)).toBe(false);
      expect(Crn.isCrn(undefined)).toBe(false);
      expect(Crn.isCrn(12345)).toBe(false);
    });
  });

  describe('round-trip', () => {
    it('should parse what format produces', () => {
      const original = {
        provider: 'hetzner',
        domain: 'networking',
        region: 'fsn1',
        account: 'proj-123',
        resourceType: 'network',
        resourceId: '45678',
      };

      const crnString = Crn.format(original);
      const parsed = Crn.parse(crnString);

      expect(parsed.provider).toBe(original.provider);
      expect(parsed.domain).toBe(original.domain);
      expect(parsed.region).toBe(original.region);
      expect(parsed.account).toBe(original.account);
      expect(parsed.resourceType).toBe(original.resourceType);
      expect(parsed.resourceId).toBe(original.resourceId);
    });
  });
});
