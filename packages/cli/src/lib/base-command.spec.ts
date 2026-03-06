import { Command } from 'commander';
import { BaseCommand } from './base-command.js';

/** Concrete subclass used to test the abstract BaseCommand */
class TestCommand extends BaseCommand {
  build(): Command {
    return new Command('test');
  }

  /** Expose protected run() for testing */
  async runPublic(fn: () => Promise<void>): Promise<void> {
    return this.run(fn);
  }

  /** Expose protected fail() for testing */
  failPublic(message: string): never {
    return this.fail(message);
  }
}

describe('BaseCommand', () => {
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as () => never);
    errorSpy = jest.spyOn(console, 'error').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('run()', () => {
    it('resolves normally when fn succeeds', async () => {
      const cmd = new TestCommand();
      await expect(
        cmd.runPublic(() => Promise.resolve()),
      ).resolves.toBeUndefined();
      expect(exitSpy).not.toHaveBeenCalled();
    });

    it('prints error in red and exits with code 1 when fn throws an Error', async () => {
      const cmd = new TestCommand();
      await cmd.runPublic(() => Promise.reject(new Error('something broke')));
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('something broke'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('stringifies non-Error thrown values', async () => {
      const cmd = new TestCommand();
      await cmd.runPublic(() => Promise.reject('plain string error'));
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('plain string error'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('fail()', () => {
    it('throws an Error with the given message', () => {
      const cmd = new TestCommand();
      expect(() => cmd.failPublic('bad input')).toThrow('bad input');
    });

    it('thrown error is caught by run(), triggering exit(1)', async () => {
      const cmd = new TestCommand();
      await cmd.runPublic(async () => {
        cmd.failPublic('validation failed');
      });
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('validation failed'),
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('build()', () => {
    it('returns a Command instance', () => {
      const cmd = new TestCommand();
      expect(cmd.build()).toBeInstanceOf(Command);
    });
  });
});
