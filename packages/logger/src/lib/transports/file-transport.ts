import * as fs from 'node:fs';
import * as path from 'node:path';
import * as winston from 'winston';

/**
 * Options for file transport with rotation.
 */
export interface FileTransportOptions {
  /**
   * Directory where log files will be written.
   */
  logDir: string;

  /**
   * Maximum number of log files to retain.
   * Older files are automatically deleted on rotation.
   */
  maxFiles: number;

  /**
   * Combined Winston format to apply.
   */
  format: winston.Logform.Format;

  /**
   * Injectable fs functions for testing.
   */
  deps?: {
    mkdirSync?: typeof fs.mkdirSync;
    readdirSync?: typeof fs.readdirSync;
    statSync?: typeof fs.statSync;
    unlinkSync?: typeof fs.unlinkSync;
  };
}

/**
 * File transport with automatic rotation.
 * Keeps the N most recent log files and deletes older ones.
 */
export class FileTransport {
  private readonly logDir: string;
  private readonly maxFiles: number;
  private readonly transport: winston.transports.FileTransportInstance;
  private readonly deps: Required<NonNullable<FileTransportOptions['deps']>>;

  constructor(options: FileTransportOptions) {
    this.logDir = options.logDir;
    this.maxFiles = options.maxFiles;
    this.deps = {
      mkdirSync: options.deps?.mkdirSync ?? fs.mkdirSync,
      readdirSync: options.deps?.readdirSync ?? fs.readdirSync,
      statSync: options.deps?.statSync ?? fs.statSync,
      unlinkSync: options.deps?.unlinkSync ?? fs.unlinkSync,
    };

    // Ensure log directory exists
    this.deps.mkdirSync(this.logDir, { recursive: true });

    // Clean up old log files before creating new transport
    this.rotateLogFiles();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `deploy-${timestamp}.log`;
    const logFilePath = path.join(this.logDir, filename);

    // Create Winston file transport
    this.transport = new winston.transports.File({
      filename: logFilePath,
      format: options.format,
    });
  }

  /**
   * Get the Winston transport instance.
   */
  getTransport(): winston.transports.FileTransportInstance {
    return this.transport;
  }

  /**
   * Rotate log files - keep only the N most recent files.
   */
  private rotateLogFiles(): void {
    try {
      const files = this.deps.readdirSync(this.logDir);
      const logFiles = files
        .filter((f) => f.startsWith('deploy-') && f.endsWith('.log'))
        .map((f) => {
          const filePath = path.join(this.logDir, f);
          const stats = this.deps.statSync(filePath);
          return { name: f, path: filePath, mtime: stats.mtime.getTime() };
        })
        .sort((a, b) => b.mtime - a.mtime); // newest first

      // Delete files beyond maxFiles limit
      const filesToDelete = logFiles.slice(this.maxFiles);
      for (const file of filesToDelete) {
        this.deps.unlinkSync(file.path);
      }
    } catch {
      // Directory doesn't exist yet or other error - safe to ignore
      // mkdirSync will create it in the constructor
    }
  }
}
