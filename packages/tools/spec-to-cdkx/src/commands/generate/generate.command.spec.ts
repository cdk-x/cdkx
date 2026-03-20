import type { ResourceSchema } from '../../lib/schema-reader.js';
import { GenerateCommand } from './generate.command.js';

// Minimal stub resource schemas for testing
const STUB_RESOURCES: ResourceSchema[] = [
  {
    typeName: 'Test::Compute::Server',
    domain: 'Compute',
    resourceName: 'Server',
    description: 'A server.',
    properties: {
      name: { type: 'string', description: 'Name.' },
    },
    readOnlyProperties: ['serverId'],
    createOnlyProperties: [],
    primaryIdentifier: ['serverId'],
    required: [],
    sharedDefinitionNames: [],
    definitions: {},
    localDefinitionNames: [],
    filePath: '/fake/server.schema.json',
    api: {
      createPath: '/servers',
      getPath: '/servers/{id}',
      updatePath: '/servers/{id}',
      deletePath: '/servers/{id}',
      responseBodyKey: 'server',
    },
  },
];

describe('GenerateCommand', () => {
  let exitSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as () => never);
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('command metadata', () => {
    it('has name "generate"', () => {
      const cmd = GenerateCommand.create();
      expect(cmd.name()).toBe('generate');
    });

    it('has --prefix, --provider-name, --resource-type-const as required options', () => {
      const cmd = GenerateCommand.create();
      const optionNames = cmd.options.map(
        (o: { long?: string }) => o.long ?? '',
      );
      expect(optionNames).toContain('--prefix');
      expect(optionNames).toContain('--provider-name');
      expect(optionNames).toContain('--resource-type-const');
    });

    it('has --schemas option with default "schemas/v1"', () => {
      const cmd = GenerateCommand.create();
      const schemasOpt = cmd.options.find(
        (o: { long?: string }) => o.long === '--schemas',
      );
      expect(schemasOpt?.defaultValue).toBe('schemas/v1');
    });

    it('has --output option with default "src/lib/generated/resources.generated.ts"', () => {
      const cmd = GenerateCommand.create();
      const outputOpt = cmd.options.find(
        (o: { long?: string }) => o.long === '--output',
      );
      expect(outputOpt?.defaultValue).toBe(
        'src/lib/generated/resources.generated.ts',
      );
    });

    it('has --registry-output option with no default', () => {
      const cmd = GenerateCommand.create();
      const registryOpt = cmd.options.find(
        (o: { long?: string }) => o.long === '--registry-output',
      );
      expect(registryOpt).toBeDefined();
      expect(registryOpt?.defaultValue).toBeUndefined();
    });
  });

  describe('happy path', () => {
    it('calls readSchemas, generateCode, writeFile and logs success', async () => {
      const readSchemas = jest.fn().mockReturnValue(STUB_RESOURCES);
      const generateCode = jest.fn().mockReturnValue('// generated');
      const writeFile = jest.fn();
      const log = jest.fn();

      const cmd = GenerateCommand.create({
        existsSync: () => true,
        readSchemas,
        generateCode,
        writeFile,
        log,
      });

      await cmd.parseAsync([
        'node',
        'spec-to-cdkx',
        '--prefix',
        'Tst',
        '--provider-name',
        'Test',
        '--resource-type-const',
        'TestResourceType',
      ]);

      expect(readSchemas).toHaveBeenCalledTimes(1);
      expect(generateCode).toHaveBeenCalledWith(STUB_RESOURCES, {
        prefix: 'Tst',
        providerName: 'Test',
        resourceTypeConst: 'TestResourceType',
      });
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('resources.generated.ts'),
        '// generated',
      );
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('Generated 1 resources'),
      );
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('uses --output to override the output file path', async () => {
      const writeFile = jest.fn();
      const cmd = GenerateCommand.create({
        existsSync: () => true,
        readSchemas: jest.fn().mockReturnValue(STUB_RESOURCES),
        generateCode: jest.fn().mockReturnValue('// generated'),
        writeFile,
        log: jest.fn(),
      });

      await cmd.parseAsync([
        'node',
        'spec-to-cdkx',
        '--prefix',
        'Tst',
        '--provider-name',
        'Test',
        '--resource-type-const',
        'TestResourceType',
        '--output',
        '/custom/path/out.ts',
      ]);

      expect(writeFile).toHaveBeenCalledWith(
        '/custom/path/out.ts',
        expect.any(String),
      );
    });
  });

  describe('error cases', () => {
    it('exits 1 when schemas directory does not exist', async () => {
      const cmd = GenerateCommand.create({
        existsSync: () => false,
      });

      await cmd.parseAsync([
        'node',
        'spec-to-cdkx',
        '--prefix',
        'Tst',
        '--provider-name',
        'Test',
        '--resource-type-const',
        'TestResourceType',
      ]);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Schemas directory not found'),
      );
    });

    it('exits 1 when no resources are found', async () => {
      const cmd = GenerateCommand.create({
        existsSync: () => true,
        readSchemas: jest.fn().mockReturnValue([]),
      });

      await cmd.parseAsync([
        'node',
        'spec-to-cdkx',
        '--prefix',
        'Tst',
        '--provider-name',
        'Test',
        '--resource-type-const',
        'TestResourceType',
      ]);

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('No resource schemas found'),
      );
    });
  });

  describe('--registry-output', () => {
    const BASE_ARGS = [
      'node',
      'spec-to-cdkx',
      '--prefix',
      'Tst',
      '--provider-name',
      'Test',
      '--resource-type-const',
      'TestResourceType',
    ];

    it('calls generateRegistry and writes registry file when --registry-output is given', async () => {
      const writeFile = jest.fn();
      const generateRegistry = jest.fn().mockReturnValue('// registry');
      const log = jest.fn();

      const cmd = GenerateCommand.create({
        existsSync: () => true,
        readSchemas: jest.fn().mockReturnValue(STUB_RESOURCES),
        generateCode: jest.fn().mockReturnValue('// generated'),
        generateRegistry,
        writeFile,
        log,
      });

      await cmd.parseAsync([
        ...BASE_ARGS,
        '--registry-output',
        '/custom/registry.generated.ts',
      ]);

      expect(generateRegistry).toHaveBeenCalledWith(STUB_RESOURCES, {
        resourceTypeConst: 'TestResourceType',
      });
      expect(writeFile).toHaveBeenCalledWith(
        '/custom/registry.generated.ts',
        '// registry',
      );
      expect(log).toHaveBeenCalledWith(
        expect.stringContaining('Generated registry'),
      );
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('logs registry entry count when --registry-output is given', async () => {
      const log = jest.fn();

      const cmd = GenerateCommand.create({
        existsSync: () => true,
        readSchemas: jest.fn().mockReturnValue(STUB_RESOURCES),
        generateCode: jest.fn().mockReturnValue('// generated'),
        generateRegistry: jest.fn().mockReturnValue('// registry'),
        writeFile: jest.fn(),
        log,
      });

      await cmd.parseAsync([
        ...BASE_ARGS,
        '--registry-output',
        '/out/registry.generated.ts',
      ]);

      // STUB_RESOURCES has 1 resource with api defined → count = 1
      expect(log).toHaveBeenCalledWith(expect.stringContaining('1 entries'));
    });

    it('does NOT call generateRegistry when --registry-output is omitted', async () => {
      const generateRegistry = jest.fn().mockReturnValue('// registry');

      const cmd = GenerateCommand.create({
        existsSync: () => true,
        readSchemas: jest.fn().mockReturnValue(STUB_RESOURCES),
        generateCode: jest.fn().mockReturnValue('// generated'),
        generateRegistry,
        writeFile: jest.fn(),
        log: jest.fn(),
      });

      await cmd.parseAsync(BASE_ARGS);

      expect(generateRegistry).not.toHaveBeenCalled();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('writes registry file at path resolved from cwd when --registry-output is relative', async () => {
      const writeFile = jest.fn();

      const cmd = GenerateCommand.create({
        existsSync: () => true,
        readSchemas: jest.fn().mockReturnValue(STUB_RESOURCES),
        generateCode: jest.fn().mockReturnValue('// generated'),
        generateRegistry: jest.fn().mockReturnValue('// registry'),
        writeFile,
        log: jest.fn(),
      });

      await cmd.parseAsync([
        ...BASE_ARGS,
        '--registry-output',
        'src/lib/adapter/resource-registry.generated.ts',
      ]);

      const [calledPath] = writeFile.mock.calls[1] as [string, string];
      expect(calledPath).toContain('resource-registry.generated.ts');
      expect(calledPath).toMatch(/^[/]/); // absolute path
    });
  });
});
