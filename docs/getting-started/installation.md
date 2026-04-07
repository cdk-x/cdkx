# Installation

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18+ |
| npm / yarn / pnpm | any |

## 1. Install the CLI

```bash
npm install -g @cdk-x/cli
```

Verify it works:

```bash
cdkx --version
```

## 2. Create a new project

```bash
cdkx init my-project
```

`cdkx init` detects your environment and scaffolds the project automatically: // (1)

```
✔ Created /my-project/tsconfig.json
✔ Created /my-project/src/main.ts
✔ Created /my-project/package.json
✔ Created /my-project/cdkx.json
  Running yarn install...
✔ Done. Run 'cdkx synth' to get started.
```

The generated files:

=== "src/main.ts"

    ```typescript
    import { App, Stack } from '@cdk-x/core';

    const app = new App();
    const stack = new Stack(app, 'MyStack');

    // Add your resources here
    void stack;

    app.synth();
    ```

=== "cdkx.json"

    ```json
    {
      "app": "npx tsx src/main.ts",
      "output": "cdkx.out"
    }
    ```

=== "package.json"

    ```json
    {
      "name": "my-project",
      "version": "0.1.0",
      "scripts": {
        "synth": "cdkx synth",
        "deploy": "cdkx deploy",
        "destroy": "cdkx destroy"
      },
      "dependencies": {
        "@cdk-x/core": "latest"
      },
      "devDependencies": {
        "@cdk-x/cli": "latest",
        "typescript": "^5.0.0",
        "tsx": "^4.0.0"
      }
    }
    ```

!!! tip "Init modes"
    `cdkx init` automatically detects the context:

    - **Empty directory** — creates all files from scratch
    - **Existing Node project** — merges `package.json`, skips files that already exist
    - **Nx workspace** — also creates a `project.json` with synth/deploy/destroy targets

## 3. Add a provider

The core package provides the construct primitives. To deploy real infrastructure, add a provider:

```bash
# Hetzner Cloud
npm install @cdk-x/hetzner
```

Each provider has its own setup guide with credentials and examples. See [Providers](../providers/hetzner/index.md).

## 4. Init options

| Option | Description |
|--------|-------------|
| `[directory]` | Target directory (defaults to current directory) |
| `--name <name>` | Project name (defaults to directory name) |
| `--mode <mode>` | Force a mode: `empty`, `existing`, or `nx` |
| `--package-manager <pm>` | Force a package manager: `yarn`, `npm`, or `pnpm` |
| `--force` | Overwrite existing `src/main.ts` and `tsconfig.json` |
| `--no-install` | Skip the automatic package install step |

## What's next

[Write your first stack :material-arrow-right:](first-stack.md){ .md-button .md-button--primary }
