import { InitTemplateEngine, InitFileSystem } from './init-template-engine';

function makeMockFs(overrides: Partial<InitFileSystem> = {}): InitFileSystem & {
  written: Record<string, string>;
  dirs: string[];
} {
  const written: Record<string, string> = {};
  const dirs: string[] = [];

  return {
    written,
    dirs,
    exists: () => false,
    mkdir: (path) => {
      dirs.push(path);
    },
    writeFile: (path, content) => {
      written[path] = content;
    },
    readFile: () => '',
    ...overrides,
  };
}

describe('InitTemplateEngine — empty mode', () => {
  describe('cdkx.json', () => {
    it('generates cdkx.json with app and output fields', () => {
      const fs = makeMockFs();
      const engine = new InitTemplateEngine(fs);

      engine.generate({
        dir: '/my/project',
        name: 'my-project',
        mode: 'empty',
      });

      const content = JSON.parse(fs.written['/my/project/cdkx.json']);
      expect(content).toEqual({
        app: 'npx tsx src/main.ts',
        output: 'cdkx.out',
      });
    });
  });

  describe('InitResult', () => {
    it('returns all 4 created file paths and empty skipped and merged arrays', () => {
      const fs = makeMockFs();
      const engine = new InitTemplateEngine(fs);

      const result = engine.generate({ dir: '/p', name: 'p', mode: 'empty' });

      expect(result.created).toHaveLength(4);
      expect(result.created).toEqual(
        expect.arrayContaining([
          '/p/tsconfig.json',
          '/p/src/main.ts',
          '/p/package.json',
          '/p/cdkx.json',
        ]),
      );
      expect(result.skipped).toHaveLength(0);
      expect(result.merged).toHaveLength(0);
    });
  });

  describe('tsconfig.json', () => {
    it('generates tsconfig.json with commonjs module and strict settings', () => {
      const fs = makeMockFs();
      const engine = new InitTemplateEngine(fs);

      engine.generate({ dir: '/my/project', name: 'my-app', mode: 'empty' });

      const tsconfig = JSON.parse(fs.written['/my/project/tsconfig.json']);
      expect(tsconfig.compilerOptions.module).toBe('commonjs');
      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.rootDir).toBe('src');
      expect(tsconfig.compilerOptions.outDir).toBe('dist');
      expect(tsconfig.include).toContain('src/**/*');
    });
  });

  describe('src/main.ts', () => {
    it('creates the src/ directory before writing main.ts', () => {
      const fs = makeMockFs();
      const engine = new InitTemplateEngine(fs);

      engine.generate({ dir: '/my/project', name: 'my-app', mode: 'empty' });

      expect(fs.dirs).toContain('/my/project/src');
    });

    it('generates src/main.ts with App and Stack imports and a placeholder comment', () => {
      const fs = makeMockFs();
      const engine = new InitTemplateEngine(fs);

      engine.generate({ dir: '/my/project', name: 'my-app', mode: 'empty' });

      const content = fs.written['/my/project/src/main.ts'];
      expect(content).toContain("from '@cdkx-io/core'");
      expect(content).toContain('new App()');
      expect(content).toContain('new Stack(');
      expect(content).toContain('app.synth()');
    });
  });

  describe('package.json', () => {
    it('generates package.json with project name, scripts and dependencies', () => {
      const fs = makeMockFs();
      const engine = new InitTemplateEngine(fs);

      engine.generate({ dir: '/my/project', name: 'my-app', mode: 'empty' });

      const pkg = JSON.parse(fs.written['/my/project/package.json']);
      expect(pkg.name).toBe('my-app');
      expect(pkg.version).toBe('0.1.0');
      expect(pkg.scripts).toEqual(
        expect.objectContaining({
          synth: 'cdkx synth',
          deploy: 'cdkx deploy',
          destroy: 'cdkx destroy',
        }),
      );
      expect(pkg.dependencies).toEqual(
        expect.objectContaining({ '@cdkx-io/core': 'latest' }),
      );
      expect(pkg.devDependencies).toEqual(
        expect.objectContaining({
          '@cdkx-io/cli': 'latest',
          typescript: expect.any(String),
          tsx: expect.any(String),
        }),
      );
    });
  });
});
