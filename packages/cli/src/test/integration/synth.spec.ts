/**
 * Integration tests for `cdkx synth`.
 *
 * Each test:
 *  1. Creates a fresh tmpDir (isolated — no cross-test pollution).
 *  2. Compiles the simple-app fixture to a .js via CliHelpers.buildFixture().
 *  3. Writes a cdkx.json pointing to that .js.
 *  4. Invokes the real CLI bundle (node dist/main.js synth).
 *  5. Asserts on exit code and output files on disk.
 *
 * The CLI bundle must be built before running these tests.
 * `nx test @cdk-x/cli` has `dependsOn: ["build"]` for this reason.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CliHelpers } from '../helpers/index.js';

// Integration tests compile + spawn — give them breathing room.
jest.setTimeout(30_000);

// ---------------------------------------------------------------------------
// Helpers shared across suites
// ---------------------------------------------------------------------------

/** Compile the fixture once per file — reused across all tests. */
let fixtureJs: string;
let fixtureDir: string;

beforeAll(() => {
  fixtureDir = CliHelpers.tmpDir();
  fixtureJs = CliHelpers.buildFixture(fixtureDir);
});

afterAll(() => {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// 1. Happy path — generates all expected files
// ---------------------------------------------------------------------------
describe('cdkx synth — happy path', () => {
  let outDir: string;
  let projectDir: string;

  beforeAll(() => {
    projectDir = CliHelpers.tmpDir();
    outDir = path.join(projectDir, 'cdkx.out');
    CliHelpers.writeConfig(projectDir, {
      app: `node ${fixtureJs}`,
      output: outDir,
    });
  });

  afterAll(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it('exits with code 0', () => {
    const result = CliHelpers.runCli(['synth'], projectDir);
    expect(result.exitCode).toBe(0);
  });

  it('prints success message to stdout', () => {
    const result = CliHelpers.runCli(['synth'], projectDir);
    expect(result.stdout).toContain('Synthesis complete');
  });

  it('creates StackA.json', () => {
    expect(fs.existsSync(path.join(outDir, 'StackA.json'))).toBe(true);
  });

  it('creates StackB.json', () => {
    expect(fs.existsSync(path.join(outDir, 'StackB.json'))).toBe(true);
  });

  it('creates manifest.json', () => {
    expect(fs.existsSync(path.join(outDir, 'manifest.json'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Manifest content
// ---------------------------------------------------------------------------
describe('cdkx synth — manifest.json content', () => {
  let outDir: string;
  let projectDir: string;

  beforeAll(() => {
    projectDir = CliHelpers.tmpDir();
    outDir = path.join(projectDir, 'cdkx.out');
    CliHelpers.writeConfig(projectDir, {
      app: `node ${fixtureJs}`,
      output: outDir,
    });
    CliHelpers.runCli(['synth'], projectDir);
  });

  afterAll(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it('has version "1.0.0"', () => {
    const manifest = CliHelpers.readJson(
      path.join(outDir, 'manifest.json'),
    ) as { version: string };
    expect(manifest.version).toBe('1.0.0');
  });

  it('lists StackA and StackB in artifacts', () => {
    const manifest = CliHelpers.readJson(
      path.join(outDir, 'manifest.json'),
    ) as { artifacts: Record<string, unknown> };
    expect(Object.keys(manifest.artifacts).sort()).toEqual([
      'StackA',
      'StackB',
    ]);
  });

  it('StackA has provider "provider-a" and displayName "Stack A"', () => {
    const manifest = CliHelpers.readJson(
      path.join(outDir, 'manifest.json'),
    ) as {
      artifacts: Record<
        string,
        {
          provider: string;
          displayName: string;
          properties: { templateFile: string };
        }
      >;
    };
    expect(manifest.artifacts['StackA'].provider).toBe('provider-a');
    expect(manifest.artifacts['StackA'].displayName).toBe('Stack A');
    expect(manifest.artifacts['StackA'].properties.templateFile).toBe(
      'StackA.json',
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Stack content
// ---------------------------------------------------------------------------
describe('cdkx synth — stack JSON content', () => {
  type ResourceEntry = {
    type: string;
    properties: Record<string, unknown>;
    metadata: Record<string, unknown>;
  };

  let outDir: string;
  let projectDir: string;
  let stackA: Record<string, ResourceEntry>;
  let stackB: Record<string, ResourceEntry>;

  beforeAll(() => {
    projectDir = CliHelpers.tmpDir();
    outDir = path.join(projectDir, 'cdkx.out');
    CliHelpers.writeConfig(projectDir, {
      app: `node ${fixtureJs}`,
      output: outDir,
    });
    CliHelpers.runCli(['synth'], projectDir);
    stackA = CliHelpers.readJson(path.join(outDir, 'StackA.json')) as Record<
      string,
      ResourceEntry
    >;
    stackB = CliHelpers.readJson(path.join(outDir, 'StackB.json')) as Record<
      string,
      ResourceEntry
    >;
  });

  afterAll(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it('StackA contains a simple::Server resource', () => {
    const server = Object.values(stackA).find(
      (r) => r.type === 'simple::Server',
    );
    expect(server).toBeDefined();
    expect(server?.properties['name']).toBe('web-server');
    expect(server?.properties['replicas']).toBe(2);
  });

  it('StackA LoadBalancer has a cross-resource reference to Server', () => {
    const serverEntry = Object.values(stackA).find(
      (r) => r.type === 'simple::Server',
    );
    const serverLogicalId = Object.keys(stackA).find(
      (k) => stackA[k].type === 'simple::Server',
    );
    const lb = Object.values(stackA).find(
      (r) => r.type === 'simple::LoadBalancer',
    );

    expect(lb).toBeDefined();
    expect(lb?.properties['target']).toEqual({
      ref: serverLogicalId,
      attr: 'id',
    });
    expect(serverEntry).toBeDefined();
  });

  it('StackB Worker has Lazy-resolved replicas = 3', () => {
    const worker = Object.values(stackB).find(
      (r) => r.type === 'simple::Worker',
    );
    expect(worker).toBeDefined();
    expect(worker?.properties['replicas']).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 4. --output flag overrides config output
// ---------------------------------------------------------------------------
describe('cdkx synth — --output flag', () => {
  let projectDir: string;
  let customOut: string;

  beforeAll(() => {
    projectDir = CliHelpers.tmpDir();
    customOut = path.join(projectDir, 'custom-out');
    // config has no output field — CLI default would be 'cdkx.out'
    CliHelpers.writeConfig(projectDir, { app: `node ${fixtureJs}` });
    CliHelpers.runCli(['synth', '--output', customOut], projectDir);
  });

  afterAll(() => {
    fs.rmSync(projectDir, { recursive: true, force: true });
  });

  it('writes files to the --output directory', () => {
    expect(fs.existsSync(path.join(customOut, 'manifest.json'))).toBe(true);
  });

  it('does not write to the default cdkx.out directory', () => {
    expect(fs.existsSync(path.join(projectDir, 'cdkx.out'))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 5. Error cases
// ---------------------------------------------------------------------------
describe('cdkx synth — error cases', () => {
  it('exits with code 1 when cdkx.json is missing', () => {
    const dir = CliHelpers.tmpDir();
    try {
      const result = CliHelpers.runCli(['synth'], dir);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('cdkx.json not found');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits with code 1 when the app command fails', () => {
    const dir = CliHelpers.tmpDir();
    try {
      CliHelpers.writeConfig(dir, { app: 'node --nonexistent-flag' });
      const result = CliHelpers.runCli(['synth'], dir);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('App exited with code');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('exits with code 1 when cdkx.json has no "app" field', () => {
    const dir = CliHelpers.tmpDir();
    try {
      fs.writeFileSync(
        path.join(dir, 'cdkx.json'),
        JSON.stringify({ output: 'out' }),
      );
      const result = CliHelpers.runCli(['synth'], dir);
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("'app' field is required");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
