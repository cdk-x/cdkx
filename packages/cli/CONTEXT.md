# @cdkx-io/cli — Development Context

This file captures the full design, architecture, and implementation details of
`@cdkx-io/cli` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/cli` is modified — commands,
> interfaces, file structure, conventions, or design decisions — this file must
> be updated in the same change to stay accurate.

---

## What is @cdkx-io/cli?

**@cdkx-io/cli** is the command-line interface for cdkx. It provides developer-facing
commands (`synth`, and future: `deploy`, `diff`, `destroy`) that drive the cdkx
workflow from the terminal.

It is distributed as a standalone npm package with a `cdkx` binary entry point.
It bundles all its dependencies (chalk, commander) via esbuild — there are no
runtime `node_modules` required when installed globally.

---

## Workspace setup

| Property        | Value                                                              |
| --------------- | ------------------------------------------------------------------ |
| Monorepo tool   | Nx 22                                                              |
| Package manager | Yarn (yarn.lock at root)                                           |
| Language        | TypeScript 5.9, strict mode                                        |
| Module format   | **CommonJS** — `"type"` is NOT set in `package.json`               |
| Build tool      | esbuild via `@nx/esbuild` — `bundle: true`, `format: ["cjs"]`      |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                        |
| Linter          | ESLint with `@typescript-eslint`                                   |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)                    |
| Output dir      | `packages/cli/dist/` — `main.js` is the single bundled entry point |

Run tasks via Nx:

```bash
yarn nx lint @cdkx-io/cli
yarn nx test @cdkx-io/cli
yarn nx build @cdkx-io/cli
yarn nx run @cdkx-io/cli:format              # format src/ with prettier
yarn nx run @cdkx-io/cli:format:check        # check formatting without writing
yarn nx run @cdkx-io/cli:build:fixtures      # compile fixtures to dist-fixtures/
yarn nx run @cdkx-io/cli:run                 # build and run the CLI directly
```

---

## Entry point and binary

| File           | Role                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `bin/cdkx.js`  | npm bin shim: `#!/usr/bin/env node` + `require('../dist/main.js')`                                     |
| `src/main.ts`  | CLI entry point. Configures root `Command`, registers subcommands, calls `program.parse(process.argv)` |
| `src/index.ts` | Public barrel — re-exports `src/lib/` and `src/commands/`                                              |

`main.ts` must stay **simple**: only the root command configuration (name,
description, version, banner) and `program.addCommand()` calls. All logic lives
in the command modules.

---

## Architecture

### CJS + esbuild bundle

Unlike `@cdkx-io/core` (ESM), the CLI is **CommonJS**. esbuild inlines all
dependencies (`chalk`, `commander`) into a single `dist/main.js`. Local imports
do NOT need the `.js` extension (TypeScript resolves them), but using `.js` is
acceptable for consistency.

The `package.json` version is read at runtime via:

```ts
const { version } = require('../package.json') as { version: string };
```

This CJS `require()` is safe because esbuild inlines the package.json content.

### Commander

Commands are built with `commander` v14. Each command module creates and exports
a `Command` instance. `main.ts` registers them with `program.addCommand()`.

### Chalk

Chalk v5 (ESM-only upstream, but esbuild handles the interop). Used for colored
terminal output. Color conventions:

| Chalk style        | Used for                             |
| ------------------ | ------------------------------------ |
| `chalk.cyan`       | Decorative elements (banner borders) |
| `chalk.bold.white` | CLI name / headings                  |
| `chalk.dim`        | Secondary info (version, paths)      |
| `chalk.green`      | Success messages                     |
| `chalk.yellow`     | Warnings                             |
| `chalk.red`        | Errors (via `BaseCommand.run()`)     |

---

## BaseCommand — abstract base class

All commands extend `BaseCommand` (`src/lib/base-command.ts`).

```ts
abstract class BaseCommand {
  abstract build(): Command;
  protected async run(fn: () => Promise<void>): Promise<void>;
  protected fail(message: string): never;
}
```

| Member      | Description                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `build()`   | Abstract. Subclasses configure and return the Commander `Command` instance.                                            |
| `run(fn)`   | Executes `fn` inside a try/catch. On error: prints `chalk.red('Error: ...')` and calls `process.exit(1)`.              |
| `fail(msg)` | Throws `new Error(msg)`. Designed to be called inside a `run()` callback so the error is caught and handled uniformly. |

### Command class conventions

Every command class **must** follow this pattern:

