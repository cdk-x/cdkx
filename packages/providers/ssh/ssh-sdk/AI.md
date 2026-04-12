# @cdk-x/ssh-sdk

Raw SSH client library for the cdkx SSH provider. Provides a low-level facade over SSH connections used by `@cdk-x/ssh-runtime` to execute remote commands and manage SSH resources.

## Role

- Thin wrapper over the underlying SSH transport (e.g. `ssh2`)
- Exposes a typed client API consumed exclusively by `@cdk-x/ssh-runtime`
- No CDK constructs — this package contains no `ProviderResource` subclasses

## Relationship with other packages

| Package | Relationship |
|---|---|
| `@cdk-x/ssh-runtime` | Imports `SshSdk` to drive resource handlers |
| `@cdk-x/ssh` | No direct dependency |
| `@cdk-x/core` | No dependency |

## Conventions

- camelCase methods map to underlying SSH operations
- All public API is exported from `src/index.ts`
