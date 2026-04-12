# @cdk-x/ssh-runtime

Deployment runtime for SSH resources. Implements `ProviderRuntime` from `@cdk-x/core` and bridges the cdkx engine to real SSH operations.

## Architecture

```
SshRuntimeAdapterFactory
├── SshSdkFactory → SshSdk
├── SshRuntimeContext (sdk + logger)
├── SshProviderRuntime (registers handlers)
└── RuntimeAdapter<SshSdk>
```

## Role

- Implements `ResourceHandler` subclasses for each SSH resource type
- Registers handlers in `SshProviderRuntime`
- Exposes `SshRuntimeAdapterFactory` as the entry point for the engine

## Relationship with other packages

| Package | Relationship |
|---|---|
| `@cdk-x/core` | Implements `ProviderRuntime`, uses `ResourceHandler` base |
| `@cdk-x/engine` | Engine instantiates the runtime via `SshRuntimeAdapterFactory` |
| `@cdk-x/ssh` | Reads `RUNTIME_CONFIGS` to know resource types |
| `@cdk-x/ssh-sdk` | Uses `SshSdk` facade inside handlers |

## Adding a Handler

1. Create `src/lib/handlers/<name>/`
   - `<name>-handler.ts` — implements `ResourceHandler<Props, State, SshSdk>`
   - `<name>-handler.spec.ts` — tests
   - `index.ts` — export
2. Register in `SshProviderRuntime`

## Conventions

- camelCase props → SSH API calls (explicit mapping per handler)
- DI via constructor deps (no `jest.mock`)
- Structured logging: `ctx.logger.info('ssh.handler.<name>.<action>', { ... })`
