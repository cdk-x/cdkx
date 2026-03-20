export type InitMode = 'empty' | 'existing' | 'nx';
export type PackageManager = 'yarn' | 'npm' | 'pnpm';

export interface InitFileSystem {
  exists(path: string): boolean;
  mkdir(path: string, options: { recursive: boolean }): void;
  writeFile(path: string, content: string): void;
  readFile(path: string): string;
}

export interface InitContext {
  readonly dir: string;
  readonly name: string;
  readonly mode: InitMode;
  readonly force?: boolean;
}

export interface InitResult {
  readonly created: string[];
  readonly skipped: string[];
  readonly merged: string[];
}

// ─── Templates ────────────────────────────────────────────────────────────────

const CDKX_SCRIPTS = {
  synth: 'cdkx synth',
  deploy: 'cdkx deploy',
  destroy: 'cdkx destroy',
} as const;

const CDKX_DEPENDENCIES = {
  '@cdkx-io/core': 'latest',
} as const;

const CDKX_DEV_DEPENDENCIES = {
  '@cdkx-io/cli': 'latest',
  typescript: '^5.0.0',
  tsx: '^4.0.0',
} as const;

// ─── InitTemplateEngine ───────────────────────────────────────────────────────

export class InitTemplateEngine {
  constructor(private readonly fs: InitFileSystem) {}

  static detectMode(dir: string, exists: (p: string) => boolean): InitMode {
    if (exists(`${dir}/nx.json`)) return 'nx';
    if (exists(`${dir}/package.json`)) return 'existing';
    return 'empty';
  }

  static detectPackageManager(
    dir: string,
    exists: (p: string) => boolean,
  ): PackageManager {
    if (exists(`${dir}/yarn.lock`)) return 'yarn';
    if (exists(`${dir}/pnpm-lock.yaml`)) return 'pnpm';
    return 'yarn';
  }

  generate(context: InitContext): InitResult {
    if (context.mode === 'existing') {
      return this.generateExisting(context);
    }
    if (context.mode === 'nx') {
      return this.generateNx(context);
    }
    return this.generateEmpty(context);
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private generateEmpty(context: InitContext): InitResult {
    const { dir } = context;
    const created: string[] = [];

    const tsconfigJson = `${dir}/tsconfig.json`;
    this.fs.writeFile(tsconfigJson, this.tsconfigContent());
    created.push(tsconfigJson);

    this.fs.mkdir(`${dir}/src`, { recursive: true });
    const mainTs = `${dir}/src/main.ts`;
    this.fs.writeFile(mainTs, this.mainTsContent());
    created.push(mainTs);

    const packageJson = `${dir}/package.json`;
    this.fs.writeFile(packageJson, this.packageJsonContent(context.name));
    created.push(packageJson);

    const cdkxJson = `${dir}/cdkx.json`;
    this.fs.writeFile(cdkxJson, this.cdkxJsonContent());
    created.push(cdkxJson);

    return { created, skipped: [], merged: [] };
  }

  private generateExisting(context: InitContext): InitResult {
    const { dir, force } = context;
    const created: string[] = [];
    const skipped: string[] = [];
    const merged: string[] = [];

    // tsconfig.json — skip unless force
    const tsconfigJson = `${dir}/tsconfig.json`;
    if (!this.fs.exists(tsconfigJson) || force) {
      this.fs.writeFile(tsconfigJson, this.tsconfigContent());
      created.push(tsconfigJson);
    } else {
      skipped.push(tsconfigJson);
    }

    // src/main.ts — skip unless force
    this.fs.mkdir(`${dir}/src`, { recursive: true });
    const mainTs = `${dir}/src/main.ts`;
    if (!this.fs.exists(mainTs) || force) {
      this.fs.writeFile(mainTs, this.mainTsContent());
      created.push(mainTs);
    } else {
      skipped.push(mainTs);
    }

    // package.json — always merge
    const packageJson = `${dir}/package.json`;
    const existing = JSON.parse(this.fs.readFile(packageJson)) as Record<
      string,
      unknown
    >;
    const mergedPkg = this.mergePackageJson(existing);
    this.fs.writeFile(packageJson, JSON.stringify(mergedPkg, null, 2));
    merged.push(packageJson);

    // cdkx.json — skip if exists
    const cdkxJson = `${dir}/cdkx.json`;
    if (!this.fs.exists(cdkxJson)) {
      this.fs.writeFile(cdkxJson, this.cdkxJsonContent());
      created.push(cdkxJson);
    } else {
      skipped.push(cdkxJson);
    }

    return { created, skipped, merged };
  }

  private generateNx(context: InitContext): InitResult {
    const { dir, name } = context;
    const result = this.generateEmpty(context);

    const projectJson = `${dir}/project.json`;
    this.fs.writeFile(projectJson, this.projectJsonContent(name));

    return {
      created: [...result.created, projectJson],
      skipped: [],
      merged: [],
    };
  }

  private mergePackageJson(existing: Record<string, unknown>): unknown {
    const existingScripts =
      (existing.scripts as Record<string, string> | undefined) ?? {};
    const existingDeps =
      (existing.dependencies as Record<string, string> | undefined) ?? {};
    const existingDevDeps =
      (existing.devDependencies as Record<string, string> | undefined) ?? {};

    return {
      ...existing,
      scripts: { ...CDKX_SCRIPTS, ...existingScripts },
      dependencies: { ...CDKX_DEPENDENCIES, ...existingDeps },
      devDependencies: { ...CDKX_DEV_DEPENDENCIES, ...existingDevDeps },
    };
  }

  private tsconfigContent(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'commonjs',
          moduleResolution: 'node',
          strict: true,
          esModuleInterop: true,
          outDir: 'dist',
          rootDir: 'src',
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist'],
      },
      null,
      2,
    );
  }

  private mainTsContent(): string {
    return [
      "import { App, Stack } from '@cdkx-io/core';",
      '',
      'const app = new App();',
      "const stack = new Stack(app, 'MyStack');",
      '',
      '// Add your resources here',
      'void stack;',
      '',
      'app.synth();',
    ].join('\n');
  }

  private packageJsonContent(name: string): string {
    return JSON.stringify(
      {
        name,
        version: '0.1.0',
        private: true,
        scripts: { ...CDKX_SCRIPTS },
        dependencies: { ...CDKX_DEPENDENCIES },
        devDependencies: { ...CDKX_DEV_DEPENDENCIES },
      },
      null,
      2,
    );
  }

  private cdkxJsonContent(): string {
    return JSON.stringify(
      { app: 'npx tsx src/main.ts', output: 'cdkx.out' },
      null,
      2,
    );
  }

  private projectJsonContent(name: string): string {
    return JSON.stringify(
      {
        name,
        targets: {
          synth: {
            executor: 'nx:run-commands',
            options: { command: 'cdkx synth', cwd: '{projectRoot}' },
          },
          deploy: {
            executor: 'nx:run-commands',
            options: { command: 'cdkx deploy', cwd: '{projectRoot}' },
          },
          destroy: {
            executor: 'nx:run-commands',
            options: { command: 'cdkx destroy', cwd: '{projectRoot}' },
          },
        },
      },
      null,
      2,
    );
  }
}