```ts
export interface XxxCommandDeps {
  // injectable dependencies (functions, not modules)
  dep1?: (...) => ...;
  dep2?: (...) => ...;
}

export class XxxCommand extends BaseCommand {
  private constructor(private readonly deps: XxxCommandDeps = {}) {
    super();
  }

  /** Factory — used in main.ts and in tests */
  static create(deps?: XxxCommandDeps): Command {
    return new XxxCommand(deps).build();
  }

  build(): Command {
    return new Command('xxx')
      ...
      .action(async (...) => {
        await this.run(() => this.execute(...));
      });
  }

  private async execute(...): Promise<void> {
    // business logic — uses this.fail() for validation errors
  }
}

/** Singleton — registered in main.ts */
export const xxxCommand = XxxCommand.create();
```

Key points:

- **Constructor is `private`** — instantiation only via `static create()`.
- **Dependencies are injected** via the `deps` object (functions, not modules).
  Node built-ins like `existsSync` are imported at the top of the file and used
  as defaults; tests override them with plain functions (no `jest.mock` needed).
- **`build()` captures `this`** in the action closure, giving access to `this.run()`,
  `this.fail()`, and private methods.
- **`xxxCommand` is the singleton** for `main.ts`; `XxxCommand.create(deps)` is
  the factory for tests.

---

## Command structure

```
src/
├── lib/
│   ├── base-command.ts             abstract BaseCommand
│   ├── base-command.spec.ts        tests for run() and fail()
│   └── index.ts                    re-export barrel for src/lib/
├── main.ts                         root command + subcommand registration
├── index.ts                        public barrel (re-exports lib + commands)
└── commands/
    ├── synth/
    │   ├── synth.command.ts        SynthCommand extends BaseCommand
    │   ├── synth.command.spec.ts   tests
    │   └── index.ts                re-export barrel
    └── (future: deploy/, diff/, destroy/, init/)
```

### Adding a new command

1. Create `src/commands/<name>/` with `<name>.command.ts`, `<name>.command.spec.ts`,
   and `index.ts`.
2. Extend `BaseCommand`. Follow the class convention above.
3. Export `xxxCommand` (singleton) from `index.ts`.
4. Import and register in `main.ts` via `program.addCommand(xxxCommand)`.
5. Re-export from `src/index.ts` if part of the public API.
6. Update this CONTEXT.md.

---

## Command: `synth`

### Usage

```
cdkx synth

Options:
  -c, --config <file>   Path to cdkx.json config file (default: "cdkx.json")
  -o, --output <dir>    Override output directory
  -h, --help            Display help for command
```

### `cdkx.json` config file

The user creates a `cdkx.json` in their project root:

```json
{
  "app": "node path/to/compiled/app.js",
  "output": "cdkx.out"
}
```

| Field    | Required | Description                                                    |
| -------- | -------- | -------------------------------------------------------------- |
| `app`    | yes      | Shell command to run the user's compiled app                   |
| `output` | no       | Output directory for synthesis artifacts (default: `cdkx.out`) |

The user controls their own toolchain — `app` can be `node app.js`, `tsx app.ts`,
`ts-node app.ts`, etc.

### Behaviour

1. Resolve the `--config` option (default `cdkx.json`) to an absolute path relative
   to `process.cwd()`.
2. Validate the config file exists via `existsSync`; call `this.fail()` with a hint
   to run `cdkx init` if not found.
3. Parse the config JSON via `readConfig`.
4. Validate `config.app` is present; call `this.fail()` if missing.
5. Compute `outputDir` from `--output` flag > `config.output` > `'cdkx.out'` (priority order).
6. Set `CDKX_OUT_DIR=<outputDir>` in the subprocess environment.
7. Spawn `config.app` as a subprocess via `spawnApp` (uses `spawnSync` with `shell: true`).
8. If exit code is non-zero, call `this.fail()` with the exit code and stderr/stdout detail.
9. Print `chalk.green('✔') + ' Synthesis complete — output written to ' + chalk.dim(outputDir)`.

### Injectable dependencies (`SynthCommandDeps`)

| Dep          | Default             | Purpose                               |
| ------------ | ------------------- | ------------------------------------- |
| `existsSync` | `fs.existsSync`     | Checks if the config file exists      |
| `readConfig` | `defaultReadConfig` | Reads and parses `cdkx.json`          |
| `spawnApp`   | `defaultSpawnApp`   | Spawns the user's app as a subprocess |

**`defaultSpawnApp`** splits `cmd` on spaces to get `[bin, ...args]` and calls
`spawnSync(bin, args, { shell: true, stdio: pipe })`.

**`SpawnResult`** — `{ status: number | null, stderr: string, stdout: string }`.

### Tests

`src/commands/synth/synth.command.spec.ts` — 12 unit tests:

- Metadata: command name, description, `--config` option default, `--output` option.
- Happy path: success log message, `CDKX_OUT_DIR` set correctly.
- Config file not found → exit 1 with "cdkx.json not found" message.
- Missing `app` field → exit 1 with "'app' field is required" message.
- `spawnApp` returns non-zero status → exit 1 with "App exited with code" message.
- `--output` flag overrides config output.
- `--config` flag points to alternate config path.

