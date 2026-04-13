import { ProjectCommand } from './project.command.js';

describe('ProjectCommand — metadata', () => {
  it('has name "project"', () => {
    const cmd = ProjectCommand.create();
    expect(cmd.name()).toBe('project');
  });

  it('has a description', () => {
    const cmd = ProjectCommand.create();
    expect(cmd.description()).toBeTruthy();
  });

  it('has --app option with no default', () => {
    const cmd = ProjectCommand.create();
    const opt = cmd.options.find((o) => o.long === '--app');
    expect(opt).toBeDefined();
    expect(opt?.defaultValue).toBeUndefined();
  });

  it('does not have a --config option', () => {
    const cmd = ProjectCommand.create();
    const opt = cmd.options.find((o) => o.long === '--config');
    expect(opt).toBeUndefined();
  });

  it('does not have an --output option', () => {
    const cmd = ProjectCommand.create();
    const opt = cmd.options.find((o) => o.long === '--output');
    expect(opt).toBeUndefined();
  });
});

describe('ProjectCommand — execution', () => {
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

  it('exits with code 1 when .cdkxrc.ts does not exist (no --app flag)', async () => {
    const cmd = ProjectCommand.create({
      existsSync: () => false,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when the spawned process fails', async () => {
    const cmd = ProjectCommand.create({
      existsSync: () => true,
      spawnApp: () => ({ status: 1, stderr: 'something failed', stdout: '' }),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('prints success when the process exits with code 0', async () => {
    const cmd = ProjectCommand.create({
      existsSync: () => true,
      spawnApp: () => ({ status: 0, stderr: '', stdout: '' }),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Project files written'),
    );
  });

  it('defaults to .cdkxrc.ts in cwd when no --app flag is given', async () => {
    const spawnApp = jest
      .fn()
      .mockReturnValue({ status: 0, stderr: '', stdout: '' });
    const cmd = ProjectCommand.create({
      existsSync: () => true,
      spawnApp,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(spawnApp).toHaveBeenCalledWith(
      expect.stringContaining('.cdkxrc.ts'),
      expect.any(Object),
      expect.any(String),
    );
  });

  it('uses --app path when provided', async () => {
    const spawnApp = jest
      .fn()
      .mockReturnValue({ status: 0, stderr: '', stdout: '' });
    const cmd = ProjectCommand.create({
      existsSync: () => true,
      spawnApp,
    });
    await cmd.parseAsync(['node', 'cdkx', '--app', 'infra/my-config.ts']);
    expect(spawnApp).toHaveBeenCalledWith(
      expect.stringContaining('my-config.ts'),
      expect.any(Object),
      expect.any(String),
    );
  });

  it('passes CDKX_OUT_DIR env var to the spawned process', async () => {
    const spawnApp = jest
      .fn()
      .mockReturnValue({ status: 0, stderr: '', stdout: '' });
    const cmd = ProjectCommand.create({
      existsSync: () => true,
      spawnApp,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(spawnApp).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ CDKX_OUT_DIR: 'cdkx.out' }),
      expect.any(String),
    );
  });
});
