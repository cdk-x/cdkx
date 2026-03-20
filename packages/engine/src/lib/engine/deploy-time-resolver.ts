import type { EngineState } from '../state/engine-state';

// ─── Token type guards ────────────────────────────────────────────────────────

interface RefAttrToken {
  ref: string;
  attr: string;
}

interface StackRefToken {
  stackRef: string;
  outputKey: string;
}

function isRefAttrToken(value: unknown): value is RefAttrToken {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return typeof obj['ref'] === 'string' && typeof obj['attr'] === 'string';
}

function isStackRefToken(value: unknown): value is StackRefToken {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['stackRef'] === 'string' &&
    typeof obj['outputKey'] === 'string' &&
    !('ref' in obj)
  );
}

// ─── DeployTimeResolver ───────────────────────────────────────────────────────

/**
 * Resolves deploy-time tokens in resource property trees.
 *
 * Handles two token shapes:
 * - `{ ref, attr }` — intra-stack resource attribute reference
 * - `{ stackRef, outputKey }` — cross-stack output reference
 *
 * Both token types are resolved eagerly from the current `EngineState`
 * snapshot. If a referenced resource or stack output is not found, an
 * error is thrown — the `DeploymentPlanner` guarantees that dependencies
 * are always deployed before dependents.
 */
export class DeployTimeResolver {
  constructor(
    private readonly state: EngineState,
    private readonly stackId: string,
  ) {}

  /**
   * Recursively resolves all tokens in `value`.
   * Plain values (strings, numbers, booleans, null, undefined) are returned
   * unchanged. Arrays and objects are traversed recursively.
   */
  public resolve(value: unknown): unknown {
    if (value === null || value === undefined) return value;

    if (isRefAttrToken(value)) {
      return this.resolveRefAttr(value.ref, value.attr);
    }

    if (isStackRefToken(value)) {
      return this.resolveStackRef(value.stackRef, value.outputKey);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolve(item));
    }

    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = this.resolve(v);
      }
      return result;
    }

    return value;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private resolveRefAttr(ref: string, attr: string): unknown {
    const resourceState = this.state.stacks[this.stackId]?.resources[ref];
    if (resourceState === undefined) {
      throw new Error(
        `Token resolution failed: resource '${ref}' not found in stack '${this.stackId}'.`,
      );
    }
    const outputs = resourceState.outputs ?? {};
    if (!(attr in outputs)) {
      throw new Error(
        `Token resolution failed: attribute '${attr}' not found on resource '${ref}' in stack '${this.stackId}'.`,
      );
    }
    return outputs[attr];
  }

  private resolveStackRef(stackRef: string, outputKey: string): unknown {
    const stackState = this.state.stacks[stackRef];
    if (stackState === undefined) {
      throw new Error(
        `Token resolution failed: stack '${stackRef}' not found in engine state.`,
      );
    }
    const outputs = stackState.outputs ?? {};
    if (!(outputKey in outputs)) {
      throw new Error(
        `Token resolution failed: output key '${outputKey}' not found in stack '${stackRef}'.`,
      );
    }
    return outputs[outputKey];
  }
}
