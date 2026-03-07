# @cdkx-io/logger — Development Context

This file captures the full design, architecture, and implementation details of
`@cdkx-io/logger` for future AI-assisted sessions. It is auto-loaded by OpenCode.

> **Maintenance rule:** whenever code in `packages/logger` is modified — classes,
> interfaces, file structure, conventions, or design decisions — this file must
> be updated in the same change to stay accurate.

---

## What is @cdkx-io/logger?

**@cdkx-io/logger** is the centralized structured logging system for the cdkx
monorepo. It captures all deployment events (state transitions, HTTP requests,
provider interactions) in a structured JSON format and writes them to disk for
later analysis and debugging.

Key features:

- **Structured JSON logging** — all events follow a standardized `LogEvent` schema
- **Automatic context binding** — child loggers inherit `stackId`/`resourceId` context
- **Security-first** — automatic sanitization of sensitive headers and fields
- **Log rotation** — keeps the N most recent log files, deletes older ones
- **Winston-based** — leverages Winston's transport and formatter infrastructure
- **No console output** — logs only to files; CLI controls stdout independently

---

## Workspace setup

| Property        | Value                                                                                |
| --------------- | ------------------------------------------------------------------------------------ |
| Monorepo tool   | Nx 22                                                                                |
| Package manager | Yarn (yarn.lock at root)                                                             |
| Language        | TypeScript 5.9, strict mode, CommonJS (`module: commonjs`, `moduleResolution: node`) |
| Build tool      | `@nx/js:tsc` — emits JS + `.d.ts` + `.d.ts.map`                                      |
| Test runner     | Jest 30 + SWC (`@swc/jest`)                                                          |
| Linter          | ESLint with `@typescript-eslint`                                                     |
| Formatter       | Prettier ~3.6 (`.prettierrc` at workspace root)                                      |
| Output dir      | `packages/logger/dist/`                                                              |

Run tasks via Nx:

```bash
yarn nx lint @cdkx-io/logger
yarn nx test @cdkx-io/logger
yarn nx build @cdkx-io/logger
yarn nx run @cdkx-io/logger:format        # format src/ with prettier
yarn nx run @cdkx-io/logger:format:check  # check formatting without writing
```

Dependencies:

- `winston@^3.19.0` — logging framework (file transports, formatters)
- `@types/node` (dev) — Node.js types for `fs`, `path`, etc.

---

## Core contract

### LogEvent structure

Every log event emitted follows this shape:

```ts
interface LogEvent {
  timestamp: string; // ISO 8601, auto-generated
  level: 'debug' | 'info' | 'warn' | 'error';
  source: 'engine' | 'provider' | 'core';
  type: string; // Namespaced: '{source}.{category}.{action}'
  stackId: string; // ALWAYS present
  resourceId: string; // ALWAYS present (= stackId for stack-level events)
  data: Record<string, unknown>; // Event-specific payload
  error?: {
    // Only when level='error'
    message: string;
    code?: string;
    stack?: string;
  };
}
```

### Namespaced event types

Event types follow the pattern: `{source}.{category}.{action}`

Examples:

- `engine.state.stack.transition`
- `engine.state.resource.transition`
- `engine.deployment.start`
- `engine.deployment.complete`
- `provider.http.request`
- `provider.http.response`
- `provider.http.error`
- `provider.action.poll.start` (Hetzner-specific)

### Logger interface

```ts
interface Logger {
  debug(type: string, data: LogEventData): void;
  info(type: string, data: LogEventData): void;
  warn(type: string, data: LogEventData): void;
  error(type: string, data: LogEventData, error?: Error): void;
  child(context: LogContext): Logger;
}
```

### Child logger pattern

Child loggers automatically bind `stackId` and `resourceId` to all events:

