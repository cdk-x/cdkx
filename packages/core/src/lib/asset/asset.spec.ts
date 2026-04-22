import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { App } from '../app/app';
import { Stack } from '../stack/stack';
import { Asset } from './asset';
import { AssetHasher } from './asset-hasher';
import { CloudAssemblyBuilder } from '../assembly/cloud-assembly';

function tmpFile(name: string, contents: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-asset-'));
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, contents, 'utf-8');
  return filePath;
}

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-asset-dir-'));
}

describe('Asset', () => {
  it('computes assetHash as SHA-256 of the source file contents', () => {
    const filePath = tmpFile('cloud-init.yaml', 'hello: world');
    const app = new App();
    const stack = new Stack(app, 'S');

    const asset = new Asset(stack, 'Asset', { path: filePath });

    expect(asset.assetHash).toBe(AssetHasher.hashFile(filePath));
  });

  describe('absolutePath', () => {
    it('resolves to <outdir>/assets/asset.<hash>/<fileName>', () => {
      const outdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-asset-abs-'));
      const filePath = tmpFile('cloud-init.yaml', 'x: 1');
      const app = new App({ outdir });
      const stack = new Stack(app, 'S');

      const asset = new Asset(stack, 'Asset', { path: filePath });

      expect(asset.absolutePath).toBe(
        path.join(
          outdir,
          'assets',
          `asset.${asset.assetHash}`,
          'cloud-init.yaml',
        ),
      );
    });

    it('is absolute even when App.outdir is relative', () => {
      const filePath = tmpFile('cloud-init.yaml', 'y: 2');
      const app = new App({ outdir: 'cdkx.out' });
      const stack = new Stack(app, 'S');

      const asset = new Asset(stack, 'Asset', { path: filePath });

      expect(path.isAbsolute(asset.absolutePath)).toBe(true);
    });
  });

  describe('isAsset()', () => {
    it('returns true for Asset instances', () => {
      const filePath = tmpFile('f.txt', 'x');
      const app = new App();
      const stack = new Stack(app, 'S');
      const asset = new Asset(stack, 'Asset', { path: filePath });

      expect(Asset.isAsset(asset)).toBe(true);
    });

    it('returns false for non-Asset values', () => {
      expect(Asset.isAsset({})).toBe(false);
      expect(Asset.isAsset(undefined)).toBe(false);
      expect(Asset.isAsset('string')).toBe(false);
    });
  });

  it('throws when the source file does not exist', () => {
    const app = new App();
    const stack = new Stack(app, 'S');
    expect(
      () =>
        new Asset(stack, 'Asset', { path: '/nonexistent/path/to/file.yaml' }),
    ).toThrow();
  });

  it('throws when neither path nor directoryPath is provided', () => {
    const app = new App();
    const stack = new Stack(app, 'S');
    expect(() => new Asset(stack, 'Asset', {})).toThrow(/path.*directoryPath/i);
  });

  it('throws when both path and directoryPath are provided', () => {
    const filePath = tmpFile('x.txt', 'x');
    const dirPath = tmpDir();
    const app = new App();
    const stack = new Stack(app, 'S');
    expect(
      () =>
        new Asset(stack, 'Asset', { path: filePath, directoryPath: dirPath }),
    ).toThrow(/path.*directoryPath/i);
  });

  describe('directory source', () => {
    it('computes assetHash via AssetHasher.hashDirectory() and sets absolutePath to the staged directory (no file name appended)', () => {
      const outdir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'cdkx-asset-dir-out-'),
      );
      const dirPath = tmpDir();
      fs.writeFileSync(path.join(dirPath, 'a.txt'), 'hello', 'utf-8');

      const app = new App({ outdir });
      const stack = new Stack(app, 'S');
      const asset = new Asset(stack, 'Ansible', { directoryPath: dirPath });

      expect(asset.packaging).toBe('directory');
      expect(asset.assetHash).toBe(AssetHasher.hashDirectory(dirPath));
      expect(asset.absolutePath).toBe(
        path.join(outdir, 'assets', `asset.${asset.assetHash}`),
      );
    });

    it('synthesizeAsset() mirrors the directory tree and registers a cdkx:asset artifact with packaging:"directory"', () => {
      const dirPath = tmpDir();
      fs.writeFileSync(path.join(dirPath, 'top.txt'), 'top', 'utf-8');
      fs.mkdirSync(path.join(dirPath, 'nested'));
      fs.writeFileSync(path.join(dirPath, 'nested', 'inner.txt'), 'x', 'utf-8');

      const outdir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'cdkx-asset-dir-synth-'),
      );
      const builder = new CloudAssemblyBuilder(outdir);
      const app = new App({ outdir });
      const stack = new Stack(app, 'S');
      const asset = new Asset(stack, 'Role', { directoryPath: dirPath });

      asset.synthesizeAsset({ outdir, assembly: builder });

      const stagedDir = path.join(outdir, 'assets', `asset.${asset.assetHash}`);
      expect(fs.readFileSync(path.join(stagedDir, 'top.txt'), 'utf-8')).toBe(
        'top',
      );
      expect(
        fs.readFileSync(path.join(stagedDir, 'nested', 'inner.txt'), 'utf-8'),
      ).toBe('x');

      builder.buildAssembly();
      const manifest = JSON.parse(
        fs.readFileSync(path.join(outdir, 'manifest.json'), 'utf-8'),
      );
      const artifactId = `asset.${asset.assetHash}`;
      expect(manifest.artifacts[artifactId]).toEqual({
        type: 'cdkx:asset',
        properties: {
          hash: asset.assetHash,
          path: `assets/asset.${asset.assetHash}`,
          packaging: 'directory',
        },
      });
    });
  });

  describe('synthesizeAsset()', () => {
    it('stages the file under assets/asset.<hash>/<fileName> and registers a cdkx:asset artifact', () => {
      const filePath = tmpFile('cloud-init.yaml', 'users: []');
      const outdir = fs.mkdtempSync(
        path.join(os.tmpdir(), 'cdkx-asset-synth-'),
      );
      const builder = new CloudAssemblyBuilder(outdir);
      const app = new App({ outdir });
      const stack = new Stack(app, 'S');
      const asset = new Asset(stack, 'Asset', { path: filePath });

      asset.synthesizeAsset({ outdir, assembly: builder });

      const stagedPath = path.join(
        outdir,
        'assets',
        `asset.${asset.assetHash}`,
        'cloud-init.yaml',
      );
      expect(fs.existsSync(stagedPath)).toBe(true);
      expect(fs.readFileSync(stagedPath, 'utf-8')).toBe('users: []');

      builder.buildAssembly();
      const manifest = JSON.parse(
        fs.readFileSync(path.join(outdir, 'manifest.json'), 'utf-8'),
      );
      const artifactId = `asset.${asset.assetHash}`;
      expect(manifest.artifacts[artifactId]).toEqual({
        type: 'cdkx:asset',
        properties: {
          hash: asset.assetHash,
          path: `assets/asset.${asset.assetHash}/cloud-init.yaml`,
          packaging: 'file',
        },
      });
    });
  });
});
