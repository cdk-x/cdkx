import { SynthHelpers, TestApp, TestStack } from '@cdk-x/testing';
import { HetznerProvider } from '../provider/index.js';
import { HetznerResourceType, NetworkZone } from '../common/index.js';
import { NtvHetznerSubnet, SubnetType } from './ntv-hetzner-subnet.js';

describe('NtvHetznerSubnet', () => {
  let app: ReturnType<typeof TestApp.default>;
  let stack: ReturnType<typeof TestStack.default>;

  beforeEach(() => {
    app = TestApp.default();
    stack = TestStack.default(app, { provider: new HetznerProvider() });
  });

  // ─── isProviderResource ───────────────────────────────────────────────────

  describe('isProviderResource()', () => {
    it('returns true for NtvHetznerSubnet instances', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(NtvHetznerSubnet.isProviderResource(subnet)).toBe(true);
    });

    it('returns false for plain objects', () => {
      expect(NtvHetznerSubnet.isProviderResource({})).toBe(false);
    });
  });

  // ─── render — required props ──────────────────────────────────────────────

  describe('render', () => {
    it('sets the correct resource type', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).type).toBe(
        HetznerResourceType.Networking.SUBNET,
      );
    });

    it('renders required props', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toEqual({
        networkId: 1,
        type: 'cloud',
        networkZone: 'eu-central',
        ipRange: '10.0.0.0/24',
      });
    });

    it('accepts networkId as a string', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 'net-abc123',
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        networkId: 'net-abc123',
      });
    });

    it('accepts networkId as a number', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 42,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        networkId: 42,
      });
    });

    // ─── optional props ───────────────────────────────────────────────────

    it('renders vswitchId when provided', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.VSWITCH,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
        vswitchId: 9876,
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        vswitchId: 9876,
      });
    });

    it('omits vswitchId from output when not provided', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).not.toHaveProperty(
        'vswitchId',
      );
    });

    // ─── SubnetType enum values ───────────────────────────────────────────

    it('serializes SubnetType.CLOUD as "cloud"', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        type: 'cloud',
      });
    });

    it('serializes SubnetType.SERVER as "server"', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.SERVER,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        type: 'server',
      });
    });

    it('serializes SubnetType.VSWITCH as "vswitch"', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.VSWITCH,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        type: 'vswitch',
      });
    });

    // ─── NetworkZone enum values ──────────────────────────────────────────

    it('serializes NetworkZone.EU_CENTRAL as "eu-central"', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        networkZone: 'eu-central',
      });
    });

    it('serializes NetworkZone.US_EAST as "us-east"', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.US_EAST,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        networkZone: 'us-east',
      });
    });

    it('serializes NetworkZone.US_WEST as "us-west"', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.US_WEST,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        networkZone: 'us-west',
      });
    });

    it('serializes NetworkZone.AP_SOUTHEAST as "ap-southeast"', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.CLOUD,
        networkZone: NetworkZone.AP_SOUTHEAST,
        ipRange: '10.0.0.0/24',
      });

      expect(SynthHelpers.resourceEntry(subnet).properties).toMatchObject({
        networkZone: 'ap-southeast',
      });
    });

    // ─── snapshot ─────────────────────────────────────────────────────────

    it('matches snapshot with all props', () => {
      const subnet = new NtvHetznerSubnet(stack, 'Subnet', {
        networkId: 1,
        type: SubnetType.VSWITCH,
        networkZone: NetworkZone.EU_CENTRAL,
        ipRange: '10.0.0.0/24',
        vswitchId: 9876,
      });

      expect(SynthHelpers.resourceEntry(subnet)).toMatchSnapshot();
    });
  });
});
