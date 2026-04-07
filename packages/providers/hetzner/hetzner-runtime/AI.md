# @cdk-x/hetzner-runtime

Deployment runtime for Hetzner Cloud resources. Implements `ProviderRuntime` from `@cdk-x/core`.

## Architecture

```
HetznerRuntimeAdapterFactory
├── HetznerSdkFactory → HetznerSdk
├── HetznerRuntimeContext (sdk + logger)
├── HetznerProviderRuntime (registers handlers)
└── RuntimeAdapter<HetznerSdk>
```

## Handlers

| Resource Type                  | Handler                 | State PhysicalId              |
| ------------------------------ | ----------------------- | ----------------------------- |
| `Hetzner::Networking::Network` | `HetznerNetworkHandler` | `networkId`                   |
| `Hetzner::Networking::Subnet`  | `HetznerSubnetHandler`  | `${networkId}/${ipRange}`     |
| `Hetzner::Networking::Route`   | `HetznerRouteHandler`   | `${networkId}/${destination}` |

**Action resources** (Subnet, Route): No unique ID in API, managed via network actions. Composite physicalId allows engine to track them.

## Key Classes

- `HetznerSdk` - Facade over auto-generated SDK (`networks`, `networkActions`)
- `HetznerRuntimeContext` - Carries SDK + logger
- `HetznerProviderRuntime` - Registers handlers
- `HetznerRuntimeAdapterFactory` - Creates `RuntimeAdapter` from env

## Adding a Handler

1. Create `src/lib/handlers/<name>/`
   - `<name>-handler.ts` - Implements `ResourceHandler<Props, State, HetznerSdk>`
   - `<name>-handler.spec.ts` - Tests
   - `index.ts` - Export
2. Register in `HetznerProviderRuntime`
3. Config auto-generated in `@cdk-x/hetzner` (RUNTIME_CONFIGS)

## File Structure

```
src/lib/
├── hetzner-sdk-facade.ts
├── hetzner-runtime-context.ts
├── hetzner-provider-runtime.ts
├── hetzner-runtime-adapter-factory.ts
└── handlers/
    ├── index.ts
    ├── network/
    ├── subnet/
    └── route/
```

## Conventions

- camelCase props → snake_case API calls (explicit per handler)
- Composite physicalId for action resources: `${networkId}/${identifier}`
- DI via constructor deps (no jest.mock)
