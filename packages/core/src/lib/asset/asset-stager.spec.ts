import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { AssetStager } from './asset-stager';

function tmpRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-asset-stager-'));
}

describe('AssetStager', () => {
  describe('stageFile()', () => {
    it('copies the source file into destDir with the given filename', () => {
      const root = tmpRoot();
      const src = path.join(root, 'source.txt');
      const destDir = path.join(root, 'assets/asset.abc123');
      fs.writeFileSync(src, 'payload', 'utf-8');

      AssetStager.stageFile(src, destDir, 'staged.txt');

      const stagedPath = path.join(destDir, 'staged.txt');
      expect(fs.existsSync(stagedPath)).toBe(true);
      expect(fs.readFileSync(stagedPath, 'utf-8')).toBe('payload');
    });

    it('creates the destination directory if it does not exist', () => {
      const root = tmpRoot();
      const src = path.join(root, 'source.txt');
      const destDir = path.join(root, 'deep/nested/assets/asset.xyz');
      fs.writeFileSync(src, 'x', 'utf-8');

      AssetStager.stageFile(src, destDir, 'file.txt');

      expect(fs.existsSync(path.join(destDir, 'file.txt'))).toBe(true);
    });

    it('preserves byte content (binary-safe copy)', () => {
      const root = tmpRoot();
      const src = path.join(root, 'bin.dat');
      const destDir = path.join(root, 'dest');
      const bytes = Buffer.from([0x00, 0xff, 0x10, 0x7f, 0x80]);
      fs.writeFileSync(src, bytes);

      AssetStager.stageFile(src, destDir, 'bin.dat');

      const copied = fs.readFileSync(path.join(destDir, 'bin.dat'));
      expect(copied.equals(bytes)).toBe(true);
    });

    it('throws when the source file does not exist', () => {
      const root = tmpRoot();
      expect(() =>
        AssetStager.stageFile(
          path.join(root, 'missing.txt'),
          path.join(root, 'dest'),
          'x.txt',
        ),
      ).toThrow();
    });
  });

  describe('stageDirectory()', () => {
    it('mirrors a nested directory tree into destDir', () => {
      const root = tmpRoot();
      const src = path.join(root, 'src');
      fs.mkdirSync(src);
      fs.writeFileSync(path.join(src, 'top.txt'), 'top', 'utf-8');
      fs.mkdirSync(path.join(src, 'nested'));
      fs.writeFileSync(path.join(src, 'nested', 'inner.txt'), 'inner', 'utf-8');

      const dest = path.join(root, 'assets/asset.abc');
      AssetStager.stageDirectory(src, dest);

      expect(fs.readFileSync(path.join(dest, 'top.txt'), 'utf-8')).toBe('top');
      expect(
        fs.readFileSync(path.join(dest, 'nested', 'inner.txt'), 'utf-8'),
      ).toBe('inner');
    });

    it('stages an empty directory without error', () => {
      const root = tmpRoot();
      const src = path.join(root, 'empty');
      fs.mkdirSync(src);
      const dest = path.join(root, 'assets/asset.empty');

      expect(() => AssetStager.stageDirectory(src, dest)).not.toThrow();

      expect(fs.existsSync(dest)).toBe(true);
      expect(fs.readdirSync(dest)).toEqual([]);
    });

    it('follows symlinks and copies the target contents', () => {
      const root = tmpRoot();
      const externalTarget = path.join(root, 'external.txt');
      fs.writeFileSync(externalTarget, 'linked-payload', 'utf-8');

      const src = path.join(root, 'src');
      fs.mkdirSync(src);
      fs.symlinkSync(externalTarget, path.join(src, 'alias.txt'));

      const dest = path.join(root, 'assets/asset.lnk');
      AssetStager.stageDirectory(src, dest);

      const copied = path.join(dest, 'alias.txt');
      expect(fs.existsSync(copied)).toBe(true);
      // lstat must report a regular file (not a symlink) — target content copied.
      expect(fs.lstatSync(copied).isSymbolicLink()).toBe(false);
      expect(fs.readFileSync(copied, 'utf-8')).toBe('linked-payload');
    });
  });
});
