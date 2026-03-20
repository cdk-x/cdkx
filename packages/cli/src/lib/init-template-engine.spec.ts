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

describe('InitTemplateEngine — existing mode', () => {
  const existingPkg = JSON.stringify({
    name: 'my-app',
    version: '1.2.3',
    scripts: { build: 'tsc', test: 'jest' },
    dependencies: { lodash: '^4.0.0' },
    devDependencies: { prettier: '^3.0.0' },
  });

  function makeExistingFs(
    overrides: Partial<InitFileSystem> = {},
  ): InitFileSystem & { written: Record<string, string>; dirs: string[] } {
    const written: Record<string, string> = {};
    const dirs: string[] = [];
    return {
      written,
      dirs,
      exists: (p) => p === '/p/package.json',
      mkdir: (path) => dirs.push(path),
      writeFile: (path, content) => {
        written[path] = content;
      },
      readFile: (p) => (p === '/p/package.json' ? existingPkg : ''),
      ...overrides,
    };
  }

  describe('InitResult', () => {
    it('puts package.json in merged and not in created', () => {
      const fs = makeExistingFs();
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/p',
        name: 'p',
        mode: 'existing',
      });

      expect(result.merged).toContain('/p/package.json');
      expect(result.created).not.toContain('/p/package.json');
    });
  });

  describe('package.json merge — scripts', () => {
    it('adds cdkx scripts without overwriting existing scripts', () => {
      const fs = makeExistingFs();
      const engine = new InitTemplateEngine(fs);
      engine.generate({ dir: '/p', name: 'p', mode: 'existing' });

      const pkg = JSON.parse(fs.written['/p/package.json']);
      // existing scripts preserved
      expect(pkg.scripts.build).toBe('tsc');
      expect(pkg.scripts.test).toBe('jest');
      // cdkx scripts added
      expect(pkg.scripts.synth).toBe('cdkx synth');
      expect(pkg.scripts.deploy).toBe('cdkx deploy');
      expect(pkg.scripts.destroy).toBe('cdkx destroy');
    });

    it('does not overwrite a script that already exists with the same key', () => {
      const conflictingPkg = JSON.stringify({
        name: 'my-app',
        scripts: { synth: 'my-custom-synth' },
      });
      const fs = makeExistingFs({
        readFile: (p) => (p === '/p/package.json' ? conflictingPkg : ''),
      });
      const engine = new InitTemplateEngine(fs);
      engine.generate({ dir: '/p', name: 'p', mode: 'existing' });

      const pkg = JSON.parse(fs.written['/p/package.json']);
      expect(pkg.scripts.synth).toBe('my-custom-synth');
    });
  });

  describe('package.json merge — dependencies', () => {
    it('adds @cdkx-io/core to dependencies without overwriting existing ones', () => {
      const fs = makeExistingFs();
      const engine = new InitTemplateEngine(fs);
      engine.generate({ dir: '/p', name: 'p', mode: 'existing' });

      const pkg = JSON.parse(fs.written['/p/package.json']);
      expect(pkg.dependencies.lodash).toBe('^4.0.0');
      expect(pkg.dependencies['@cdkx-io/core']).toBe('latest');
    });

    it('adds @cdkx-io/cli, typescript, tsx to devDependencies without overwriting existing ones', () => {
      const fs = makeExistingFs();
      const engine = new InitTemplateEngine(fs);
      engine.generate({ dir: '/p', name: 'p', mode: 'existing' });

      const pkg = JSON.parse(fs.written['/p/package.json']);
      expect(pkg.devDependencies.prettier).toBe('^3.0.0');
      expect(pkg.devDependencies['@cdkx-io/cli']).toBe('latest');
      expect(pkg.devDependencies.typescript).toBeDefined();
      expect(pkg.devDependencies.tsx).toBeDefined();
    });
  });

  describe('cdkx.json', () => {
    it('skips cdkx.json if it already exists and puts it in skipped', () => {
      const fs = makeExistingFs({
        exists: (p) => p === '/p/package.json' || p === '/p/cdkx.json',
      });
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/p',
        name: 'p',
        mode: 'existing',
      });

      expect(result.skipped).toContain('/p/cdkx.json');
      expect(fs.written['/p/cdkx.json']).toBeUndefined();
    });

    it('creates cdkx.json if it does not exist', () => {
      const fs = makeExistingFs();
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/p',
        name: 'p',
        mode: 'existing',
      });

      expect(result.created).toContain('/p/cdkx.json');
      expect(fs.written['/p/cdkx.json']).toBeDefined();
    });
  });

  describe('src/main.ts and tsconfig.json', () => {
    it('skips src/main.ts if it already exists', () => {
      const fs = makeExistingFs({
        exists: (p) => p === '/p/package.json' || p === '/p/src/main.ts',
      });
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/p',
        name: 'p',
        mode: 'existing',
      });

      expect(result.skipped).toContain('/p/src/main.ts');
      expect(fs.written['/p/src/main.ts']).toBeUndefined();
    });

    it('skips tsconfig.json if it already exists', () => {
      const fs = makeExistingFs({
        exists: (p) => p === '/p/package.json' || p === '/p/tsconfig.json',
      });
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/p',
        name: 'p',
        mode: 'existing',
      });

      expect(result.skipped).toContain('/p/tsconfig.json');
      expect(fs.written['/p/tsconfig.json']).toBeUndefined();
    });

    it('writes src/main.ts even if it exists when force is true', () => {
      const fs = makeExistingFs({
        exists: (p) => p === '/p/package.json' || p === '/p/src/main.ts',
      });
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/p',
        name: 'p',
        mode: 'existing',
        force: true,
      });

      expect(result.created).toContain('/p/src/main.ts');
      expect(fs.written['/p/src/main.ts']).toBeDefined();
    });

    it('writes tsconfig.json even if it exists when force is true', () => {
      const fs = makeExistingFs({
        exists: (p) => p === '/p/package.json' || p === '/p/tsconfig.json',
      });
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/p',
        name: 'p',
        mode: 'existing',
        force: true,
      });

      expect(result.created).toContain('/p/tsconfig.json');
      expect(fs.written['/p/tsconfig.json']).toBeDefined();
    });
  });
});

