import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { AcknowledgeCommand } from './acknowledge.command';

describe('AcknowledgeCommand', () => {
  let tempDir: string;
  let contextFilePath: string;
  let exitSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ack-cmd-test-'));
    contextFilePath = path.join(tempDir, 'cdkx.context.json');
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as () => never);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => { /* noop */ });
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => { /* noop */ });
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    logSpy.mockRestore();
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('command metadata', () => {
    it('should have correct name and description', () => {
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });
      expect(cmd.name()).toBe('acknowledge');
      expect(cmd.description()).toContain('Acknowledge');
    });
  });

  describe('acknowledge numeric ID', () => {
    it('should add numeric ID to context file', async () => {
      // Arrange
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });

      // Act
      await cmd.parseAsync(['node', 'cdkx', '34892']);

      // Assert
      expect(fs.existsSync(contextFilePath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(contextFilePath, 'utf-8'));
      expect(content['acknowledged-issue-numbers']).toContain(34892);
    });

    it('should print success message', async () => {
      // Arrange
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });

      // Act
      await cmd.parseAsync(['node', 'cdkx', '34892']);

      // Assert
      expect(logSpy).toHaveBeenCalled();
      const callArg = logSpy.mock.calls[0][0] as string;
      expect(callArg).toContain('Acknowledged');
      expect(callArg).toContain('34892');
    });

    it('should not duplicate existing IDs', async () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({ 'acknowledged-issue-numbers': [34892] }),
        'utf-8',
      );
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });

      // Act
      await cmd.parseAsync(['node', 'cdkx', '34892']);

      // Assert
      const content = JSON.parse(fs.readFileSync(contextFilePath, 'utf-8'));
      expect(content['acknowledged-issue-numbers']).toEqual([34892]);
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('already acknowledged'));
    });
  });

  describe('invalid ID', () => {
    it('should error for non-numeric ID', async () => {
      // Arrange
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });

      // Act
      await cmd.parseAsync(['node', 'cdkx', 'not-a-number']);

      // Assert
      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid issue ID'),
      );
    });
  });

  describe('multiple IDs', () => {
    it('should add multiple different IDs', async () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({ 'acknowledged-issue-numbers': [34892] }),
        'utf-8',
      );
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });

      // Act
      await cmd.parseAsync(['node', 'cdkx', '12345']);

      // Assert
      const content = JSON.parse(fs.readFileSync(contextFilePath, 'utf-8'));
      expect(content['acknowledged-issue-numbers']).toContain(34892);
      expect(content['acknowledged-issue-numbers']).toContain(12345);
    });
  });

  describe('--list option', () => {
    it('should list all acknowledged IDs', async () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({ 'acknowledged-issue-numbers': [11111, 22222, 33333] }),
        'utf-8',
      );
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });

      // Act
      await cmd.parseAsync(['node', 'cdkx', '--list']);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Acknowledged Issues:'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('11111'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('22222'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('33333'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 3 issue(s)'));
    });

    it('should show empty message when no acknowledgements', async () => {
      // Arrange - no context file exists
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });

      // Act
      await cmd.parseAsync(['node', 'cdkx', '--list']);

      // Assert
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No issues have been acknowledged'));
    });

    it('should not require ID when using --list', async () => {
      // Arrange
      const cmd = AcknowledgeCommand.create({
        getContextPath: () => contextFilePath,
      });

      // Act
      await cmd.parseAsync(['node', 'cdkx', '--list']);

      // Assert - should not exit with error
      expect(exitSpy).not.toHaveBeenCalled();
    });
  });
});
