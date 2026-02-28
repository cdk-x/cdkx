# @cdk-x/hetzner — Development Context

This file captures the full design, architecture, and implementation details of
`@cdk-x/hetzner` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/providers/hetzner` is
> modified — classes, interfaces, file structure, conventions, or design
> decisions — this file must be updated in the same change to stay accurate.

---

## What is @cdk-x/hetzner?

**@cdk-x/hetzner** is the Hetzner Cloud provider package for cdkx. It extends
`@cdk-x/core` to allow synthesizing Hetzner Cloud resource manifests from a
construct tree.

Users attach a `HetznerProvider` to a `Stack` and add `NtvHetznerXxx` L1
constructs (or future L2 constructs) to that stack. Calling `app.synth()`
produces a JSON file describing the Hetzner Cloud resources.

---

## Workspace setup

| Property        | Value                                                       |
| --------------- | ----------------------------------------------------------- |
| Monorepo tool   | Nx 22                                                       |
| Package manager | Yarn (yarn.lock at root)                                    |
| Language        | TypeScript 5.9, strict mode, ESM (`"type": "module"`)       |
| Build tool      | `@nx/js:tsc` — emits JS + `.d.ts` + `.d.ts.map`             |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                 |
| Linter          | ESLint with `@typescript-eslint`                            |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)             |
| Node            | ESM — all local imports use `.js` extension                 |
| Output dir      | `packages/providers/hetzner/dist/` — JS + type declarations |

Run tasks via Nx:

```bash
yarn nx lint @cdk-x/hetzner
yarn nx test @cdk-x/hetzner
yarn nx build @cdk-x/hetzner
yarn nx run @cdk-x/hetzner:format        # format src/ with prettier
yarn nx run @cdk-x/hetzner:format:check  # check formatting without writing
```

---

## Package identity

| Field         | Value                                            |
| ------------- | ------------------------------------------------ |
| `name`        | `@cdk-x/hetzner`                                 |
| `version`     | `0.0.1` (lock-stepped with `core` release group) |
| Release group | `core` (fixed versioning, tag `core-v{version}`) |

---

## Architecture

```
Stack (provider: HetznerProvider)
 └── NtvHetznerServer  (L1 — future)
 └── NtvHetznerVolume  (L1 — future)
 └── ...
```

`HetznerProvider` extends `Provider` from `@cdk-x/core`. It:

- Sets `identifier = 'hetzner'`
- (Future) overrides `getResolvers()` to add Hetzner-specific resolvers
- (Future) overrides `getSynthesizer()` to use a Hetzner-specific synthesizer
- (Future) overrides `getEnvironment()` to expose `project` and `datacenter`

---

## Class inventory

### `HetznerProvider` (`src/lib/hetzner.ts`)

Extends `Provider`.

| Member               | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `identifier: string` | `'hetzner'` — used in `manifest.json` `provider` field |

Constructor accepts `HetznerProviderProps` (future — credentials, project, datacenter).

---

## Coding conventions

Identical to `@cdk-x/core`. Key points:

| Rule             | Detail                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| Everything OOP   | No standalone `export function`. All utilities are static methods on classes.      |
| No `any`         | Use `unknown` everywhere.                                                          |
| ESM imports      | All local imports use `.js` extension even though source is `.ts`.                 |
| Prettier         | Run `yarn nx run @cdk-x/hetzner:format` after writing or modifying any `.ts` file. |
| Specs co-located | `foo/foo.spec.ts` lives next to `foo/foo.ts`.                                      |
| Test helpers     | `test/helpers/` — not exported from the public barrel (`src/index.ts`).            |

---

## File map

```
packages/providers/hetzner/
├── package.json                  name: @cdk-x/hetzner, type: module
├── project.json                  Nx project configuration
├── CONTEXT.md                    ← this file
├── src/
│   ├── index.ts                  public barrel
│   └── lib/
│       ├── hetzner.ts            HetznerProvider class
│       └── hetzner.spec.ts       unit tests
└── test/                         (future integration tests)
```

---

## Release configuration

Part of the `core` release group in `nx.json`. Released in lock-step with
`@cdk-x/core` and `@cdk-x/testing`. Tag pattern: `core-v{version}`. See
`packages/core/CONTEXT.md` for full release configuration documentation.