```ts
const stackLogger = logger.child({ stackId: 'MyStack' });
stackLogger.info('engine.state.stack.transition', {
  status: 'CREATE_IN_PROGRESS',
});
// Emitted event includes stackId='MyStack', resourceId='MyStack'

const resourceLogger = stackLogger.child({
  stackId: 'MyStack',
  resourceId: 'MyResource',
});
resourceLogger.info('provider.http.request', {
  method: 'POST',
  path: '/servers',
});
// Emitted event includes stackId='MyStack', resourceId='MyResource'
```

---

## Architecture

```
LoggerFactory                    Factory method: createEngineLogger(options)
 └── LoggerImpl                  Logger interface implementation
      ├── Winston Logger         Core Winston instance
      ├── FileTransport          File transport with rotation
      │    └── rotateLogFiles()  Keeps N most recent, deletes older
      ├── JsonFormatter          Custom Winston formatter
      └── Sanitizers             Redacts sensitive headers/fields
```

---

## Class inventory

### `LoggerImpl` (`src/lib/logger.ts`)

Winston-based implementation of the `Logger` interface.

| Member                                         | Description                                                             |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `constructor(winstonLogger, source, context?)` | Private — use `LoggerFactory.createEngineLogger()` instead              |
| `debug(type, data)`                            | Emit debug-level event                                                  |
| `info(type, data)`                             | Emit info-level event                                                   |
| `warn(type, data)`                             | Emit warning-level event                                                |
| `error(type, data, error?)`                    | Emit error-level event with optional Error object                       |
| `child(context)`                               | Create child logger with bound stackId/resourceId                       |
| `private log(level, type, data, error?)`       | Internal — constructs Winston log entry and calls `winstonLogger.log()` |

**Context resolution priority (highest to lowest):**

1. Explicit `data.stackId` / `data.resourceId` passed to log method
2. Bound context from `child(context)`
3. Fallback: `'unknown'` for stackId, `stackId` for resourceId

### `LoggerFactory` (`src/lib/logger.ts`)

Factory for creating logger instances with proper configuration.

| Method                        | Description                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| `static createEngineLogger()` | Creates a logger suitable for use by the DeploymentEngine and CLI |

**Options:**

```ts
interface LoggerOptions {
  logDir?: string; // Default: '.cdkx'
  level?: LogLevel; // Default: 'info'
  maxFiles?: number; // Default: 50
  source?: LogSource; // Default: 'engine'
}
```

**Default configuration:**

- Log directory: `.cdkx/` (relative to `process.cwd()`)
- Log level: `info` (filters out `debug` unless overridden)
- Max files: 50 (keeps the 50 most recent log files)
- Source: `engine` (all events tagged with `source: 'engine'`)

---

### `FileTransport` (`src/lib/transports/file-transport.ts`)

File transport with automatic log rotation.

| Member                     | Description                                                      |
| -------------------------- | ---------------------------------------------------------------- |
| `constructor(options)`     | Creates transport, ensures logDir exists, rotates old files      |
| `getTransport()`           | Returns the Winston `FileTransportInstance`                      |
| `private rotateLogFiles()` | Deletes log files exceeding `maxFiles` limit (keeps most recent) |

**Log file naming:** `deploy-{timestamp}.log` where `{timestamp}` is ISO 8601
with colons replaced by hyphens (e.g., `deploy-2026-03-07T14-30-00-123Z.log`).

**Rotation algorithm:**

1. List all `deploy-*.log` files in `logDir`
2. Sort by file modification time (newest first)
3. Keep the first `maxFiles` entries
4. Delete the rest

**Dependency injection:** All `fs` operations (`mkdirSync`, `readdirSync`,
`statSync`, `unlinkSync`) are injectable via `FileTransportOptions.deps` for
testing without hitting disk.

---

### `JsonFormatter` (`src/lib/formatters/json-formatter.ts`)

Custom Winston formatter that outputs `LogEvent` as JSON newline-delimited format.

| Method            | Description                                                   |
| ----------------- | ------------------------------------------------------------- |
| `static create()` | Returns a Winston `Logform.Format` that serializes `LogEvent` |

