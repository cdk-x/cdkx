import { DeployCommand } from './deploy.command.js';
import type {
  AssemblyStack,
  DeploymentPlan,
  DeploymentEngineOptions,
} from '@cdkx-io/engine';
import { AdapterRegistry } from '../../lib/adapter-registry/index.js';
import { DeployLock } from '../../lib/deploy-lock/index.js';

// ─── Minimal stubs ────────────────────────────────────────────────────────────

function makeStack(provider = 'hetzner'): AssemblyStack {
  return {
    id: 'TestStack',
    provider,
    environment: {},
    templateFile: 'TestStack.json',
    resources: [],
    outputs: {},
    outputKeys: [],
    dependencies: [],
  };
}

function makePlan(stackId = 'TestStack'): DeploymentPlan {
  return { stackWaves: [[stackId]], resourceWaves: { [stackId]: [] } };
}

function makeRegistry(): AdapterRegistry {
  return new AdapterRegistry().register({
    providerId: 'hetzner',
    create: () => ({
      create: jest.fn().mockResolvedValue({ physicalId: '1' }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue(undefined),
      getOutput: jest.fn().mockResolvedValue(undefined),
    }),
  });
}

/** Returns a no-op DeployLock stub. */
function makeNullLock(): DeployLock {
  return new DeployLock('/fake/.cdkx', {
    mkdirSync: () => undefined,
    writeFileSync: () => undefined,
    readFileSync: () => {
      throw new Error('not found');
    },
    unlinkSync: () => undefined,
    existsSync: () => false,
    isProcessAlive: () => false,
    getPid: () => 1,
    getHostname: () => 'test',
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('DeployCommand — metadata', () => {
  it('has name "deploy"', () => {
    const cmd = DeployCommand.create();
    expect(cmd.name()).toBe('deploy');
  });

  it('has a description', () => {
    const cmd = DeployCommand.create();
    expect(cmd.description()).toBeTruthy();
  });

  it('has --config option with default "cdkx.json"', () => {
    const cmd = DeployCommand.create();
    const opt = cmd.options.find((o) => o.long === '--config');
    expect(opt).toBeDefined();
    expect(opt?.defaultValue).toBe('cdkx.json');
  });

  it('has --output option with no default', () => {
    const cmd = DeployCommand.create();
    const opt = cmd.options.find((o) => o.long === '--output');
    expect(opt).toBeDefined();
    expect(opt?.defaultValue).toBeUndefined();
  });
});

describe('DeployCommand — execution', () => {
  let exitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as () => never);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exits with code 1 when cdkx.json does not exist', async () => {
    const cmd = DeployCommand.create({ existsSync: () => false });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when config has no "app" field', async () => {
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({}) as never,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when readAssembly throws', async () => {
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => {
        throw new Error('manifest not found');
      },
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when no stacks are found in the assembly', async () => {
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [],
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when planDeployment throws (cycle)', async () => {
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => {
        throw new Error('cycle detected');
      },
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when registry.build throws (missing token)', async () => {
    const registry = new AdapterRegistry(); // no factories registered
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry,
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when engine.deploy returns success: false', async () => {
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: (opts: DeploymentEngineOptions) =>
        ({
          subscribe: (
            opts as unknown as {
              eventBus: { subscribe: (h: unknown) => () => void };
            }
          ).eventBus
            ? jest.fn()
            : jest.fn(),
          deploy: jest.fn().mockResolvedValue({ success: false, stacks: [] }),
        }) as never,
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('prints success message when engine.deploy returns success: true', async () => {
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: () =>
        ({
          subscribe: jest.fn(),
          deploy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
        }) as never,
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Deployment complete'),
    );
  });

  it('streams events to stdout via engine.subscribe', async () => {
    let capturedHandler: ((event: unknown) => void) | undefined;
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: () =>
        ({
          subscribe: (handler: (event: unknown) => void) => {
            capturedHandler = handler;
            return () => undefined;
          },
          deploy: jest.fn().mockImplementation(async () => {
            // Emit a fake event during deploy
            capturedHandler?.({
              timestamp: new Date('2026-01-01T00:00:00.000Z'),
              stackId: 'TestStack',
              logicalResourceId: 'ResA',
              resourceType: 'test::Resource',
              resourceStatus: 'CREATE_COMPLETE',
            });
            return { success: true, stacks: [] };
          }),
        }) as never,
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('CREATE_COMPLETE'),
    );
  });

  it('passes the correct outdir to readAssembly when --output is set', async () => {
    const readAssembly = jest.fn().mockReturnValue([makeStack()]);
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly,
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: () =>
        ({
          subscribe: jest.fn(),
          deploy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
        }) as never,
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx', '--output', 'custom-out']);
    expect(readAssembly).toHaveBeenCalledWith(
      expect.stringContaining('custom-out'),
    );
  });

  it('uses config.output when --output flag is not set', async () => {
    const readAssembly = jest.fn().mockReturnValue([makeStack()]);
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js', output: 'config-out' }),
      readAssembly,
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: () =>
        ({
          subscribe: jest.fn(),
          deploy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
        }) as never,
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(readAssembly).toHaveBeenCalledWith(
      expect.stringContaining('config-out'),
    );
  });

  it('passes stateDir = <configDir>/.cdkx to createLock', async () => {
    const lockDirs: string[] = [];
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: () =>
        ({
          subscribe: jest.fn(),
          deploy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
        }) as never,
      createLock: (stateDir: string) => {
        lockDirs.push(stateDir);
        return makeNullLock();
      },
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(lockDirs).toHaveLength(1);
    expect(lockDirs[0]).toMatch(/\.cdkx$/);
  });

  it('passes stateDir to createEngine', async () => {
    const engineOpts: DeploymentEngineOptions[] = [];
    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: (opts: DeploymentEngineOptions) => {
        engineOpts.push(opts);
        return {
          subscribe: jest.fn(),
          deploy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
        } as never;
      },
      createLock: () => makeNullLock(),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(engineOpts).toHaveLength(1);
    expect(engineOpts[0].stateDir).toMatch(/\.cdkx$/);
    expect(engineOpts[0].assemblyDir).toMatch(/cdkx\.out$/);
  });

  it('releases the lock even when deploy fails', async () => {
    const released: boolean[] = [];
    const lock = makeNullLock();
    const originalRelease = lock.release.bind(lock);
    lock.release = () => {
      released.push(true);
      originalRelease();
    };

    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: () =>
        ({
          subscribe: jest.fn(),
          deploy: jest.fn().mockResolvedValue({ success: false, stacks: [] }),
        }) as never,
      createLock: () => lock,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(released).toHaveLength(1);
  });

  it('exits with code 1 when acquire() throws LockError', async () => {
    const { LockError } = await import('../../lib/deploy-lock/index.js');
    const lockData = {
      pid: 9999,
      startedAt: '2026-01-01T00:00:00.000Z',
      hostname: 'prod',
    };
    const lock = makeNullLock();
    lock.acquire = () => {
      throw new LockError('/fake/.cdkx/deploy.lock', lockData);
    };

    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createLock: () => lock,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('DeployCommand — no-op message', () => {
  let exitSpy: jest.SpyInstance;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as () => never);
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prints no-changes message when the only stack emits NO_CHANGES', async () => {
    let capturedHandler: ((event: unknown) => void) | undefined;

    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: () =>
        ({
          subscribe: (handler: (event: unknown) => void) => {
            capturedHandler = handler;
            return () => undefined;
          },
          deploy: jest.fn().mockImplementation(async () => {
            capturedHandler?.({
              timestamp: new Date(),
              stackId: 'TestStack',
              logicalResourceId: 'TestStack',
              resourceType: 'cdkx::stack',
              resourceStatus: 'NO_CHANGES',
            });
            return { success: true, stacks: [] };
          }),
        }) as never,
      createLock: () => makeNullLock(),
    });

    await cmd.parseAsync(['node', 'cdkx']);

    expect(exitSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('No changes — all stacks are up-to-date'),
    );
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Deployment complete'),
    );
  });

  it('prints Deployment complete when the stack emits UPDATE_COMPLETE', async () => {
    let capturedHandler: ((event: unknown) => void) | undefined;

    const cmd = DeployCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      readAssembly: () => [makeStack()],
      planDeployment: () => makePlan(),
      registry: makeRegistry(),
      createEngine: () =>
        ({
          subscribe: (handler: (event: unknown) => void) => {
            capturedHandler = handler;
            return () => undefined;
          },
          deploy: jest.fn().mockImplementation(async () => {
            capturedHandler?.({
              timestamp: new Date(),
              stackId: 'TestStack',
              logicalResourceId: 'TestStack',
              resourceType: 'cdkx::stack',
              resourceStatus: 'UPDATE_COMPLETE',
            });
            return { success: true, stacks: [] };
          }),
        }) as never,
      createLock: () => makeNullLock(),
    });

    await cmd.parseAsync(['node', 'cdkx']);

    expect(exitSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Deployment complete'),
    );
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('No changes'),
    );
  });
});
