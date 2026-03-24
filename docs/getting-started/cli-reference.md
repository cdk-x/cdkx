# CLI Reference

The `cdkx` CLI has four commands. All commands read a `cdkx.json` configuration file from the current directory by default.

## Global options

| Option | Description |
|--------|-------------|
| `-V, --version` | Print the installed version |
| `-h, --help` | Show help for any command |

---

## `cdkx init`

Scaffold a new cdkx project. Detects the environment (empty directory, existing Node project, or Nx workspace) and generates the appropriate files.

```bash
cdkx init [directory] [options]
```

**What it does:**

- Creates `cdkx.json`, `src/main.ts`, `tsconfig.json`, and `package.json`
- Merges `package.json` non-destructively when an existing project is detected
- Adds `synth`, `deploy`, `destroy` scripts to `package.json`
- Runs the detected package manager's `install` automatically

**Arguments:**

| Argument | Description |
|----------|-------------|
| `[directory]` | Target directory. Defaults to the current directory. |

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `--name <name>` | directory basename | Project name written into `package.json` |
| `--mode <mode>` | auto-detected | Force `empty`, `existing`, or `nx` mode |
| `--package-manager <pm>` | auto-detected | Force `yarn`, `npm`, or `pnpm` |
| `--force` | `false` | Overwrite existing `src/main.ts` and `tsconfig.json` |
| `--no-install` | — | Skip the automatic package install step |

**Examples:**

=== "New project"

    ```bash
    cdkx init my-project
    cd my-project
    ```

=== "Current directory"

    ```bash
    mkdir my-project && cd my-project
    cdkx init
    ```

=== "Existing Node project"

    ```bash
    # Inside an existing project with package.json
    cdkx init --mode existing
    ```

=== "Nx workspace"

    ```bash
    # Inside an Nx workspace — also generates project.json
    cdkx init packages/my-infra --mode nx
    ```

**Output:**

```
✔ Created /my-project/tsconfig.json
✔ Created /my-project/src/main.ts
✔ Created /my-project/package.json
✔ Created /my-project/cdkx.json
  Running yarn install...
✔ Done. Run 'cdkx synth' to get started.
```

---

## `cdkx synth`

Runs your app and synthesizes the cloud assembly into the output directory.

```bash
cdkx synth [options]
```

**What it does:**

1. Reads `cdkx.json` to find your app command
2. Runs the app with `CDKX_OUT_DIR` injected into the environment
3. Writes `manifest.json` and one `<StackId>.json` per stack to the output directory

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `-c, --config <file>` | `cdkx.json` | Path to the config file |
| `-o, --output <dir>` | value from `cdkx.json`, or `cdkx.out` | Override the output directory |

**Examples:**

=== "Default"

    ```bash
    cdkx synth
    ```

=== "Custom config"

    ```bash
    cdkx synth --config infra/cdkx.json
    ```

=== "Custom output"

    ```bash
    cdkx synth --output dist/assembly
    ```

**Output:**

```
✔ Synthesis complete — output written to cdkx.out
```

---

## `cdkx deploy`

Reads the synthesized cloud assembly and deploys all stacks to the target provider.

```bash
cdkx deploy [options]
```

**What it does:**

1. Reads the cloud assembly from the output directory
2. Resolves cross-resource references (`{ ref, attr }` tokens)
3. Builds a dependency graph and deploys resources in topological order
4. Prints a live event table to the console

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `-c, --config <file>` | `cdkx.json` | Path to the config file |
| `-o, --output <dir>` | value from `cdkx.json`, or `cdkx.out` | Override the assembly directory |

**Examples:**

=== "Default"

    ```bash
    cdkx deploy
    ```

=== "Custom assembly dir"

    ```bash
    cdkx deploy --output dist/assembly
    ```

**Output:**

```
MyStack  Hetzner::Networking::Network  NetworkA1B2C3D4  CREATE_IN_PROGRESS
MyStack  Hetzner::Networking::Network  NetworkA1B2C3D4  CREATED
MyStack  Hetzner::Networking::Subnet   SubnetE5F6G7H8   CREATE_IN_PROGRESS
MyStack  Hetzner::Networking::Subnet   SubnetE5F6G7H8   CREATED
```

!!! note "State file"
    cdkx writes deployment state to `.cdkx/` next to `cdkx.json`. Add `.cdkx/` to your `.gitignore` if you do not want to commit it.

---

## `cdkx destroy`

Destroys all resources in the cloud assembly in reverse dependency order.

```bash
cdkx destroy [options]
```

**What it does:**

1. Reads the cloud assembly from the output directory
2. Prompts for confirmation (unless `--force` is set)
3. Deletes resources in reverse topological order
4. Waits for each deletion action to complete before proceeding

**Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `-c, --config <file>` | `cdkx.json` | Path to the config file |
| `-o, --output <dir>` | value from `cdkx.json`, or `cdkx.out` | Override the assembly directory |
| `--force` | `false` | Skip the confirmation prompt |

**Examples:**

=== "Interactive"

    ```bash
    cdkx destroy
    # ⚠️  WARNING: This will destroy all resources in the cloud assembly.
    # Are you sure you want to continue? (y/N):
    ```

=== "Non-interactive (CI)"

    ```bash
    cdkx destroy --force
    ```

**Output:**

```
MyStack  Hetzner::Networking::Subnet   SubnetE5F6G7H8   DELETE_IN_PROGRESS
MyStack  Hetzner::Networking::Subnet   SubnetE5F6G7H8   DELETE_COMPLETE
MyStack  Hetzner::Networking::Network  NetworkA1B2C3D4  DELETE_IN_PROGRESS
MyStack  Hetzner::Networking::Network  NetworkA1B2C3D4  DELETE_COMPLETE
✔ All resources destroyed
```

!!! warning "Irreversible"
    Destroy permanently deletes cloud resources. Use `--force` only in environments where you are certain about the target.

---

## `cdkx.json` reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `app` | `string` | Yes | Command to run your app (e.g. `npx ts-node my-app.ts`) |
| `output` | `string` | No | Output directory for the cloud assembly. Default: `cdkx.out` |

```json title="cdkx.json"
{
  "app": "npx ts-node my-app.ts",
  "output": "cdkx.out"
}
```
