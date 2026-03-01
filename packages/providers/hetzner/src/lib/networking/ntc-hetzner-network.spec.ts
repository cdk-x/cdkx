import { SynthHelpers, TestApp, TestStack } from '@cdk-x/testing';
import { HetznerProvider } from '../provider/index.js';
import { HetznerResourceType } from '../common/index.js';
import { NtvHetznerNetwork } from './ntc-hetzner-network.js';

describe('NtvHetznerNetwork', () => {
  let app: ReturnType<typeof TestApp.default>;
  let stack: ReturnType<typeof TestStack.default>;

  beforeEach(() => {
    app = TestApp.default();
    stack = TestStack.default(app, { provider: new HetznerProvider() });
  });

  // ─── isProviderResource ───────────────────────────────────────────────────

  describe('isProviderResource()', () => {
    it('returns true for NtvHetznerNetwork instances', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'test-network',
        ipRange: '10.0.0.0/16',
      });

      expect(NtvHetznerNetwork.isProviderResource(network)).toBe(true);
    });

    it('returns false for plain objects', () => {
      expect(NtvHetznerNetwork.isProviderResource({})).toBe(false);
    });
  });

  // ─── render — required props ──────────────────────────────────────────────

  describe('render', () => {
    it('sets the correct resource type', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'my-network',
        ipRange: '10.0.0.0/16',
      });

      expect(SynthHelpers.resourceEntry(network).type).toBe(
        HetznerResourceType.Networking.NETWORK,
      );
    });

    it('renders required props: name and ipRange', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'my-network',
        ipRange: '10.0.0.0/16',
      });

      expect(SynthHelpers.resourceEntry(network).properties).toEqual({
        name: 'my-network',
        ipRange: '10.0.0.0/16',
      });
    });

    // ─── optional props ───────────────────────────────────────────────────

    it('renders labels when provided', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'my-network',
        ipRange: '10.0.0.0/16',
        labels: { env: 'prod', team: 'platform' },
      });

      expect(SynthHelpers.resourceEntry(network).properties).toMatchObject({
        labels: { env: 'prod', team: 'platform' },
      });
    });

    it('renders exposeRoutesToVswitch when provided', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'my-network',
        ipRange: '10.0.0.0/16',
        exposeRoutesToVswitch: true,
      });

      expect(SynthHelpers.resourceEntry(network).properties).toMatchObject({
        exposeRoutesToVswitch: true,
      });
    });

    it('renders all props together', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'my-network',
        ipRange: '10.0.0.0/16',
        labels: { env: 'prod' },
        exposeRoutesToVswitch: false,
      });

      expect(SynthHelpers.resourceEntry(network).properties).toEqual({
        name: 'my-network',
        ipRange: '10.0.0.0/16',
        labels: { env: 'prod' },
        exposeRoutesToVswitch: false,
      });
    });

    // ─── absent optional props ────────────────────────────────────────────

    it('omits labels from output when not provided', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'my-network',
        ipRange: '10.0.0.0/16',
      });

      expect(SynthHelpers.resourceEntry(network).properties).not.toHaveProperty(
        'labels',
      );
    });

    it('omits exposeRoutesToVswitch from output when not provided', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'my-network',
        ipRange: '10.0.0.0/16',
      });

      expect(SynthHelpers.resourceEntry(network).properties).not.toHaveProperty(
        'exposeRoutesToVswitch',
      );
    });

    // ─── snapshot ─────────────────────────────────────────────────────────

    it('matches snapshot with all props', () => {
      const network = new NtvHetznerNetwork(stack, 'Network', {
        name: 'my-network',
        ipRange: '10.0.0.0/16',
        labels: { env: 'prod' },
        exposeRoutesToVswitch: true,
      });

      expect(SynthHelpers.resourceEntry(network)).toMatchSnapshot();
    });
  });
});
