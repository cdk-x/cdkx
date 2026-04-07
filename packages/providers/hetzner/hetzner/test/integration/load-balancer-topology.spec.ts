/**
 * Integration test: Hetzner LoadBalancer topology synthesis.
 *
 * Builds and synthesizes a construct tree that exercises the three
 * independent LoadBalancer resources introduced in issue #56:
 *
 *   LoadBalancerStack
 *   ├── AppLb             HtzLoadBalancer       — lb11, eu-central
 *   ├── HttpService       HtzLoadBalancerService — listenPort 80, references lb
 *   └── ServerTarget      HtzLoadBalancerTarget  — server type, references lb
 *
 * RED: This file will not compile until the schemas are added and codegen
 * is run to produce HtzLoadBalancerService and HtzLoadBalancerTarget.
 */
import * as path from 'node:path';
import { App, Stack } from '@cdk-x/core';
import { SynthHelpers } from '@cdk-x/testing';
import {
  HtzLoadBalancer,
  HtzLoadBalancerService,
  HtzLoadBalancerTarget,
  LoadBalancerType,
  LoadBalancerServiceProtocol,
  LoadBalancerTargetType,
  NetworkZone,
} from '../../src/lib/generated';

const OUTDIR = path.resolve(__dirname, '../../cdkx.out');

type ResourceEntry = {
  type: string;
  properties: Record<string, unknown>;
  metadata: Record<string, unknown>;
};
type StackOutput = Record<string, ResourceEntry>;

let stackOut: StackOutput;
let lbLogicalId: string;
let serviceLogicalId: string;
let targetLogicalId: string;

beforeAll(() => {
  const app = new App({ outdir: OUTDIR });
  const stack = new Stack(app, 'LoadBalancerStack', {});

  const lb = new HtzLoadBalancer(stack, 'AppLb', {
    name: 'app-lb',
    loadBalancerType: LoadBalancerType.LB11,
    networkZone: NetworkZone.EU_CENTRAL,
  });
  lbLogicalId = lb.logicalId;

  const service = new HtzLoadBalancerService(stack, 'HttpService', {
    loadBalancerId: lb.attrLoadBalancerId,
    listenPort: 80,
    destinationPort: 8080,
    protocol: LoadBalancerServiceProtocol.TCP,
    proxyprotocol: false,
  });
  serviceLogicalId = service.logicalId;

  const target = new HtzLoadBalancerTarget(stack, 'ServerTarget', {
    loadBalancerId: lb.attrLoadBalancerId,
    type: LoadBalancerTargetType.SERVER,
    serverId: 42,
  });
  targetLogicalId = target.logicalId;

  app.synth();

  stackOut = (
    SynthHelpers.readJson(path.join(OUTDIR, 'LoadBalancerStack.json')) as {
      resources: StackOutput;
    }
  ).resources;
});

// ---------------------------------------------------------------------------
// HtzLoadBalancer — schema cleanup
// ---------------------------------------------------------------------------
describe('HtzLoadBalancer', () => {
  it('has type Hetzner::Compute::LoadBalancer', () => {
    expect(stackOut[lbLogicalId].type).toBe('Hetzner::Compute::LoadBalancer');
  });

  it('does not synthesize services or targets properties', () => {
    const props = stackOut[lbLogicalId].properties;
    expect(props).not.toHaveProperty('services');
    expect(props).not.toHaveProperty('targets');
  });
});

// ---------------------------------------------------------------------------
// HtzLoadBalancerService
// ---------------------------------------------------------------------------
describe('HtzLoadBalancerService', () => {
  it('has type Hetzner::Compute::LoadBalancerService', () => {
    expect(stackOut[serviceLogicalId].type).toBe(
      'Hetzner::Compute::LoadBalancerService',
    );
  });

  it('loadBalancerId is a cross-reference token pointing to the lb', () => {
    expect(stackOut[serviceLogicalId].properties['loadBalancerId']).toEqual({
      ref: lbLogicalId,
      attr: 'loadBalancerId',
    });
  });

  it('listenPort is 80', () => {
    expect(stackOut[serviceLogicalId].properties['listenPort']).toBe(80);
  });

  it('destinationPort is 8080', () => {
    expect(stackOut[serviceLogicalId].properties['destinationPort']).toBe(8080);
  });

  it('metadata cdkx:path is LoadBalancerStack/HttpService', () => {
    expect(stackOut[serviceLogicalId].metadata['cdkx:path']).toBe(
      'LoadBalancerStack/HttpService',
    );
  });
});

// ---------------------------------------------------------------------------
// HtzLoadBalancerTarget
// ---------------------------------------------------------------------------
describe('HtzLoadBalancerTarget', () => {
  it('has type Hetzner::Compute::LoadBalancerTarget', () => {
    expect(stackOut[targetLogicalId].type).toBe(
      'Hetzner::Compute::LoadBalancerTarget',
    );
  });

  it('loadBalancerId is a cross-reference token pointing to the lb', () => {
    expect(stackOut[targetLogicalId].properties['loadBalancerId']).toEqual({
      ref: lbLogicalId,
      attr: 'loadBalancerId',
    });
  });

  it('type is server', () => {
    expect(stackOut[targetLogicalId].properties['type']).toBe('server');
  });

  it('serverId is 42', () => {
    expect(stackOut[targetLogicalId].properties['serverId']).toBe(42);
  });

  it('metadata cdkx:path is LoadBalancerStack/ServerTarget', () => {
    expect(stackOut[targetLogicalId].metadata['cdkx:path']).toBe(
      'LoadBalancerStack/ServerTarget',
    );
  });
});
