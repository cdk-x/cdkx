import { SynthCommand } from './synth.command.js';

describe('SynthCommand — metadata', () => {
  it('has name "synth"', () => {
    const cmd = SynthCommand.create();
    expect(cmd.name()).toBe('synth');
  });

  it('has a description', () => {
    const cmd = SynthCommand.create();
    expect(cmd.description()).toBeTruthy();
  });

  it('has --config option with default "cdkx.json"', () => {
    const cmd = SynthCommand.create();
    const opt = cmd.options.find((o) => o.long === '--config');
    expect(opt).toBeDefined();
    expect(opt?.defaultValue).toBe('cdkx.json');
  });

  it('has --output option with no default', () => {
    const cmd = SynthCommand.create();
    const opt = cmd.options.find((o) => o.long === '--output');
    expect(opt).toBeDefined();
    expect(opt?.defaultValue).toBeUndefined();
  });
});

describe('SynthCommand — execution', () => {
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
    const cmd = SynthCommand.create({
      existsSync: () => false,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when config has no "app" field', async () => {
    const cmd = SynthCommand.create({
      existsSync: () => true,
      readConfig: () => ({}) as never,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 when the app process fails', async () => {
    const cmd = SynthCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node fake.js' }),
      spawnApp: () => ({
        status: 1,
        stderr: 'something went wrong',
        stdout: '',
      }),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('prints success when the app process exits with code 0', async () => {
    const cmd = SynthCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      spawnApp: () => ({ status: 0, stderr: '', stdout: '' }),
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(exitSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Synthesis complete'),
    );
  });

  it('passes CDKX_OUT_DIR from config.output to the spawned process', async () => {
    const spawnApp = jest
      .fn()
      .mockReturnValue({ status: 0, stderr: '', stdout: '' });
    const cmd = SynthCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js', output: 'my-out' }),
      spawnApp,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(spawnApp).toHaveBeenCalledWith(
      'node app.js',
      expect.objectContaining({ CDKX_OUT_DIR: 'my-out' }),
    );
  });

  it('--output flag overrides config.output', async () => {
    const spawnApp = jest
      .fn()
      .mockReturnValue({ status: 0, stderr: '', stdout: '' });
    const cmd = SynthCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js', output: 'from-config' }),
      spawnApp,
    });
    await cmd.parseAsync(['node', 'cdkx', '--output', 'from-flag']);
    expect(spawnApp).toHaveBeenCalledWith(
      'node app.js',
      expect.objectContaining({ CDKX_OUT_DIR: 'from-flag' }),
    );
  });

  it('defaults CDKX_OUT_DIR to "cdkx.out" when neither config nor flag sets output', async () => {
    const spawnApp = jest
      .fn()
      .mockReturnValue({ status: 0, stderr: '', stdout: '' });
    const cmd = SynthCommand.create({
      existsSync: () => true,
      readConfig: () => ({ app: 'node app.js' }),
      spawnApp,
    });
    await cmd.parseAsync(['node', 'cdkx']);
    expect(spawnApp).toHaveBeenCalledWith(
      'node app.js',
      expect.objectContaining({ CDKX_OUT_DIR: 'cdkx.out' }),
    );
  });

  it('uses a custom --config path', async () => {
    const readConfig = jest.fn().mockReturnValue({ app: 'node app.js' });
    const cmd = SynthCommand.create({
      existsSync: () => true,
      readConfig,
      spawnApp: () => ({ status: 0, stderr: '', stdout: '' }),
    });
    await cmd.parseAsync(['node', 'cdkx', '--config', 'infra/cdkx.json']);
    expect(readConfig).toHaveBeenCalledWith(
      expect.stringContaining('infra/cdkx.json'),
    );
  });
});