describe('InitTemplateEngine — nx mode', () => {
  function makeNxFs(): InitFileSystem & {
    written: Record<string, string>;
    dirs: string[];
  } {
    const written: Record<string, string> = {};
    const dirs: string[] = [];
    return {
      written,
      dirs,
      exists: () => false,
      mkdir: (path) => dirs.push(path),
      writeFile: (path, content) => {
        written[path] = content;
      },
      readFile: () => '',
    };
  }

  describe('InitResult', () => {
    it('creates 5 files: the 4 from empty mode plus project.json', () => {
      const fs = makeNxFs();
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/ws/packages/infra',
        name: 'infra',
        mode: 'nx',
      });

      expect(result.created).toHaveLength(5);
      expect(result.created).toEqual(
        expect.arrayContaining([
          '/ws/packages/infra/tsconfig.json',
          '/ws/packages/infra/src/main.ts',
          '/ws/packages/infra/package.json',
          '/ws/packages/infra/cdkx.json',
          '/ws/packages/infra/project.json',
        ]),
      );
      expect(result.skipped).toHaveLength(0);
      expect(result.merged).toHaveLength(0);
    });
  });

  describe('src/main.ts and tsconfig.json — skip without --force', () => {
    it('skips src/main.ts if it already exists', () => {
      const fs = makeNxFs();
      fs.exists = (p) => p === '/ws/packages/infra/src/main.ts';
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/ws/packages/infra',
        name: 'infra',
        mode: 'nx',
      });

      expect(result.skipped).toContain('/ws/packages/infra/src/main.ts');
      expect(fs.written['/ws/packages/infra/src/main.ts']).toBeUndefined();
    });

    it('skips tsconfig.json if it already exists', () => {
      const fs = makeNxFs();
      fs.exists = (p) => p === '/ws/packages/infra/tsconfig.json';
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/ws/packages/infra',
        name: 'infra',
        mode: 'nx',
      });

      expect(result.skipped).toContain('/ws/packages/infra/tsconfig.json');
      expect(fs.written['/ws/packages/infra/tsconfig.json']).toBeUndefined();
    });

    it('overwrites src/main.ts when force is true', () => {
      const fs = makeNxFs();
      fs.exists = (p) => p === '/ws/packages/infra/src/main.ts';
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/ws/packages/infra',
        name: 'infra',
        mode: 'nx',
        force: true,
      });

      expect(result.created).toContain('/ws/packages/infra/src/main.ts');
      expect(fs.written['/ws/packages/infra/src/main.ts']).toBeDefined();
    });

    it('overwrites tsconfig.json when force is true', () => {
      const fs = makeNxFs();
      fs.exists = (p) => p === '/ws/packages/infra/tsconfig.json';
      const engine = new InitTemplateEngine(fs);
      const result = engine.generate({
        dir: '/ws/packages/infra',
        name: 'infra',
        mode: 'nx',
        force: true,
      });

      expect(result.created).toContain('/ws/packages/infra/tsconfig.json');
      expect(fs.written['/ws/packages/infra/tsconfig.json']).toBeDefined();
    });
  });

  describe('project.json', () => {
    it('generates project.json with synth, deploy, and destroy nx:run-commands targets', () => {
      const fs = makeNxFs();
      const engine = new InitTemplateEngine(fs);
      engine.generate({ dir: '/ws/packages/infra', name: 'infra', mode: 'nx' });

      const proj = JSON.parse(fs.written['/ws/packages/infra/project.json']);
      expect(proj.name).toBe('infra');
      expect(proj.targets.synth.executor).toBe('nx:run-commands');
      expect(proj.targets.synth.options.command).toBe('cdkx synth');
      expect(proj.targets.synth.options.cwd).toBe('{projectRoot}');
      expect(proj.targets.deploy.executor).toBe('nx:run-commands');
      expect(proj.targets.deploy.options.command).toBe('cdkx deploy');
      expect(proj.targets.destroy.executor).toBe('nx:run-commands');
      expect(proj.targets.destroy.options.command).toBe('cdkx destroy');
    });
  });
});