**Output format:** Each line in the log file is a single JSON object (no pretty-printing):

```json
{
  "timestamp": "2026-03-07T14:30:00.123Z",
  "level": "info",
  "source": "engine",
  "type": "engine.state.stack.transition",
  "stackId": "MyStack",
  "resourceId": "MyStack",
  "data": { "status": "CREATE_IN_PROGRESS" }
}
```

---

### `Sanitizers` (`src/lib/sanitizers.ts`)

Static utility class for redacting sensitive data from logs.

| Method                            | Description                                                       |
| --------------------------------- | ----------------------------------------------------------------- |
| `static sanitizeHeaders(headers)` | Redacts sensitive HTTP headers                                    |
| `static sanitizeBody(body)`       | Recursively redacts sensitive fields from request/response bodies |

**Sensitive header patterns (case-insensitive):**

- `authorization`
- `x-auth-token`
- `api-key`

**Sensitive field patterns (regex, case-insensitive):**

- Any field name matching `/token|password|secret|key/i`

**Redaction placeholder:** `[REDACTED]`

**Important:** `sanitizeBody` is recursive — it walks nested objects and arrays
to redact sensitive fields at any depth.

---

## Usage patterns

### In the CLI (`deploy.command.ts`, `destroy.command.ts`)

```ts
import { LoggerFactory } from '@cdkx-io/logger';

const logger = LoggerFactory.createEngineLogger({
  logDir: stateDir, // .cdkx/ next to cdkx.json
  level: (process.env.CDKX_LOG_LEVEL as LogLevel) ?? 'info',
});

const engine = new DeploymentEngine({
  adapters,
  assemblyDir,
  stateDir,
  eventBus,
  logger, // Pass to engine
});
```

### In the engine (`deployment-engine.ts`)

Subscribe to the existing `EventBus` to log all state transitions:

```ts
constructor(options: DeploymentEngineOptions) {
  // ...
  if (options.logger) {
    this.eventBus.subscribe((event) => {
      const isError = event.resourceStatus.includes('FAILED');
      const level = isError ? 'error' : 'info';

      this.logger[level]('engine.state.resource.transition', {
        stackId: event.stackId,
        resourceId: event.logicalResourceId,
        resourceType: event.resourceType,
        status: event.resourceStatus,
        physicalId: event.physicalResourceId,
        reason: event.resourceStatusReason,
      });
    });
  }
}
```

### In the provider adapter (`hetzner-adapter.ts`)

```ts
import { Logger } from '@cdkx-io/logger';

export class HetznerAdapter implements ProviderAdapter {
  private logger?: Logger;

  setLogger(logger: Logger): void {
    this.logger = logger;
    this.client.setLogger(logger); // Propagate to HTTP client
  }

  async create(resource: ManifestResource): Promise<CreateResult> {
    const resourceLogger = this.logger?.child({
      stackId: resource.stackId,
      resourceId: resource.logicalId,
    });

    resourceLogger?.info('provider.adapter.create.start', {
      resourceType: resource.type,
    });

    // ... call API ...

    resourceLogger?.info('provider.adapter.create.complete', {
      physicalId,
    });

    return { physicalId, outputs };
  }
}
```

### In the HTTP client (`hetzner-client.ts`)

```ts
import { Logger, Sanitizers } from '@cdkx-io/logger';

export class HetznerClient {
  private logger?: Logger;

  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const startTime = Date.now();

    this.logger?.debug('provider.http.request', {
      method: 'POST',
      path,
      headers: Sanitizers.sanitizeHeaders(this.headers),
      body: Sanitizers.sanitizeBody(body),
    });

    try {
      const response = await this.request('POST', path, body);
      const durationMs = Date.now() - startTime;

      this.logger?.info('provider.http.response', {
        method: 'POST',
        path,
        statusCode: response.statusCode,
        durationMs,
        body: Sanitizers.sanitizeBody(response.body),
      });

      return response.body as T;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.logger?.error(
        'provider.http.error',
        {
          method: 'POST',
          path,
          statusCode: (error as any).statusCode,
          durationMs,
        },
        error as Error,
      );

      throw error;
    }
  }
}
```