**Testing pattern:** `SynthCommand.create({ existsSync: ..., readConfig: ..., spawnApp: ... })`
creates a fresh `Command` per test with injected dependencies. No `jest.mock`,
no module-level state.

**Important:** `parseAsync` calls omit the command name — since `create()` returns
the `synth` subcommand directly, tests call `cmd.parseAsync(['node', 'cdkx'])`.

---

## Test structure

```
test/
├── fixtures/
│   └── simple-app/
│       └── src/
│           └── main.ts          Real cdkx app — App + 2 Stacks + ProviderResources + Lazy
├── helpers/
│   ├── index.ts                 barrel (NOT re-exported from src/index.ts)
│   └── cli-helpers.ts           CliHelpers — tmpDir, readJson, buildFixture, writeConfig, runCli
└── integration/
    └── synth.spec.ts            16 E2E integration tests
```

### `CliHelpers` (`test/helpers/cli-helpers.ts`)

Static utility class for integration tests. **Not** exported from `src/index.ts`.

| Method                     | Description                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| `tmpDir()`                 | Creates a unique OS temp dir per test (`mkdtempSync`)                  |
| `readJson(filePath)`       | Reads and parses a JSON file                                           |
| `buildFixture(outDir)`     | Compiles the simple-app fixture with `esbuild.buildSync`; returns path |
| `writeConfig(dir, config)` | Writes `cdkx.json` into the given directory                            |
| `runCli(args, cwd)`        | Runs `node dist/main.js` via `spawnSync`; returns `RunResult`          |

`CLI_BUNDLE` resolves to `packages/cli/dist/main.js` (3 levels up from
`test/helpers/`). The `test` target has `dependsOn: ["build"]` so the bundle
is always fresh before tests run.

`SIMPLE_APP_FIXTURE` resolves to `test/fixtures/simple-app/src/main.ts`.
`buildFixture()` compiles it with esbuild (`bundle: true`, `platform: node`,
`format: cjs`) into `<tmpDir>/app.js`.

### Integration tests (`test/integration/synth.spec.ts`)

16 tests across these groups:

- **Happy path** — fixture compiles, `cdkx synth` exits 0, success message printed.
- **Manifest** — `manifest.json` exists, has correct version/provider/artifact keys.
- **Stack output** — stack JSON files exist with correct resource shapes.
- **`--output` flag** — overrides output directory, artifacts land in correct dir.
- **Error cases** — missing `cdkx.json` → exit 1; missing `app` field → exit 1;
  app exits non-zero → exit 1 with detail; `--config` points to alternate file.

---

## Fixtures

### `simple-app` (`test/fixtures/simple-app/src/main.ts`)

A real cdkx app used by integration tests. Imports from `@cdkx-io/core`.

- Creates an `App`
- Creates two `Stack`s (`StackA`, `StackB`) each with a `SimpleProvider`
- Adds `ProviderResource` instances with `Lazy` tokens
- Calls `app.synth()`

The fixture is compiled at test runtime by `CliHelpers.buildFixture()` using
esbuild — no pre-compilation step required for tests.

### `build:fixtures` Nx target

```json
"build:fixtures": {
  "executor": "@nx/esbuild:esbuild",
  "outputs": ["{projectRoot}/dist-fixtures"],
  "options": {
    "entryPoints": ["packages/cli/test/fixtures/simple-app/src/main.ts"],
    "outputPath": "packages/cli/dist-fixtures/simple-app",
    "bundle": true,
    "platform": "node",
    "format": ["cjs"]
  }
}
```

Compiles fixtures to `dist-fixtures/` for **manual** use with `cdkx synth` from
the workspace root. `dist-fixtures/` is gitignored.

---

## ESLint configuration (`eslint.config.mjs`)

Key rules:

- `dist-fixtures/**` is ignored (compiled output, not source).
- `test/**/*` is in `@nx/dependency-checks` `ignoredFiles` — test helpers
  use `esbuild` and `@cdkx-io/core` as dev deps, which should not be required in
  `dependencies`.

---

## Coding conventions

| Rule                       | Detail                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------ |
| Module format              | CJS — esbuild handles bundling. Local imports: `.js` extension is fine.                                |
| No `any`                   | Use `unknown`. Exception: `require('../package.json') as { version: string }` cast is fine.            |
| Prettier                   | Run `yarn nx run @cdkx-io/cli:format` after writing or modifying any `.ts` file.                         |
| Specs co-located           | `foo/foo.command.spec.ts` lives next to `foo/foo.command.ts`.                                          |
| OOP — all logic in classes | No standalone `export function`. Commands extend `BaseCommand`. Utilities go in classes in `src/lib/`. |
| Error handling             | Always use `this.run()` + `this.fail()`. Never call `process.exit()` directly in command logic.        |
| `process.exit` in tests    | Mock with `jest.spyOn(process, 'exit').mockImplementation((() => undefined) as () => never)`.          |
| Dependency injection       | Node built-ins used in commands are injected via `deps` — no `jest.mock('fs', ...)` in tests.          |

