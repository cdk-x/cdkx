import { FileTransport } from './file-transport';
import * as winston from 'winston';

describe('FileTransport', () => {
  let mockFs: {
    mkdirSync: jest.Mock;
    readdirSync: jest.Mock;
    statSync: jest.Mock;
    unlinkSync: jest.Mock;
  };

  beforeEach(() => {
    mockFs = {
      mkdirSync: jest.fn(),
      readdirSync: jest.fn().mockReturnValue([]),
      statSync: jest.fn(),
      unlinkSync: jest.fn(),
    };
  });

  it('should create log directory on construction', () => {
    const format = winston.format.json();

    new FileTransport({
      logDir: '/tmp/logs',
      maxFiles: 50,
      format,
      deps: mockFs,
    });

    expect(mockFs.mkdirSync).toHaveBeenCalledWith('/tmp/logs', {
      recursive: true,
    });
  });

  it('should return a Winston file transport instance', () => {
    const format = winston.format.json();

    const fileTransport = new FileTransport({
      logDir: '/tmp/logs',
      maxFiles: 50,
      format,
      deps: mockFs,
    });

    const transport = fileTransport.getTransport();
    expect(transport).toBeInstanceOf(winston.transports.File);
  });

  describe('rotation', () => {
    it('should delete files exceeding maxFiles limit', () => {
      mockFs.readdirSync.mockReturnValue([
        'deploy-2026-01-01T00-00-00-000Z.log',
        'deploy-2026-01-02T00-00-00-000Z.log',
        'deploy-2026-01-03T00-00-00-000Z.log',
        'deploy-2026-01-04T00-00-00-000Z.log',
        'deploy-2026-01-05T00-00-00-000Z.log',
      ]);

      // Mock statSync to return increasing timestamps
      // (older files have earlier timestamps)
      const baseMtime = new Date('2026-01-01T00:00:00Z').getTime();
      mockFs.statSync.mockImplementation((path: string) => {
        const fileName = path.split('/').pop() ?? '';
        const match = fileName.match(/deploy-2026-01-(\d+)T/);
        const day = match ? parseInt(match[1], 10) : 1;
        const mtime = new Date(baseMtime + (day - 1) * 86400000); // +1 day per file
        return { mtime };
      });

      const format = winston.format.json();

      new FileTransport({
        logDir: '/tmp/logs',
        maxFiles: 3,
        format,
        deps: mockFs,
      });

      // Should delete the 2 oldest files (keep only 3 most recent: 03, 04, 05)
      expect(mockFs.unlinkSync).toHaveBeenCalledTimes(2);
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        '/tmp/logs/deploy-2026-01-01T00-00-00-000Z.log',
      );
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        '/tmp/logs/deploy-2026-01-02T00-00-00-000Z.log',
      );
    });

    it('should keep files within maxFiles limit', () => {
      mockFs.readdirSync.mockReturnValue([
        'deploy-2026-01-01T00-00-00-000Z.log',
        'deploy-2026-01-02T00-00-00-000Z.log',
      ]);

      const baseMtime = new Date('2026-01-01T00:00:00Z').getTime();
      mockFs.statSync.mockImplementation((path: string) => {
        const fileName = path.split('/').pop() ?? '';
        const match = fileName.match(/deploy-2026-01-(\d+)T/);
        const day = match ? parseInt(match[1], 10) : 1;
        const mtime = new Date(baseMtime + (day - 1) * 86400000);
        return { mtime };
      });

      const format = winston.format.json();

      new FileTransport({
        logDir: '/tmp/logs',
        maxFiles: 3,
        format,
        deps: mockFs,
      });

      // Should not delete any files (2 < 3)
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should ignore non-log files', () => {
      mockFs.readdirSync.mockReturnValue([
        'deploy-2026-01-01T00-00-00-000Z.log',
        'other-file.txt',
        'README.md',
        'engine-state.json',
      ]);

      mockFs.statSync.mockImplementation(() => {
        return { mtime: new Date() };
      });

      const format = winston.format.json();

      new FileTransport({
        logDir: '/tmp/logs',
        maxFiles: 50,
        format,
        deps: mockFs,
      });

      // Should only consider deploy-*.log files
      expect(mockFs.statSync).toHaveBeenCalledTimes(1);
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
    });

    it('should handle missing log directory gracefully', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const format = winston.format.json();

      // Should not throw - error is caught and ignored
      expect(() => {
        new FileTransport({
          logDir: '/tmp/logs',
          maxFiles: 50,
          format,
          deps: mockFs,
        });
      }).not.toThrow();

      // Should still create directory
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/tmp/logs', {
        recursive: true,
      });
    });
  });
});
