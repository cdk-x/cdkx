# @cdk-x/multipass-runtime

## Role

Deployment runtime for Multipass VMs. Implements the `ResourceHandler` / `ProviderRuntime` / `ProviderAdapterFactory` contracts from `@cdk-x/engine` so that `cdkx deploy` and `cdkx destroy` can manage `Multipass::Compute::Instance` resources.

## Architecture

```
MultipassRuntimeAdapterFactory  (ProviderAdapterFactory)
  └── creates RuntimeAdapter
        ├── MultipassProviderRuntime  (ProviderRuntime<MultipassCli>)
        │     └── MultipassInstanceHandler  (ResourceHandler)
        └── MultipassRuntimeContext  (RuntimeContext<MultipassCli>)
              └── MultipassCli  (from @cdk-x/multipass-sdk)
```

### Key classes

| Class | Responsibility |
|---|---|
| `MultipassRuntimeAdapterFactory` | Entry point. Calls `checkInstalled()` synchronously at construction; exported as `AdapterFactory` for `PluginManager`. |
| `MultipassProviderRuntime` | Registers handlers by resource type string. |
| `MultipassInstanceHandler` | Maps `create/get/delete` lifecycle to `MultipassCli` calls. No `update` — all props are `createOnly`. |
| `MultipassRuntimeContext` | Concrete `RuntimeContext<MultipassCli>` carrying the CLI facade and logger. |

## Relationships

- Depends on `@cdk-x/core` (base classes), `@cdk-x/engine` (RuntimeAdapter, ProviderAdapterFactory), `@cdk-x/multipass` (RUNTIME_CONFIGS), `@cdk-x/multipass-sdk` (MultipassCli).
- Registered in `PluginManager.PROVIDER_PACKAGES` in `@cdk-x/engine` under the key `'multipass'`.
- Exported `AdapterFactory` name is the contract that `PluginManager` uses to instantiate the factory via dynamic `require()`.
