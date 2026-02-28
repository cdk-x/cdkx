import { ResolverPipeline } from './resolver-pipeline.js';
import { Lazy } from './lazy.js';
import {
  IResolvable,
  ResolveContext,
  ResolutionContext,
  IResolver,
} from './resolvables.js';

const RESOURCE = {};
const PROVIDER = 'test';

// Helper: build a pipeline with no custom resolvers
const pipeline = () => ResolverPipeline.withBuiltins();

describe('ResolverPipeline.withBuiltins()', () => {
  it('returns a ResolverPipeline instance', () => {
    expect(pipeline()).toBeInstanceOf(ResolverPipeline);
  });
});

describe('ResolverPipeline.resolve()', () => {
  it('returns a string primitive as-is', () => {
    expect(pipeline().resolve([], 'hello', RESOURCE, PROVIDER)).toBe('hello');
  });

  it('returns a number primitive as-is', () => {
    expect(pipeline().resolve([], 42, RESOURCE, PROVIDER)).toBe(42);
  });

  it('returns a boolean as-is', () => {
    expect(pipeline().resolve([], true, RESOURCE, PROVIDER)).toBe(true);
  });

  it('returns null as-is', () => {
    expect(pipeline().resolve([], null, RESOURCE, PROVIDER)).toBeNull();
  });

  it('returns undefined as-is', () => {
    expect(
      pipeline().resolve([], undefined, RESOURCE, PROVIDER),
    ).toBeUndefined();
  });

  it('recurses into a plain object', () => {
    const result = pipeline().resolve([], { a: 1, b: 'x' }, RESOURCE, PROVIDER);
    expect(result).toEqual({ a: 1, b: 'x' });
  });

  it('recurses into nested objects', () => {
    const result = pipeline().resolve(
      [],
      { outer: { inner: 99 } },
      RESOURCE,
      PROVIDER,
    );
    expect(result).toEqual({ outer: { inner: 99 } });
  });

  it('recurses into arrays', () => {
    const result = pipeline().resolve([], [1, 2, 3], RESOURCE, PROVIDER);
    expect(result).toEqual([1, 2, 3]);
  });

  it('recurses into arrays of objects', () => {
    const result = pipeline().resolve(
      [],
      [{ name: 'a' }, { name: 'b' }],
      RESOURCE,
      PROVIDER,
    );
    expect(result).toEqual([{ name: 'a' }, { name: 'b' }]);
  });

  it('resolves a Lazy value', () => {
    const lazy = Lazy.any({ produce: () => 'resolved' });
    expect(pipeline().resolve([], lazy, RESOURCE, PROVIDER)).toBe('resolved');
  });

  it('resolves a Lazy nested inside an object', () => {
    const lazy = Lazy.any({ produce: () => 7 });
    const result = pipeline().resolve(
      [],
      { replicas: lazy },
      RESOURCE,
      PROVIDER,
    );
    expect(result).toEqual({ replicas: 7 });
  });

  it('resolves an IResolvable token', () => {
    const token: IResolvable = {
      resolve: (_ctx: ResolveContext) => ({ ref: 'res-a' }),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = pipeline().resolve([], token as any, RESOURCE, PROVIDER);
    expect(result).toEqual({ ref: 'res-a' });
  });

  it('resolves a Lazy → IResolvable chain', () => {
    const token: IResolvable = { resolve: (_ctx: ResolveContext) => 'final' };
    const lazy = Lazy.any({ produce: () => token });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = pipeline().resolve([], lazy as any, RESOURCE, PROVIDER);
    expect(result).toBe('final');
  });

  it('runs custom resolvers before built-ins (first-wins)', () => {
    // A custom resolver that replaces any string '{{secret}}' with 'my-secret-value'
    const customResolver: IResolver = {
      resolve(ctx: ResolutionContext) {
        if (ctx.value === '{{secret}}') ctx.replaceValue('my-secret-value');
      },
    };
    const p = new ResolverPipeline([customResolver]);
    expect(p.resolve([], '{{secret}}', RESOURCE, PROVIDER)).toBe(
      'my-secret-value',
    );
  });

  it('passes the provider identifier to IResolvable.resolve()', () => {
    let capturedProvider: string | undefined;
    const token: IResolvable = {
      resolve(ctx: ResolveContext) {
        capturedProvider = ctx.provider;
        return 'ok';
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pipeline().resolve([], token as any, RESOURCE, 'hetzner');
    expect(capturedProvider).toBe('hetzner');
  });

  it('allows ctx.resolve() inside a token to recursively resolve a Lazy', () => {
    const inner = Lazy.any({ produce: () => 'inner-resolved' });
    const token: IResolvable = {
      resolve(ctx: ResolveContext) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ctx.resolve(inner as any);
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = pipeline().resolve([], token as any, RESOURCE, PROVIDER);
    expect(result).toBe('inner-resolved');
  });
});

describe('ResolverPipeline.sanitize()', () => {
  it('returns a string as-is', () => {
    expect(pipeline().sanitize('hello')).toBe('hello');
  });

  it('returns a number as-is', () => {
    expect(pipeline().sanitize(42)).toBe(42);
  });

  it('returns null as undefined (omitted)', () => {
    expect(pipeline().sanitize(null)).toBeUndefined();
  });

  it('returns undefined as undefined', () => {
    expect(pipeline().sanitize(undefined)).toBeUndefined();
  });

  it('removes null values from an object', () => {
    expect(pipeline().sanitize({ a: 1, b: null })).toEqual({ a: 1 });
  });

  it('removes undefined values from an object', () => {
    expect(pipeline().sanitize({ a: 1, b: undefined })).toEqual({ a: 1 });
  });

  it('recursively removes nulls from nested objects', () => {
    expect(pipeline().sanitize({ outer: { a: 1, b: null } })).toEqual({
      outer: { a: 1 },
    });
  });

  it('removes null items from arrays', () => {
    expect(pipeline().sanitize([1, null, 2, undefined, 3])).toEqual([1, 2, 3]);
  });

  it('throws when a class instance survives (unresolved token)', () => {
    class UnresolvedToken {}
    expect(() => pipeline().sanitize(new UnresolvedToken())).toThrow(
      "Unresolved token of type 'UnresolvedToken' found during synthesis",
    );
  });

  it('sorts object keys when sortKeys: true', () => {
    const result = pipeline().sanitize(
      { z: 1, a: 2, m: 3 },
      { sortKeys: true },
    ) as Record<string, unknown>;
    expect(Object.keys(result)).toEqual(['a', 'm', 'z']);
  });

  it('does not sort keys by default', () => {
    const result = pipeline().sanitize({ z: 1, a: 2, m: 3 }) as Record<
      string,
      unknown
    >;
    // Keys should be in insertion order, not sorted
    expect(Object.keys(result)).toEqual(['z', 'a', 'm']);
  });

  it('handles an empty object', () => {
    expect(pipeline().sanitize({})).toEqual({});
  });

  it('handles an empty array', () => {
    expect(pipeline().sanitize([])).toEqual([]);
  });
});
