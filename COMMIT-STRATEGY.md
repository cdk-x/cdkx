# cdkx Monorepo — Development Context

Context transversal del monorepo cdkx. Este archivo se auto-carga en todas
las sesiones de OpenCode desde la raíz del workspace.

> **Maintenance rule:** actualiza este archivo cuando cambien convenciones
> globales del monorepo (commits, releases, estructura de packages, etc.).

---

## Git Commit Conventions

### Formato — Conventional Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]
```

### Scopes

El scope es **siempre un único package** (sin el prefijo `@cdk-x/`).
**Nunca mezcles más de un scope en el mismo commit.**

| Scope     | Package                  |
| --------- | ------------------------ |
| `core`    | `@cdk-x/core`            |
| `cli`     | `@cdk-x/cli`             |
| `testing` | `@cdk-x/testing`         |
| `hetzner` | `@cdk-x/hetzner`         |
| `engine`  | `@cdk-x/engine` (futuro) |

Si los cambios afectan a múltiples packages → **un commit por scope**.

### Types

| Type       | Cuándo usarlo                                                   |
| ---------- | --------------------------------------------------------------- |
| `feat`     | Nueva funcionalidad                                             |
| `fix`      | Corrección de bugs                                              |
| `docs`     | Solo cambios en documentación (CONTEXT.md, README, JSDoc)       |
| `style`    | Cambios de formato (prettier, whitespace) sin afectar la lógica |
| `refactor` | Cambios de código que no añaden features ni arreglan bugs       |
| `test`     | Añadir o modificar tests (specs, snapshots)                     |
| `chore`    | Build, configs, dependencias, CI, nx.json, etc.                 |

### Subject

- **Máximo 72 caracteres**
- **Minúsculas**, sin punto final
- Usa **imperativo** ("add", no "added" ni "adds")
- Sé específico pero conciso

### Body (opcional)

- Explica **qué** y **por qué**, no el cómo
- Usa viñetas (`-`) para listar cambios múltiples
- Deja una línea en blanco entre subject y body

### Commits pequeños y atómicos

**CRÍTICO:** Cada commit debe representar **un único cambio lógico**.

- PRs más fáciles de revisar
- Git history más legible y trazable
- Rollbacks quirúrgicos si algo falla
- `git bisect` más efectivo para encontrar bugs
- Semantic release y changelogs más precisos

**Regla de oro:** si usas "y" en el subject, probablemente necesitas 2 commits.

---

## Workflow para analizar y commitear cambios

### 1. Analizar el alcance

```bash
git status          # archivos modificados
git diff --stat     # resumen
git diff            # diff completo
```

### 2. Agrupar cambios

Agrupa por **scope** (package afectado), luego sub-agrupa por **tipo y
funcionalidad**:

```
Scope: core
  ├─ fix:  PropertyValue ahora incluye IResolvable
  └─ docs: documentar implicit dependency resolution

Scope: hetzner
  ├─ feat: networkId getter en NtvHetznerNetwork
  ├─ feat: subnetId getter en NtvHetznerSubnet
  ├─ test: cross-resource reference tests
  └─ docs: documentar cross-resource reference pattern
```

### 3. Proponer el plan al usuario

**Antes de hacer cualquier commit**, presenta la lista ordenada:

```
Propongo dividir los cambios en N commits:

1. fix(core): include IResolvable in PropertyValue type
   git add packages/core/src/lib/constants.ts

2. feat(hetzner): add networkId attribute getter to NtvHetznerNetwork
   git add packages/providers/hetzner/src/lib/networking/ntc-hetzner-network.ts

3. feat(hetzner): add subnetId getter and IResolvable support to NtvHetznerSubnet
   git add packages/providers/hetzner/src/lib/networking/ntv-hetzner-subnet.ts

...

¿Te parece correcto?
```

### 4. Ejecutar los commits

Usa `git add` **archivo por archivo** — **nunca `git add .` ni `git add -A`**
cuando hay cambios de múltiples scopes o funcionalidades.

```bash
# Commit 1
git add packages/core/src/lib/constants.ts
git commit -m "fix(core): include IResolvable in PropertyValue type"

# Commit 2
git add packages/providers/hetzner/src/lib/networking/ntc-hetzner-network.ts
git commit -m "feat(hetzner): add networkId attribute getter to NtvHetznerNetwork"

# etc.
```

Usa `git add -p` (patch mode) solo si un mismo archivo contiene cambios de
distinta naturaleza que deben ir en commits separados.

### 5. Verificar tras cada commit

```bash
git log -1 --stat   # verificar el commit
git status          # ver qué queda por commitear
```

---

## Casos especiales

### Formatting automático (prettier)

Si prettier reformatea archivos al guardar, mezclando formato con lógica:

1. **Commit 1:** los cambios de lógica (`git add -p` si hace falta)
2. **Commit 2:** `style(<scope>): format with prettier`

Buena práctica: corre `yarn nx run <scope>:format` **antes** de escribir
código para separar el ruido de formato del cambio real.

### Refactor que toca múltiples archivos del mismo scope

Si un refactor toca N archivos pero es **una sola operación lógica**
(e.g. renombrar una clase y actualizar todos sus imports), es **un solo commit**:

```bash
git add packages/core/src/lib/foo.ts
git add packages/core/src/lib/bar.ts
git add packages/core/src/lib/baz.ts
git commit -m "refactor(core): rename Foo to Bar"
```

### Feat + test + docs (mismo scope)

Son **tres commits separados**, en este orden:

```bash
# 1. La feature
git add packages/hetzner/src/lib/networking/ntv-hetzner-subnet.ts
git commit -m "feat(hetzner): add subnetId getter to NtvHetznerSubnet"

# 2. Los tests
git add packages/hetzner/src/lib/networking/ntv-hetzner-subnet.spec.ts
git add packages/hetzner/src/lib/networking/__snapshots__/ntv-hetzner-subnet.spec.ts.snap
git commit -m "test(hetzner): add cross-resource reference tests for subnet"

# 3. La doc
git add packages/hetzner/CONTEXT.md
git commit -m "docs(hetzner): document cross-resource reference pattern"
```

---

## Ejemplos de commits bien formados

```bash
# Fix con body explicativo
git commit -m "fix(core): include IResolvable in PropertyValue type

PropertyValue now accepts IResolvable tokens (Lazy, ResourceAttribute, etc.)
that are resolved by the ResolverPipeline at synthesis time. Fixes type errors
when passing attribute getters as resource props."

# Feature simple
git commit -m "feat(hetzner): add networkId attribute getter to NtvHetznerNetwork"

# Docs
git commit -m "docs(core): document implicit dependency resolution pattern"

# Chore
git commit -m "chore(hetzner): configure jest in verbose mode"
```

---

## Release configuration

Ver `packages/core/CONTEXT.md` para detalles de `nx release` y release groups.

## Package context files

Cada package tiene su propio `CONTEXT.md` con arquitectura, convenciones de
código, y decisiones de diseño:

- `packages/core/CONTEXT.md`
- `packages/cli/CONTEXT.md`
- `packages/testing/CONTEXT.md`
- `packages/providers/hetzner/CONTEXT.md`
