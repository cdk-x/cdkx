/**
 * Integration test fixture — simple cdkx app.
 *
 * This file is compiled to a temporary .js by CliHelpers.buildFixture()
 * during CLI integration tests, then executed via `cdkx synth`.
 *
 * It intentionally avoids test helpers and only uses @cdk-x/core directly,
 * simulating exactly what a real user app would look like.
 *
 * Output dir is read from CDKX_OUT_DIR (set by the CLI before spawning).
 */
import { App } from '@cdk-x/core';
import { Stack } from '@cdk-x/core';
import { ProviderResource } from '@cdk-x/core';
import { Provider } from '@cdk-x/core';
import { Lazy } from '@cdk-x/core';

// ---------------------------------------------------------------------------
// A minimal provider — equivalent to what a provider package would ship.
// Uses the default JsonSynthesizer.
// ---------------------------------------------------------------------------
class SimpleProvider extends Provider {
  public readonly identifier: string;
  constructor(id = 'simple') {
    super();
    this.identifier = id;
  }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const outdir = process.env['CDKX_OUT_DIR'] ?? 'cdkx.out';

const app = new App({ outdir });

// ── Stack A ─────────────────────────────────────────────────────────────────
const stackA = new Stack(app, 'StackA', {
  provider: new SimpleProvider('provider-a'),
  stackName: 'Stack A',
});

const server = new ProviderResource(stackA, 'Server', {
  type: 'simple::Server',
  properties: { name: 'web-server', replicas: 2 },
});

// Cross-resource reference (plain object — same shape ResourceAttribute produces)
new ProviderResource(stackA, 'LoadBalancer', {
  type: 'simple::LoadBalancer',
  properties: {
    name: 'main-lb',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    target: { ref: server.logicalId, attr: 'id' } as any,
  },
});

// ── Stack B — Lazy token ─────────────────────────────────────────────────────
const stackB = new Stack(app, 'StackB', {
  provider: new SimpleProvider('provider-b'),
});

let replicaCount = 0;
new ProviderResource(stackB, 'Worker', {
  type: 'simple::Worker',
  properties: {
    name: 'background-worker',
    replicas: Lazy.any({ produce: () => replicaCount }),
  },
});

// Set the lazy value after construction (the whole point of Lazy)
replicaCount = 3;

// ── Synth ────────────────────────────────────────────────────────────────────
app.synth();