---

## Testing

Tests are co-located with their implementation files:

| File                                | Tests | Coverage                                         |
| ----------------------------------- | ----- | ------------------------------------------------ |
| `logger.spec.ts`                    | 19    | Logger interface, child loggers, context merging |
| `sanitizers.spec.ts`                | 14    | Header/body sanitization, recursion, redaction   |
| `transports/file-transport.spec.ts` | 6     | File transport, rotation, directory creation     |

**Total: 39 tests**

All I/O operations in `FileTransport` are mocked via dependency injection — no
tests write to disk.

---

## Release configuration

Part of the `core` release group in `nx.json` — lock-stepped with `@cdkx-io/core`,
`@cdkx-io/engine`, `@cdkx-io/testing`, and `@cdkx-io/hetzner`. Tag pattern:
`core-v{version}`.

---

## Coding conventions

See `packages/core/CONTEXT.md` for the authoritative coding conventions. This
package follows them identically:

- Everything OOP — no standalone `export function`
- No `any` — use `unknown`
- CJS imports — extensionless local imports
- Specs co-located — `foo.spec.ts` next to `foo.ts`
- Prettier — run `yarn nx run @cdkx-io/logger:format` after any `.ts` change

---

## File map

```
packages/logger/
├── package.json                  name: @cdkx-io/logger, winston dependency
├── project.json                  Nx project configuration (build, format, test)
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
├── eslint.config.mjs
├── jest.config.cts
├── CONTEXT.md                    ← this file
└── src/
    ├── index.ts                  public barrel — exports types, logger, sanitizers
    └── lib/
        ├── types.ts              LogEvent, Logger interface, LoggerOptions, etc.
        ├── logger.ts             LoggerImpl + LoggerFactory
        ├── logger.spec.ts        19 tests
        ├── sanitizers.ts         Sanitizers static class
        ├── sanitizers.spec.ts    14 tests
        ├── formatters/
        │   └── json-formatter.ts JsonFormatter — Winston format for LogEvent
        └── transports/
            ├── file-transport.ts FileTransport — rotation, cleanup
            └── file-transport.spec.ts 6 tests
```

Also written at runtime (gitignored):

```
.cdkx/deploy-{timestamp}.log      One log file per deployment
                                   (e.g., deploy-2026-03-07T14-30-00-123Z.log)
```

---

## Next steps (integration phases)

### Phase 2: Integrate in @cdkx-io/engine

- Add `@cdkx-io/logger` as dependency in `packages/engine/package.json`
- Modify `DeploymentEngineOptions` to accept `logger?: Logger`
- Subscribe logger to the `EventBus` in the constructor
- Log all state transitions automatically
- Create child loggers per stack/resource
- Log deployment start/complete/failure events
- Tests

### Phase 3: Modify ProviderAdapter interface

- Add optional method `setLogger?(logger: Logger): void` to the interface
- Document in `packages/engine/CONTEXT.md`

### Phase 4: Integrate in @cdkx-io/hetzner

- Add `@cdkx-io/logger` as peer dependency
- Modify `HetznerClientOptions` to accept `logger?: Logger`
- Implement `HetznerAdapter.setLogger()` and propagate to client
- Instrument `HetznerClient.request()` to log HTTP request/response/error
- Instrument `ActionPoller` to log polling iterations
- Tests

### Phase 5: Connect in @cdkx-io/cli

- Modify `deploy.command.ts` to create logger and pass to engine
- Modify `destroy.command.ts` the same way
- Tests

### Phase 6: Documentation

- Update `packages/engine/CONTEXT.md` with logger integration
- Update `packages/providers/hetzner/CONTEXT.md` with logger integration
- Update `packages/cli/CONTEXT.md` with logger creation
- Update `.opencode/rules/conventions.md` with logging conventions
