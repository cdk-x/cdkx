import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { AssetHasher } from './asset-hasher';

function tmpFile(contents: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-asset-hasher-'));
  const filePath = path.join(dir, 'file.txt');
  fs.writeFileSync(filePath, contents, 'utf-8');
  return filePath;
}

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-asset-hasher-dir-'));
}

describe('AssetHasher', () => {
  describe('hashFile()', () => {
    it('returns a SHA-256 hex digest (64 chars) of the file contents', () => {
      const filePath = tmpFile('hello world');

      const hash = AssetHasher.hashFile(filePath);

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      // Known SHA-256 of 'hello world'
      expect(hash).toBe(
        'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
      );
    });

    it('produces the same hash for identical content', () => {
      const a = tmpFile('same content');
      const b = tmpFile('same content');

      expect(AssetHasher.hashFile(a)).toBe(AssetHasher.hashFile(b));
    });

    it('produces different hashes for different content', () => {
      const a = tmpFile('one');
      const b = tmpFile('two');

      expect(AssetHasher.hashFile(a)).not.toBe(AssetHasher.hashFile(b));
    });

    it('throws when the file does not exist', () => {
      expect(() =>
        AssetHasher.hashFile('/nonexistent/path/to/file.txt'),
      ).toThrow();
    });
  });

  describe('hashDirectory()', () => {
    it('returns a deterministic SHA-256 hex digest for a single-file directory', () => {
      const dir = tmpDir();
      fs.writeFileSync(path.join(dir, 'a.txt'), 'hello', 'utf-8');

      const hash = AssetHasher.hashDirectory(dir);

      // Deterministic: hash is derived from "<relPath>\0<sha256-of-contents>\n"
      // for each entry, sorted by relPath.
      const fileHash = crypto
        .createHash('sha256')
        .update(Buffer.from('hello', 'utf-8'))
        .digest('hex');
      const expected = crypto
        .createHash('sha256')
        .update(`a.txt\0${fileHash}\n`, 'utf-8')
        .digest('hex');

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      expect(hash).toBe(expected);
    });

    it('produces the same hash for two directories with identical content laid out in different folders', () => {
      const a = tmpDir();
      fs.mkdirSync(path.join(a, 'inner'));
      fs.writeFileSync(path.join(a, 'inner', 'x.txt'), 'x', 'utf-8');
      fs.writeFileSync(path.join(a, 'top.txt'), 'top', 'utf-8');

      const b = tmpDir();
      // Create files in a different order to exercise non-deterministic FS
      // traversal — the hash must still match a's.
      fs.writeFileSync(path.join(b, 'top.txt'), 'top', 'utf-8');
      fs.mkdirSync(path.join(b, 'inner'));
      fs.writeFileSync(path.join(b, 'inner', 'x.txt'), 'x', 'utf-8');

      expect(AssetHasher.hashDirectory(a)).toBe(AssetHasher.hashDirectory(b));
    });

    it('produces different hashes when file contents differ', () => {
      const a = tmpDir();
      const b = tmpDir();
      fs.writeFileSync(path.join(a, 'f.txt'), 'one', 'utf-8');
      fs.writeFileSync(path.join(b, 'f.txt'), 'two', 'utf-8');

      expect(AssetHasher.hashDirectory(a)).not.toBe(
        AssetHasher.hashDirectory(b),
      );
    });

    it('produces different hashes when file names differ', () => {
      const a = tmpDir();
      const b = tmpDir();
      fs.writeFileSync(path.join(a, 'alpha.txt'), 'same', 'utf-8');
      fs.writeFileSync(path.join(b, 'beta.txt'), 'same', 'utf-8');

      expect(AssetHasher.hashDirectory(a)).not.toBe(
        AssetHasher.hashDirectory(b),
      );
    });

    it('returns a stable hash for an empty directory without error', () => {
      const a = tmpDir();
      const b = tmpDir();

      const hashA = AssetHasher.hashDirectory(a);
      const hashB = AssetHasher.hashDirectory(b);

      expect(hashA).toMatch(/^[a-f0-9]{64}$/);
      expect(hashA).toBe(hashB);
    });

    it('follows symlinks: the target content contributes to the hash', () => {
      const target = tmpDir();
      const realFile = path.join(target, 'real.txt');
      fs.writeFileSync(realFile, 'payload', 'utf-8');

      // Dir A: holds a symlink "link.txt" -> real.txt
      const a = tmpDir();
      fs.symlinkSync(realFile, path.join(a, 'link.txt'));

      // Dir B: holds a regular file "link.txt" with identical content.
      const b = tmpDir();
      fs.writeFileSync(path.join(b, 'link.txt'), 'payload', 'utf-8');

      expect(AssetHasher.hashDirectory(a)).toBe(AssetHasher.hashDirectory(b));
    });
  });
});