---

## Key gotchas

### 1. `build()` captures `this` via arrow function in `.action()`

```ts
.action(async (options) => {
  await this.run(() => this.execute(options));
});
```

Arrow functions in `.action()` preserve the class instance's `this`. Do NOT use
`function` keyword here — it would lose `this`.

### 2. Constructor is `private` — only `static create()` instantiates

This enforces that the `Command` is always returned by `create()`, not a raw
class instance. `main.ts` and tests both use `XxxCommand.create(deps?)`.

### 3. `require('../package.json')` in main.ts

esbuild inlines the package.json at bundle time. This is intentional and not a
problem — do not change it to a static ESM import.

### 4. `bundle: true` means future `@cdkx-io/core` will be inlined

When `@cdkx-io/core` is added as a production dependency in the future, esbuild
will bundle it into `dist/main.js`. This is intentional — the CLI is self-contained.
That is also why `updateDependents: "never"` is set in the release config.

### 5. chalk v5 requires `transformIgnorePatterns` in Jest

chalk v5 is ESM-only. Jest (CJS mode with SWC) cannot process it from
`node_modules` by default. `jest.config.cts` adds:

```js
transformIgnorePatterns: [
  'node_modules/(?!(chalk|#ansi-styles|ansi-styles)/)',
],
```

Any future ESM-only `node_modules` dependency must be added to this pattern.

### 6. `parseAsync` in unit tests omits the subcommand name

`SynthCommand.create()` returns the `synth` `Command` directly. Tests call:

```ts
await cmd.parseAsync(['node', 'cdkx']);
// NOT ['node', 'cdkx', 'synth'] — that would cause "too many arguments"
```

### 7. `console.error` must be spied in unit tests

`BaseCommand.run()` writes errors to `console.error`. Tests that assert
`exitSpy` was NOT called must spy on `console.error` to suppress noise and
prevent the test output from being polluted.

### 8. `test/**` excluded from `tsconfig.lib.json`

The build tsconfig excludes `test/**/*` so the esbuild executor doesn't
pick up fixture files that import `@cdkx-io/core` with ESM types incompatible
with the CLI's `moduleResolution: nodenext` build config.

### 9. `test/**` included in `tsconfig.spec.json`

The Jest tsconfig explicitly includes `test/**/*.ts` so SWC can
type-check helpers and integration tests during test runs.

### 10. `defaultSpawnApp` splits on spaces

`defaultSpawnApp` splits `cmd` on a single space to extract `[bin, ...args]`.
Commands with arguments containing spaces must quote them. The `shell: true`
option is set so the platform shell handles more complex command strings if needed.

---

## File map

```
packages/cli/
├── bin/
│   └── cdkx.js                                npm bin shim
├── package.json                               name: @cdkx-io/cli, type: (none — CJS)
├── project.json                               Nx project configuration
├── eslint.config.mjs                          ESLint config (dist-fixtures ignored, test in ignoredFiles)
├── tsconfig.lib.json                          excludes test/**/*
├── tsconfig.spec.json                         includes test/**/*.ts
├── CONTEXT.md                                 ← this file
└── src/
    ├── index.ts                               public barrel (re-exports lib + commands)
    ├── main.ts                                CLI entry point
    ├── lib/
    │   ├── base-command.ts                    abstract BaseCommand class
    │   ├── base-command.spec.ts               tests for run() and fail()
    │   └── index.ts                           lib barrel
    ├── commands/
    │   └── synth/
    │       ├── synth.command.ts               SynthCommand (reads cdkx.json, spawns subprocess)
    │       ├── synth.command.spec.ts          12 unit tests
    │       └── index.ts                       re-export barrel
    └── test/
        ├── fixtures/
        │   └── simple-app/
        │       └── src/
        │           └── main.ts               Real cdkx app fixture
        ├── helpers/
        │   ├── index.ts                      test helpers barrel
        │   └── cli-helpers.ts               CliHelpers class
        └── integration/
            └── synth.spec.ts                16 E2E integration tests
```

Also relevant:

```
packages/cli/dist/main.js                      compiled CLI bundle (built, not committed)
packages/cli/dist-fixtures/                    compiled fixtures for manual use (gitignored)
cdkx.json                                      workspace-root manual test config (gitignored)
cdkx.out/                                      workspace-root synthesis output (gitignored)
```

---

## Release configuration

Part of the `cli` release group in `nx.json`. Released independently from
`@cdkx-io/core`. Tag pattern: `cli-v{version}`. See `packages/core/CONTEXT.md`
for the full release configuration documentation.
