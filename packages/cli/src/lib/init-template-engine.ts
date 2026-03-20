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
}

export interface InitResult {
  readonly created: string[];
  readonly skipped: string[];
  readonly merged: string[];
}

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
    const { dir } = context;
    const created: string[] = [];

    const tsconfigJson = `${dir}/tsconfig.json`;
    this.fs.writeFile(
      tsconfigJson,
      JSON.stringify(
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
      ),
    );
    created.push(tsconfigJson);

    this.fs.mkdir(`${dir}/src`, { recursive: true });
    const mainTs = `${dir}/src/main.ts`;
    this.fs.writeFile(
      mainTs,
      [
        "import { App, Stack } from '@cdkx-io/core';",
        '',
        'const app = new App();',
        "const stack = new Stack(app, 'MyStack');",
        '',
        '// Add your resources here',
        'void stack;',
        '',
        'app.synth();',
      ].join('\n'),
    );
    created.push(mainTs);

    const packageJson = `${dir}/package.json`;
    this.fs.writeFile(
      packageJson,
      JSON.stringify(
        {
          name: context.name,
          version: '0.1.0',
          private: true,
          scripts: {
            synth: 'cdkx synth',
            deploy: 'cdkx deploy',
            destroy: 'cdkx destroy',
          },
          dependencies: {
            '@cdkx-io/core': 'latest',
          },
          devDependencies: {
            '@cdkx-io/cli': 'latest',
            typescript: '^5.0.0',
            tsx: '^4.0.0',
          },
        },
        null,
        2,
      ),
    );
    created.push(packageJson);

    const cdkxJson = `${dir}/cdkx.json`;
    this.fs.writeFile(
      cdkxJson,
      JSON.stringify(
        { app: 'npx tsx src/main.ts', output: 'cdkx.out' },
        null,
        2,
      ),
    );
    created.push(cdkxJson);

    return { created, skipped: [], merged: [] };
  }
}
