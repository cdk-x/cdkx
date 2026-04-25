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
    attrProperties: [],
    createOnlyProperties: [],
    primaryIdentifier: ['serverId'],
    required: [],
    sharedDefinitionNames: [],
    definitions: {},
    localDefinitionNames: [],
    filePath: '/fake/server.schema.json',
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
});
