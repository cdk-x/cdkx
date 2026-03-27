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
    expect(JSON.parse((pkgJson as [string, string])[1]).name).toBe('awesome-app');
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
    expect(JSON.parse((pkgJson as [string, string])[1]).name).toBe('my-project');
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

  it('has --package-manager option', () => {
    const cmd = InitCommand.create();
    const opt = cmd.options.find((o) => o.long === '--package-manager');
    expect(opt).toBeDefined();
  });
});

describe('InitCommand — install step', () => {
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

  function makeSilentFs(): InitCommandDeps['createFileSystem'] {
    return () => ({
      exists: () => false,
      mkdir: () => undefined,
      writeFile: () => undefined,
      readFile: () => '',
    });
  }

  it('calls installPackages with the detected package manager', async () => {
    const installPackages = jest.fn();
    const cmd = InitCommand.create({
      createFileSystem: makeSilentFs(),
      detectMode: () => 'empty',
      detectPackageManager: () => 'yarn',
      installPackages,
    });
    await cmd.parseAsync(['node', 'cdkx', '--no-install=false']);
    expect(installPackages).toHaveBeenCalledWith(expect.any(String), 'yarn');
  });

  it('calls installPackages with npm when --package-manager npm is passed', async () => {
    const installPackages = jest.fn();
    const cmd = InitCommand.create({
      createFileSystem: makeSilentFs(),
      detectMode: () => 'empty',
      installPackages,
    });
    await cmd.parseAsync(['node', 'cdkx', '--package-manager', 'npm']);
    expect(installPackages).toHaveBeenCalledWith(expect.any(String), 'npm');
  });

  it('does not call installPackages when --no-install is passed', async () => {
    const installPackages = jest.fn();
    const cmd = InitCommand.create({
      createFileSystem: makeSilentFs(),
      detectMode: () => 'empty',
      installPackages,
    });
    await cmd.parseAsync(['node', 'cdkx', '--no-install']);
    expect(installPackages).not.toHaveBeenCalled();
  });

  it('exits with code 1 and prints error when installPackages throws', async () => {
    const cmd = InitCommand.create({
      createFileSystem: makeSilentFs(),
      detectMode: () => 'empty',
      detectPackageManager: () => 'yarn',
      installPackages: () => {
        throw new Error('yarn install failed with exit code 1');
      },
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('prints Running <pm> install... before calling installPackages', async () => {
    const installPackages = jest.fn();
    const cmd = InitCommand.create({
      createFileSystem: makeSilentFs(),
      detectMode: () => 'empty',
      detectPackageManager: () => 'pnpm',
      installPackages,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    const logs = (logSpy.mock.calls as string[][]).map((a) => a[0]);
    const installLog = logs.find((l) => l.includes('pnpm install'));
    expect(installLog).toBeDefined();
  });
});
