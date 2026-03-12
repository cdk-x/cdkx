import type {
  AssemblyStack,
  DeploymentPlan,
  DeploymentResult,
} from '@cdkx-io/engine';
import { DeployLock } from '@cdkx-io/engine';
import { DestroyCommand, type DestroyCommandDeps } from './destroy.command.js';
import { AdapterRegistry } from '../../lib/adapter-registry/index.js';

// Mock adapter registry with 'test' provider
function makeRegistry(): AdapterRegistry {
  return new AdapterRegistry().register({
    providerId: 'test',
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

describe('DestroyCommand', () => {
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as () => never);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    consoleLogSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('metadata', () => {
    it('has the correct command name', () => {
      const cmd = DestroyCommand.create();
      expect(cmd.name()).toBe('destroy');
    });

    it('has a description', () => {
      const cmd = DestroyCommand.create();
      expect(cmd.description()).toContain('Destroy all resources');
    });

    it('has a --config option with default "cdkx.json"', () => {
      const cmd = DestroyCommand.create();
      const configOption = cmd.options.find((opt) => opt.long === '--config');
      expect(configOption).toBeDefined();
      expect(configOption?.defaultValue).toBe('cdkx.json');
    });

    it('has an --output option', () => {
      const cmd = DestroyCommand.create();
      const outputOption = cmd.options.find((opt) => opt.long === '--output');
      expect(outputOption).toBeDefined();
    });

    it('has a --force option', () => {
      const cmd = DestroyCommand.create();
      const forceOption = cmd.options.find((opt) => opt.long === '--force');
      expect(forceOption).toBeDefined();
    });
  });

  describe('happy path', () => {
    it('prints success message after successful destroy', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const mockStacks: AssemblyStack[] = [
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [
            {
              logicalId: 'Res1',
              type: 'test::Resource',
              properties: { name: 'res1' },
            },
          ],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [['Res1']] },
      };

      const mockResult: DeploymentResult = {
        success: true,
        stacks: [
          {
            stackId: 'TestStack',
            success: true,
            resources: [{ logicalId: 'Res1', success: true }],
          },
        ],
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js', output: 'cdkx.out' }),
        readAssembly: () => mockStacks,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: jest.fn().mockResolvedValue(mockResult),
            subscribe: jest.fn(),
          }) as any,
        createLock: () =>
          ({
            acquire: jest.fn(),
            release: jest.fn(),
          }) as any,
        promptUser: jest.fn().mockResolvedValue(true),
        registry: makeRegistry(),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('All resources destroyed'),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('config file not found', () => {
    it('exits 1 with an error message', async () => {
      const deps: DestroyCommandDeps = {
        existsSync: () => false,
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Config file not found'),
      );
    });
  });

  describe('missing app field', () => {
    it('exits 1 with an error message', async () => {
      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ output: 'cdkx.out' }) as any,
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("'app' field is required"),
      );
    });
  });

  describe('readAssembly throws', () => {
    it('exits 1 with the error', async () => {
      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => {
          throw new Error('manifest.json not found');
        },
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('manifest.json not found'),
      );
    });
  });

  describe('no stacks in assembly', () => {
    it('exits 1 with an error message', async () => {
      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => [],
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('No stacks found'),
      );
    });
  });

  describe('planDeployment throws', () => {
    it('exits 1 with the cycle error', async () => {
      const mockStacks: AssemblyStack[] = [
        {
          id: 'StackA',
          provider: 'test',
          environment: {},
          templateFile: 'StackA.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => mockStacks,
        planDeployment: () => {
          throw new Error('Cycle detected');
        },
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cycle detected'),
      );
    });
  });

  describe('registry.build throws', () => {
    it('exits 1 with the error', async () => {
      const mockStacks: AssemblyStack[] = [
        {
          id: 'HetznerStack',
          provider: 'hetzner',
          environment: {},
          templateFile: 'HetznerStack.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const mockPlan: DeploymentPlan = {
        stackWaves: [['HetznerStack']],
        resourceWaves: { HetznerStack: [] },
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => mockStacks,
        planDeployment: () => mockPlan,
        registry: {
          build: () => {
            throw new Error('HETZNER_API_TOKEN not found');
          },
        } as any,
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('HETZNER_API_TOKEN not found'),
      );
    });
  });

  describe('engine.destroy returns success: false', () => {
    it('exits 1', async () => {
      const mockStacks: AssemblyStack[] = [
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [
            {
              logicalId: 'Res1',
              type: 'test::Resource',
              properties: {},
            },
          ],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [['Res1']] },
      };

      const mockResult: DeploymentResult = {
        success: false,
        stacks: [
          {
            stackId: 'TestStack',
            success: false,
            resources: [
              {
                logicalId: 'Res1',
                success: false,
                error: 'Resource not found',
              },
            ],
            error: 'Stack destroy failed',
          },
        ],
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => mockStacks,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: jest.fn().mockResolvedValue(mockResult),
            subscribe: jest.fn(),
          }) as any,
        createLock: () =>
          ({
            acquire: jest.fn(),
            release: jest.fn(),
          }) as any,
        promptUser: jest.fn().mockResolvedValue(true),
        registry: makeRegistry(),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Destroy failed'),
      );
    });
  });

  describe('events are streamed to stdout', () => {
    it('subscribes to the engine event bus', async () => {
      const mockSubscribe = jest.fn();

      const mockStacks: AssemblyStack[] = [
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [] },
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => mockStacks,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
            subscribe: mockSubscribe,
          }) as any,
        createLock: () =>
          ({
            acquire: jest.fn(),
            release: jest.fn(),
          }) as any,
        promptUser: jest.fn().mockResolvedValue(true),
        registry: makeRegistry(),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('--output flag', () => {
    it('is passed to readAssembly', async () => {
      const mockReadAssembly = jest.fn().mockReturnValue([
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ]);

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [] },
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: mockReadAssembly,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
            subscribe: jest.fn(),
          }) as any,
        createLock: () =>
          ({
            acquire: jest.fn(),
            release: jest.fn(),
          }) as any,
        promptUser: jest.fn().mockResolvedValue(true),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx', '--output', 'my-outdir']);

      expect(mockReadAssembly).toHaveBeenCalledWith(
        expect.stringContaining('my-outdir'),
      );
    });
  });

  describe('config.output is used when --output not set', () => {
    it('passes config.output to readAssembly', async () => {
      const mockReadAssembly = jest.fn().mockReturnValue([
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ]);

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [] },
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js', output: 'config-outdir' }),
        readAssembly: mockReadAssembly,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
            subscribe: jest.fn(),
          }) as any,
        createLock: () =>
          ({
            acquire: jest.fn(),
            release: jest.fn(),
          }) as any,
        promptUser: jest.fn().mockResolvedValue(true),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(mockReadAssembly).toHaveBeenCalledWith(
        expect.stringContaining('config-outdir'),
      );
    });
  });

  describe('stateDir ends with .cdkx', () => {
    it('passes stateDir to createLock', async () => {
      const mockCreateLock = jest.fn().mockReturnValue({
        acquire: jest.fn(),
        release: jest.fn(),
      });

      const mockStacks: AssemblyStack[] = [
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [] },
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => mockStacks,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: jest.fn().mockResolvedValue({ success: true, stacks: [] }),
            subscribe: jest.fn(),
          }) as any,
        createLock: mockCreateLock,
        promptUser: jest.fn().mockResolvedValue(true),
        registry: makeRegistry(),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx', '--config', '/project/cdkx.json']);

      expect(mockCreateLock).toHaveBeenCalledWith(
        expect.stringMatching(/\.cdkx$/),
      );
    });
  });

  // Note: "stateDir and assemblyDir passed to createEngine" test is redundant
  // with deploy.command.spec.ts - same behavior is tested there.

  describe('lock is released even when destroy fails', () => {
    it('releases the lock in the finally block', async () => {
      const released: boolean[] = [];
      const lock = makeNullLock();
      const originalRelease = lock.release.bind(lock);
      lock.release = () => {
        released.push(true);
        originalRelease();
      };

      const mockStacks: AssemblyStack[] = [
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [] },
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => mockStacks,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: jest
              .fn()
              .mockResolvedValue({ success: false, stacks: [] }),
            subscribe: jest.fn(),
          }) as any,
        createLock: () => lock,
        promptUser: jest.fn().mockResolvedValue(true),
        registry: makeRegistry(),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(released).toHaveLength(1);
    });
  });

  describe('LockError from acquire', () => {
    it('exits 1 with the lock error message', async () => {
      const lockError = new Error(
        'Deploy already in progress (pid 12345 on hostname)',
      );
      lockError.name = 'LockError';

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => [
          {
            id: 'TestStack',
            provider: 'test',
            environment: {},
            templateFile: 'TestStack.json',
            resources: [],
            outputs: {},
            outputKeys: [],
            dependencies: [],
          },
        ],
        planDeployment: () =>
          ({
            stackWaves: [['TestStack']],
            resourceWaves: { TestStack: [] },
          }) as any,
        createLock: () =>
          ({
            acquire: () => {
              throw lockError;
            },
            release: jest.fn(),
          }) as any,
        promptUser: jest.fn().mockResolvedValue(true),
        registry: makeRegistry(),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Deploy already in progress'),
      );
    });
  });

  describe('user confirmation', () => {
    it('exits without destroying when user declines', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockDestroy = jest.fn();

      const mockStacks: AssemblyStack[] = [
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [] },
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => mockStacks,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: mockDestroy,
            subscribe: jest.fn(),
          }) as any,
        createLock: () =>
          ({
            acquire: jest.fn(),
            release: jest.fn(),
          }) as any,
        promptUser: jest.fn().mockResolvedValue(false),
        registry: makeRegistry(),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx']);

      expect(mockDestroy).not.toHaveBeenCalled();
      // Check that 'Destroy cancelled.' was printed (warning prints first)
      const allCalls = consoleSpy.mock.calls.map((call) => call[0]);
      expect(
        allCalls.some((msg) => msg?.includes?.('Destroy cancelled.')),
      ).toBe(true);
      expect(exitSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('skips confirmation prompt with --force flag', async () => {
      const mockPrompt = jest.fn();
      const mockDestroy = jest
        .fn()
        .mockResolvedValue({ success: true, stacks: [] });

      const mockStacks: AssemblyStack[] = [
        {
          id: 'TestStack',
          provider: 'test',
          environment: {},
          templateFile: 'TestStack.json',
          resources: [],
          outputs: {},
          outputKeys: [],
          dependencies: [],
        },
      ];

      const mockPlan: DeploymentPlan = {
        stackWaves: [['TestStack']],
        resourceWaves: { TestStack: [] },
      };

      const deps: DestroyCommandDeps = {
        existsSync: () => true,
        readConfig: () => ({ app: 'node app.js' }),
        readAssembly: () => mockStacks,
        planDeployment: () => mockPlan,
        createEngine: () =>
          ({
            destroy: mockDestroy,
            subscribe: jest.fn(),
          }) as any,
        createLock: () =>
          ({
            acquire: jest.fn(),
            release: jest.fn(),
          }) as any,
        promptUser: mockPrompt,
        registry: makeRegistry(),
      };

      const cmd = DestroyCommand.create(deps);
      await cmd.parseAsync(['node', 'cdkx', '--force']);

      expect(mockPrompt).not.toHaveBeenCalled();
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});
