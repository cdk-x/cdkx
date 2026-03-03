/**
 * Integration test: Hetzner network topology synthesis.
 *
 * Builds and synthesizes a realistic networking construct tree:
 *
 *   HetznerNetworkStack
 *   ├── AppNetwork       HtzNetwork  — 10.0.0.0/8, eu-central
 *   ├── SubnetWeb        HtzSubnet   — 10.0.1.0/24, cloud, references network
 *   ├── SubnetApp        HtzSubnet   — 10.0.2.0/24, cloud, references network
 *   ├── RouteDefault     HtzRoute    — 0.0.0.0/0 via 10.0.0.1, references network
 *   ├── RouteManagement  HtzRoute    — 192.168.0.0/16 via 10.0.0.2, references network
 *   └── WebLoadBalancer  HtzLoadBalancer — lb11, attached to network
 *
 * The HtzLoadBalancer.networkId, all subnet networkIds and all route networkIds
 * are wired to HtzNetwork.attrNetworkId — an IResolvable that resolves to
 * { ref: <logicalId>, attr: 'networkId' } at synthesis time.
 *
 * Output is written permanently to packages/providers/hetzner/cdkx.out/ so the
 * synthesized manifest can be inspected after the test run.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { App, Stack } from '@cdk-x/core';
import { SynthHelpers } from '@cdk-x/testing';
import { HetznerProvider } from '../../src/lib/provider/index.js';
import {
  HtzNetwork,
  HtzSubnet,
  HtzRoute,
  HtzLoadBalancer,
  NetworkZone,
  NetworkSubnetType,
  LoadBalancerType,
} from '../../src/lib/resources.generated.js';

// ---------------------------------------------------------------------------
// Permanent output directory — written once in beforeAll, not cleaned up.
// Already gitignored at workspace root via the "cdkx.out" pattern.
// ---------------------------------------------------------------------------
const OUTDIR = path.resolve(__dirname, '../../cdkx.out');

// ---------------------------------------------------------------------------
// Shared test state — populated once in beforeAll.
// ---------------------------------------------------------------------------
type ResourceEntry = {
  type: string;
  properties: Record<string, unknown>;
  metadata: Record<string, unknown>;
};
type StackOutput = Record<string, ResourceEntry>;

let stackOut: StackOutput;
let networkLogicalId: string;
let subnetWebLogicalId: string;
let subnetAppLogicalId: string;
let routeDefaultLogicalId: string;
let routeManagementLogicalId: string;
let lbLogicalId: string;

// ---------------------------------------------------------------------------
// Build and synthesize the construct tree once before all tests.
// ---------------------------------------------------------------------------
beforeAll(() => {
  const app = new App({ outdir: OUTDIR });
  const stack = new Stack(app, 'HetznerNetworkStack', {
    provider: new HetznerProvider(),
  });

  // ── Network ──────────────────────────────────────────────────────────────
  const network = new HtzNetwork(stack, 'AppNetwork', {
    name: 'app-network',
    ipRange: '10.0.0.0/8',
    labels: { env: 'production' },
  });
  networkLogicalId = network.logicalId;

  // ── Subnets ───────────────────────────────────────────────────────────────
  const subnetWeb = new HtzSubnet(stack, 'SubnetWeb', {
    networkId: network.attrNetworkId,
    type: NetworkSubnetType.CLOUD,
    networkZone: NetworkZone.EU_CENTRAL,
    ipRange: '10.0.1.0/24',
  });
  subnetWebLogicalId = subnetWeb.logicalId;

  const subnetApp = new HtzSubnet(stack, 'SubnetApp', {
    networkId: network.attrNetworkId,
    type: NetworkSubnetType.CLOUD,
    networkZone: NetworkZone.EU_CENTRAL,
    ipRange: '10.0.2.0/24',
  });
  subnetAppLogicalId = subnetApp.logicalId;

  // ── Routes ────────────────────────────────────────────────────────────────
  const routeDefault = new HtzRoute(stack, 'RouteDefault', {
    networkId: network.attrNetworkId,
    destination: '0.0.0.0/0',
    gateway: '10.0.0.1',
  });
  routeDefaultLogicalId = routeDefault.logicalId;

  const routeManagement = new HtzRoute(stack, 'RouteManagement', {
    networkId: network.attrNetworkId,
    destination: '192.168.0.0/16',
    gateway: '10.0.0.2',
  });
  routeManagementLogicalId = routeManagement.logicalId;

  // ── Load Balancer ─────────────────────────────────────────────────────────
  const lb = new HtzLoadBalancer(stack, 'WebLoadBalancer', {
    name: 'web-lb',
    loadBalancerType: LoadBalancerType.LB11,
    networkId: network.attrNetworkId,
    networkZone: NetworkZone.EU_CENTRAL,
    labels: { env: 'production', tier: 'web' },
  });
  lbLogicalId = lb.logicalId;

  app.synth();

  stackOut = SynthHelpers.readJson(
    path.join(OUTDIR, 'HetznerNetworkStack.json'),
  ) as StackOutput;
});

// ---------------------------------------------------------------------------
// 1. File system
// ---------------------------------------------------------------------------
describe('file system', () => {
  it('writes HetznerNetworkStack.json to cdkx.out/', () => {
    expect(fs.existsSync(path.join(OUTDIR, 'HetznerNetworkStack.json'))).toBe(
      true,
    );
  });

  it('writes manifest.json to cdkx.out/', () => {
    expect(fs.existsSync(path.join(OUTDIR, 'manifest.json'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Manifest
// ---------------------------------------------------------------------------
describe('manifest', () => {
  let manifest: {
    version: string;
    artifacts: Record<
      string,
      {
        type: string;
        provider: string;
        environment: Record<string, unknown>;
        properties: { templateFile: string };
        displayName: string;
      }
    >;
  };

  beforeAll(() => {
    manifest = SynthHelpers.readJson(
      path.join(OUTDIR, 'manifest.json'),
    ) as typeof manifest;
  });

  it('has artifact key HetznerNetworkStack', () => {
    expect(manifest.artifacts['HetznerNetworkStack']).toBeDefined();
  });

  it('artifact provider is hetzner', () => {
    expect(manifest.artifacts['HetznerNetworkStack'].provider).toBe('hetzner');
  });

  it('artifact templateFile points to the stack JSON', () => {
    expect(
      manifest.artifacts['HetznerNetworkStack'].properties.templateFile,
    ).toBe('HetznerNetworkStack.json');
  });

  it('artifact type is cdkx:stack', () => {
    expect(manifest.artifacts['HetznerNetworkStack'].type).toBe('cdkx:stack');
  });

  it('artifact displayName is HetznerNetworkStack', () => {
    expect(manifest.artifacts['HetznerNetworkStack'].displayName).toBe(
      'HetznerNetworkStack',
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Snapshot — full stack JSON
// ---------------------------------------------------------------------------
describe('snapshot', () => {
  it('stack JSON matches snapshot', () => {
    expect(stackOut).toMatchSnapshot();
  });
});

// ---------------------------------------------------------------------------
// 4. Resource count
// ---------------------------------------------------------------------------
describe('resource count', () => {
  it('stack contains exactly 6 resources', () => {
    expect(Object.keys(stackOut)).toHaveLength(6);
  });
});

// ---------------------------------------------------------------------------
// 5. Network
// ---------------------------------------------------------------------------
describe('HtzNetwork', () => {
  it('has type Hetzner::Networking::Network', () => {
    expect(stackOut[networkLogicalId].type).toBe(
      'Hetzner::Networking::Network',
    );
  });

  it('has correct name', () => {
    expect(stackOut[networkLogicalId].properties['name']).toBe('app-network');
  });

  it('has correct ipRange', () => {
    expect(stackOut[networkLogicalId].properties['ipRange']).toBe('10.0.0.0/8');
  });

  it('has correct labels', () => {
    expect(stackOut[networkLogicalId].properties['labels']).toEqual({
      env: 'production',
    });
  });

  it('metadata cdkx:path is HetznerNetworkStack/AppNetwork', () => {
    expect(stackOut[networkLogicalId].metadata['cdkx:path']).toBe(
      'HetznerNetworkStack/AppNetwork',
    );
  });
});

// ---------------------------------------------------------------------------
// 6. Subnet — web
// ---------------------------------------------------------------------------
describe('HtzSubnet (web)', () => {
  it('has type Hetzner::Networking::Subnet', () => {
    expect(stackOut[subnetWebLogicalId].type).toBe(
      'Hetzner::Networking::Subnet',
    );
  });

  it('networkId is a cross-reference token pointing to the network', () => {
    expect(stackOut[subnetWebLogicalId].properties['networkId']).toEqual({
      ref: networkLogicalId,
      attr: 'networkId',
    });
  });

  it('type is cloud', () => {
    expect(stackOut[subnetWebLogicalId].properties['type']).toBe('cloud');
  });

  it('networkZone is eu-central', () => {
    expect(stackOut[subnetWebLogicalId].properties['networkZone']).toBe(
      'eu-central',
    );
  });

  it('ipRange is 10.0.1.0/24', () => {
    expect(stackOut[subnetWebLogicalId].properties['ipRange']).toBe(
      '10.0.1.0/24',
    );
  });
});

// ---------------------------------------------------------------------------
// 7. Subnet — app
// ---------------------------------------------------------------------------
describe('HtzSubnet (app)', () => {
  it('networkId is a cross-reference token pointing to the network', () => {
    expect(stackOut[subnetAppLogicalId].properties['networkId']).toEqual({
      ref: networkLogicalId,
      attr: 'networkId',
    });
  });

  it('ipRange is 10.0.2.0/24', () => {
    expect(stackOut[subnetAppLogicalId].properties['ipRange']).toBe(
      '10.0.2.0/24',
    );
  });
});

// ---------------------------------------------------------------------------
// 8. Route — default
// ---------------------------------------------------------------------------
describe('HtzRoute (default)', () => {
  it('has type Hetzner::Networking::Route', () => {
    expect(stackOut[routeDefaultLogicalId].type).toBe(
      'Hetzner::Networking::Route',
    );
  });

  it('networkId is a cross-reference token pointing to the network', () => {
    expect(stackOut[routeDefaultLogicalId].properties['networkId']).toEqual({
      ref: networkLogicalId,
      attr: 'networkId',
    });
  });

  it('destination is 0.0.0.0/0', () => {
    expect(stackOut[routeDefaultLogicalId].properties['destination']).toBe(
      '0.0.0.0/0',
    );
  });

  it('gateway is 10.0.0.1', () => {
    expect(stackOut[routeDefaultLogicalId].properties['gateway']).toBe(
      '10.0.0.1',
    );
  });
});

// ---------------------------------------------------------------------------
// 9. Route — management
// ---------------------------------------------------------------------------
describe('HtzRoute (management)', () => {
  it('networkId is a cross-reference token pointing to the network', () => {
    expect(stackOut[routeManagementLogicalId].properties['networkId']).toEqual({
      ref: networkLogicalId,
      attr: 'networkId',
    });
  });

  it('destination is 192.168.0.0/16', () => {
    expect(stackOut[routeManagementLogicalId].properties['destination']).toBe(
      '192.168.0.0/16',
    );
  });

  it('gateway is 10.0.0.2', () => {
    expect(stackOut[routeManagementLogicalId].properties['gateway']).toBe(
      '10.0.0.2',
    );
  });
});

// ---------------------------------------------------------------------------
// 10. Load Balancer
// ---------------------------------------------------------------------------
describe('HtzLoadBalancer', () => {
  it('has type Hetzner::Compute::LoadBalancer', () => {
    expect(stackOut[lbLogicalId].type).toBe('Hetzner::Compute::LoadBalancer');
  });

  it('name is web-lb', () => {
    expect(stackOut[lbLogicalId].properties['name']).toBe('web-lb');
  });

  it('loadBalancerType is lb11', () => {
    expect(stackOut[lbLogicalId].properties['loadBalancerType']).toBe('lb11');
  });

  it('networkId is a cross-reference token pointing to the network', () => {
    expect(stackOut[lbLogicalId].properties['networkId']).toEqual({
      ref: networkLogicalId,
      attr: 'networkId',
    });
  });

  it('networkZone is eu-central', () => {
    expect(stackOut[lbLogicalId].properties['networkZone']).toBe('eu-central');
  });

  it('labels are synthesized correctly', () => {
    expect(stackOut[lbLogicalId].properties['labels']).toEqual({
      env: 'production',
      tier: 'web',
    });
  });

  it('unset optional props are stripped from output', () => {
    const props = stackOut[lbLogicalId].properties;
    expect(props).not.toHaveProperty('algorithm');
    expect(props).not.toHaveProperty('services');
    expect(props).not.toHaveProperty('targets');
    expect(props).not.toHaveProperty('publicInterface');
    expect(props).not.toHaveProperty('location');
  });

  it('metadata cdkx:path is HetznerNetworkStack/WebLoadBalancer', () => {
    expect(stackOut[lbLogicalId].metadata['cdkx:path']).toBe(
      'HetznerNetworkStack/WebLoadBalancer',
    );
  });
});
