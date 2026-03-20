import { InitCommand, InitCommandDeps } from './init.command';

describe('InitCommand — execution', () => {
  let logSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as () => never);
  });

  afterEach(() => jest.restoreAllMocks());

  it('uses process.cwd() when no directory argument is given', async () => {
    const writtenDirs: string[] = [];
    const deps: InitCommandDeps = {
      createFileSystem: () => ({
        exists: () => false,
        mkdir: (p) => writtenDirs.push(p),
        writeFile: () => undefined,
        readFile: () => '',
      }),
      detectMode: () => 'empty',
    };
    const cmd = InitCommand.create(deps);
    await cmd.parseAsync(['node', 'cdkx', '--no-install']);

    expect(exitSpy).not.toHaveBeenCalled();
    expect(writtenDirs.some((d) => d.startsWith(process.cwd()))).toBe(true);
  });

  it('passes --name to InitTemplateEngine as project name', async () => {
    const written: Record<string, string> = {};
    const deps: InitCommandDeps = {
      createFileSystem: () => ({
        exists: () => false,
        mkdir: () => undefined,
        writeFile: (p, c) => {
          written[p] = c;
        },
        readFile: () => '',
      }),
      detectMode: () => 'empty',
    };
    const cmd = InitCommand.create(deps);
    await cmd.parseAsync([
      'node',
      'cdkx',
      '--name',
      'awesome-app',
      '--no-install',
    ]);

    const pkgJson = Object.entries(written).find(([p]) =>
      p.endsWith('package.json'),
    );
    expect(pkgJson).toBeDefined();
    expect(JSON.parse(pkgJson![1]).name).toBe('awesome-app');
  });

  it('prints a ✔ Created line for each generated file', async () => {
    const deps: InitCommandDeps = {
      createFileSystem: () => ({
        exists: () => false,
        mkdir: () => undefined,
        writeFile: () => undefined,
        readFile: () => '',
      }),
      detectMode: () => 'empty',
    };
    const cmd = InitCommand.create(deps);
    await cmd.parseAsync(['node', 'cdkx', '--no-install']);

    const createdLines = (logSpy.mock.calls as string[][])
      .map((args) => args[0])
      .filter((line) => typeof line === 'string' && line.includes('Created'));
    expect(createdLines.length).toBeGreaterThanOrEqual(4);
  });

  it('prints ✔ Done message at the end', async () => {
    const deps: InitCommandDeps = {
      createFileSystem: () => ({
        exists: () => false,
        mkdir: () => undefined,
        writeFile: () => undefined,
        readFile: () => '',
      }),
      detectMode: () => 'empty',
    };
    const cmd = InitCommand.create(deps);
    await cmd.parseAsync(['node', 'cdkx', '--no-install']);

    const lastLog = (logSpy.mock.calls as string[][]).at(-1)?.[0] ?? '';
    expect(lastLog).toContain("Run 'cdkx synth' to get started");
  });

  it('uses basename(directory) as name when --name is omitted', async () => {
    const written: Record<string, string> = {};
    const deps: InitCommandDeps = {
      createFileSystem: () => ({
        exists: () => false,
        mkdir: () => undefined,
        writeFile: (p, c) => {
          written[p] = c;
        },
        readFile: () => '',
      }),
      detectMode: () => 'empty',
    };
    const cmd = InitCommand.create(deps);
    await cmd.parseAsync([
      'node',
      'cdkx',
      '/some/path/my-project',
      '--no-install',
    ]);

    const pkgJson = Object.entries(written).find(([p]) =>
      p.endsWith('package.json'),
    );
    expect(pkgJson).toBeDefined();
    expect(JSON.parse(pkgJson![1]).name).toBe('my-project');
  });
});

describe('InitCommand — metadata', () => {
  it('has name "init"', () => {
    const cmd = InitCommand.create();
    expect(cmd.name()).toBe('init');
  });

  it('has a description', () => {
    const cmd = InitCommand.create();
    expect(cmd.description()).toBeTruthy();
  });

  it('has --no-install option', () => {
    const cmd = InitCommand.create();
    const opt = cmd.options.find((o) => o.long === '--no-install');
    expect(opt).toBeDefined();
  });

  it('has --name option', () => {
    const cmd = InitCommand.create();
    const opt = cmd.options.find((o) => o.long === '--name');
    expect(opt).toBeDefined();
  });
});
