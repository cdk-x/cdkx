import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { CloudAssemblyBuilder, CloudAssembly, MANIFEST_VERSION } from './cloud-assembly.js';

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-assembly-test-'));
}

describe('CloudAssemblyBuilder', () => {
  describe('writeFile()', () => {
    it('creates the outdir if it does not exist', () => {
      const outdir = path.join(os.tmpdir(), `cdkx-new-dir-${Math.random().toString(36).slice(2)}`);
      const builder = new CloudAssemblyBuilder(outdir);
      builder.writeFile('test.json', '{}');
      expect(fs.existsSync(path.join(outdir, 'test.json'))).toBe(true);
      fs.rmSync(outdir, { recursive: true });
    });

    it('writes the correct content to disk', () => {
      const outdir = tmpDir();
      const builder = new CloudAssemblyBuilder(outdir);
      builder.writeFile('hello.txt', 'world');
      expect(fs.readFileSync(path.join(outdir, 'hello.txt'), 'utf-8')).toBe('world');
      fs.rmSync(outdir, { recursive: true });
    });

    it('overwrites an existing file', () => {
      const outdir = tmpDir();
      const builder = new CloudAssemblyBuilder(outdir);
      builder.writeFile('file.json', 'first');
      builder.writeFile('file.json', 'second');
      expect(fs.readFileSync(path.join(outdir, 'file.json'), 'utf-8')).toBe('second');
      fs.rmSync(outdir, { recursive: true });
    });
  });

  describe('addArtifact()', () => {
    it('registers an artifact without error', () => {
      const builder = new CloudAssemblyBuilder(tmpDir());
      expect(() => builder.addArtifact({ id: 'stack-a', file: 'stack-a.json', provider: 'test' })).not.toThrow();
    });

    it('throws on duplicate artifact ID', () => {
      const builder = new CloudAssemblyBuilder(tmpDir());
      builder.addArtifact({ id: 'stack-a', file: 'stack-a.json', provider: 'test' });
      expect(() => builder.addArtifact({ id: 'stack-a', file: 'stack-a-2.json', provider: 'test' })).toThrow(
        "Duplicate artifact ID 'stack-a'",
      );
    });
  });

  describe('buildAssembly()', () => {
    it('writes manifest.json to disk', () => {
      const outdir = tmpDir();
      const builder = new CloudAssemblyBuilder(outdir);
      builder.addArtifact({ id: 'my-stack', file: 'my-stack.json', provider: 'test' });
      builder.buildAssembly();

      const manifestPath = path.join(outdir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
      fs.rmSync(outdir, { recursive: true });
    });

    it('manifest.json contains the correct version and stacks', () => {
      const outdir = tmpDir();
      const builder = new CloudAssemblyBuilder(outdir);
      builder.addArtifact({ id: 'stack-x', file: 'stack-x.json', provider: 'hetzner', displayName: 'My Stack' });
      builder.buildAssembly();

      const manifest = JSON.parse(fs.readFileSync(path.join(outdir, 'manifest.json'), 'utf-8'));
      expect(manifest.version).toBe(MANIFEST_VERSION);
      expect(manifest.stacks).toHaveLength(1);
      expect(manifest.stacks[0]).toEqual({
        id: 'stack-x',
        file: 'stack-x.json',
        provider: 'hetzner',
        displayName: 'My Stack',
      });
      fs.rmSync(outdir, { recursive: true });
    });

    it('returns a CloudAssembly with the registered artifacts', () => {
      const outdir = tmpDir();
      const builder = new CloudAssemblyBuilder(outdir);
      builder.addArtifact({ id: 'a', file: 'a.json', provider: 'test' });
      builder.addArtifact({ id: 'b', file: 'b.json', provider: 'test' });
      const assembly = builder.buildAssembly();

      expect(assembly).toBeInstanceOf(CloudAssembly);
      expect(assembly.stacks).toHaveLength(2);
      fs.rmSync(outdir, { recursive: true });
    });

    it('returns empty stacks array when no artifacts were added', () => {
      const outdir = tmpDir();
      const assembly = new CloudAssemblyBuilder(outdir).buildAssembly();
      expect(assembly.stacks).toEqual([]);
      fs.rmSync(outdir, { recursive: true });
    });
  });
});

describe('CloudAssembly', () => {
  function makeAssembly() {
    const outdir = tmpDir();
    const builder = new CloudAssemblyBuilder(outdir);
    builder.addArtifact({ id: 'stack-a', file: 'stack-a.json', provider: 'test', displayName: 'Stack A' });
    builder.addArtifact({ id: 'stack-b', file: 'stack-b.yaml', provider: 'k8s' });
    return { assembly: builder.buildAssembly(), outdir };
  }

  it('stacks returns all artifacts', () => {
    const { assembly, outdir } = makeAssembly();
    expect(assembly.stacks).toHaveLength(2);
    fs.rmSync(outdir, { recursive: true });
  });

  it('getStack() returns the correct artifact by id', () => {
    const { assembly, outdir } = makeAssembly();
    const artifact = assembly.getStack('stack-a');
    expect(artifact).toBeDefined();
    expect(artifact?.file).toBe('stack-a.json');
    expect(artifact?.displayName).toBe('Stack A');
    fs.rmSync(outdir, { recursive: true });
  });

  it('getStack() returns undefined for an unknown id', () => {
    const { assembly, outdir } = makeAssembly();
    expect(assembly.getStack('nonexistent')).toBeUndefined();
    fs.rmSync(outdir, { recursive: true });
  });

  it('outdir is accessible', () => {
    const outdir = tmpDir();
    const assembly = new CloudAssemblyBuilder(outdir).buildAssembly();
    expect(assembly.outdir).toBe(outdir);
    fs.rmSync(outdir, { recursive: true });
  });
});
