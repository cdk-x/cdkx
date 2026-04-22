import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Computes content hashes for asset files.
 *
 * Hashes are SHA-256 hex digests of raw file bytes. Identical file contents
 * produce identical hashes regardless of file name, timestamps, or path.
 */
export class AssetHasher {
  /**
   * Returns the SHA-256 hex digest of the file's contents.
   *
   * Throws if the file does not exist or cannot be read.
   */
  public static hashFile(filePath: string): string {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Returns a deterministic SHA-256 hex digest of a directory tree.
   *
   * The hash is computed over each file's relative path (POSIX separators)
   * and the SHA-256 of its contents, joined with a NUL byte and terminated
   * with a newline, in relative-path sort order. File permissions are not
   * included. Symlinks are followed and their target contents contribute
   * to the hash. An empty directory produces a stable hash.
   */
  public static hashDirectory(dirPath: string): string {
    const entries = AssetHasher.walkDirectory(dirPath);
    entries.sort((a, b) =>
      a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0,
    );

    const hash = crypto.createHash('sha256');
    for (const entry of entries) {
      const fileHash = crypto
        .createHash('sha256')
        .update(fs.readFileSync(entry.absPath))
        .digest('hex');
      hash.update(`${entry.relPath}\0${fileHash}\n`, 'utf-8');
    }
    return hash.digest('hex');
  }

  private static walkDirectory(
    root: string,
  ): Array<{ relPath: string; absPath: string }> {
    const results: Array<{ relPath: string; absPath: string }> = [];
    const stack: string[] = [root];
    while (stack.length > 0) {
      const current = stack.pop() as string;
      const entries = fs.readdirSync(current);
      for (const name of entries) {
        const absPath = path.join(current, name);
        const stat = fs.statSync(absPath);
        if (stat.isDirectory()) {
          stack.push(absPath);
        } else if (stat.isFile()) {
          const rel = path.relative(root, absPath).split(path.sep).join('/');
          results.push({ relPath: rel, absPath });
        }
      }
    }
    return results;
  }
}