describe('InitTemplateEngine — directory creation', () => {
  it('creates the target directory before writing files in empty mode', () => {
    const ops: string[] = [];
    const fs: InitFileSystem = {
      exists: () => false,
      mkdir: (path) => ops.push(`mkdir:${path}`),
      writeFile: (path) => ops.push(`write:${path}`),
      readFile: () => '',
    };
    new InitTemplateEngine(fs).generate({
      dir: '/new/path',
      name: 'p',
      mode: 'empty',
    });

    const mkdirIndex = ops.indexOf('mkdir:/new/path');
    const firstWriteIndex = ops.findIndex((o) => o.startsWith('write:'));
    expect(mkdirIndex).toBeGreaterThanOrEqual(0);
    expect(mkdirIndex).toBeLessThan(firstWriteIndex);
  });
});

describe('InitTemplateEngine.detectMode', () => {
  it('returns nx when nx.json is present', () => {
    const result = InitTemplateEngine.detectMode(
      '/project',
      (p) => p === '/project/nx.json',
    );
    expect(result).toBe('nx');
  });

  it('returns existing when package.json is present but not nx.json', () => {
    const result = InitTemplateEngine.detectMode(
      '/project',
      (p) => p === '/project/package.json',
    );
    expect(result).toBe('existing');
  });

  it('returns empty when neither nx.json nor package.json is present', () => {
    const result = InitTemplateEngine.detectMode('/project', () => false);
    expect(result).toBe('empty');
  });
});

describe('InitTemplateEngine.detectPackageManager', () => {
  it('returns yarn when yarn.lock is present', () => {
    const result = InitTemplateEngine.detectPackageManager(
      '/project',
      (p) => p === '/project/yarn.lock',
    );
    expect(result).toBe('yarn');
  });

  it('returns pnpm when pnpm-lock.yaml is present', () => {
    const result = InitTemplateEngine.detectPackageManager(
      '/project',
      (p) => p === '/project/pnpm-lock.yaml',
    );
    expect(result).toBe('pnpm');
  });

  it('returns yarn by default when no lockfile is present', () => {
    const result = InitTemplateEngine.detectPackageManager(
      '/project',
      () => false,
    );
    expect(result).toBe('yarn');
  });
});
