import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { CdkxContext } from './cdkx-context';

describe('CdkxContext', () => {
  let tempDir: string;
  let contextFilePath: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-context-test-'));
    contextFilePath = path.join(tempDir, 'cdkx.context.json');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('acknowledge', () => {
    it('should create context file if it does not exist', () => {
      // Arrange
      const context = new CdkxContext(contextFilePath);

      // Act
      context.acknowledge(34892);

      // Assert
      expect(fs.existsSync(contextFilePath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(contextFilePath, 'utf-8'));
      expect(content['acknowledged-issue-numbers']).toEqual([34892]);
    });

    it('should add numeric id to existing context file', () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({ 'acknowledged-issue-numbers': [] }),
        'utf-8',
      );
      const context = new CdkxContext(contextFilePath);

      // Act
      context.acknowledge(12345);

      // Assert
      const content = JSON.parse(fs.readFileSync(contextFilePath, 'utf-8'));
      expect(content['acknowledged-issue-numbers']).toContain(12345);
    });

    it('should accept string id and parse to number', () => {
      // Arrange
      const context = new CdkxContext(contextFilePath);

      // Act
      context.acknowledge('34892');

      // Assert
      const content = JSON.parse(fs.readFileSync(contextFilePath, 'utf-8'));
      expect(content['acknowledged-issue-numbers']).toEqual([34892]);
    });

    it('should not duplicate existing ids', () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({ 'acknowledged-issue-numbers': [34892] }),
        'utf-8',
      );
      const context = new CdkxContext(contextFilePath);

      // Act
      context.acknowledge(34892);

      // Assert
      const content = JSON.parse(fs.readFileSync(contextFilePath, 'utf-8'));
      expect(content['acknowledged-issue-numbers']).toEqual([34892]);
    });

    it('should throw for invalid string id', () => {
      // Arrange
      const context = new CdkxContext(contextFilePath);

      // Act & Assert
      expect(() => context.acknowledge('not-a-number')).toThrow('Invalid acknowledgement ID');
    });
  });

  describe('getAcknowledgedIds', () => {
    it('should return empty set when file does not exist', () => {
      // Arrange
      const context = new CdkxContext(contextFilePath);

      // Act
      const ids = context.getAcknowledgedIds();

      // Assert
      expect(ids.size).toBe(0);
    });

    it('should return all acknowledged ids as strings', () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({
          'acknowledged-issue-numbers': [34892, 12345],
        }),
        'utf-8',
      );
      const context = new CdkxContext(contextFilePath);

      // Act
      const ids = context.getAcknowledgedIds();

      // Assert
      expect(ids.has('34892')).toBe(true);
      expect(ids.has('12345')).toBe(true);
      expect(ids.has('99999')).toBe(false);
    });
  });

  describe('listAcknowledgements', () => {
    it('should return empty array when file does not exist', () => {
      // Arrange
      const context = new CdkxContext(contextFilePath);

      // Act
      const list = context.listAcknowledgements();

      // Assert
      expect(list).toEqual([]);
    });

    it('should return all acknowledged issue numbers', () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({
          'acknowledged-issue-numbers': [34892, 12345],
        }),
        'utf-8',
      );
      const context = new CdkxContext(contextFilePath);

      // Act
      const list = context.listAcknowledgements();

      // Assert
      expect(list).toEqual([34892, 12345]);
    });
  });

  describe('isAcknowledged', () => {
    it('should return false when id is not acknowledged', () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({ 'acknowledged-issue-numbers': [34892] }),
        'utf-8',
      );
      const context = new CdkxContext(contextFilePath);

      // Act
      const result = context.isAcknowledged(12345);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when id is acknowledged', () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({ 'acknowledged-issue-numbers': [34892] }),
        'utf-8',
      );
      const context = new CdkxContext(contextFilePath);

      // Act
      const result = context.isAcknowledged(34892);

      // Assert
      expect(result).toBe(true);
    });

    it('should work with string id', () => {
      // Arrange
      fs.writeFileSync(
        contextFilePath,
        JSON.stringify({ 'acknowledged-issue-numbers': [34892] }),
        'utf-8',
      );
      const context = new CdkxContext(contextFilePath);

      // Act
      const result = context.isAcknowledged('34892');

      // Assert
      expect(result).toBe(true);
    });
  });
});
