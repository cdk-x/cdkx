import { ResolutionContext } from './resolvables.js';
import { Lazy } from './lazy.js';
import { LazyResolver, ImplicitTokenResolver } from './resolvers.js';

const RESOURCE = {};
const PROVIDER = 'test';
const KEY: string[] = [];

describe('LazyResolver', () => {
  const resolver = new LazyResolver();

  it('replaces a Lazy value with its produced value', () => {
    const lazy = Lazy.any({ produce: () => 42 });
    const ctx = new ResolutionContext(RESOURCE, KEY, lazy, PROVIDER);
    resolver.resolve(ctx);
    expect(ctx.replaced).toBe(true);
    expect(ctx.replacedValue).toBe(42);
  });

  it('does not replace a primitive string', () => {
    const ctx = new ResolutionContext(RESOURCE, KEY, 'hello', PROVIDER);
    resolver.resolve(ctx);
    expect(ctx.replaced).toBe(false);
  });

  it('does not replace a plain object', () => {
    const ctx = new ResolutionContext(RESOURCE, KEY, { a: 1 }, PROVIDER);
    resolver.resolve(ctx);
    expect(ctx.replaced).toBe(false);
  });

  it('does not replace null', () => {
    const ctx = new ResolutionContext(RESOURCE, KEY, null, PROVIDER);
    resolver.resolve(ctx);
    expect(ctx.replaced).toBe(false);
  });

  it('replaces a Lazy that produces null', () => {
    const lazy = Lazy.any({ produce: () => null });
    const ctx = new ResolutionContext(RESOURCE, KEY, lazy, PROVIDER);
    resolver.resolve(ctx);
    expect(ctx.replaced).toBe(true);
    expect(ctx.replacedValue).toBeNull();
  });

  it('replaces a Lazy that produces a nested object', () => {
    const lazy = Lazy.any({ produce: () => ({ replicas: 3 }) });
    const ctx = new ResolutionContext(RESOURCE, KEY, lazy, PROVIDER);
    resolver.resolve(ctx);
    expect(ctx.replaced).toBe(true);
    expect(ctx.replacedValue).toEqual({ replicas: 3 });
  });
});

describe('ImplicitTokenResolver', () => {
  it('replaces an IResolvable token by calling its resolve()', () => {
    const pipelineResolve = jest.fn((_key, value) => value);
    const resolver = new ImplicitTokenResolver(pipelineResolve);

    const token = { resolve: () => ({ ref: 'my-resource' }) };
    const ctx = new ResolutionContext(RESOURCE, KEY, token, PROVIDER);
    resolver.resolve(ctx);

    expect(ctx.replaced).toBe(true);
    expect(ctx.replacedValue).toEqual({ ref: 'my-resource' });
  });

  it('passes a ResolveContext with the correct provider to the token', () => {
    const pipelineResolve = jest.fn((_key, value) => value);
    const resolver = new ImplicitTokenResolver(pipelineResolve);

    let capturedProvider: string | undefined;
    const token = {
      resolve: (ctx: { provider: string }) => {
        capturedProvider = ctx.provider;
        return 'done';
      },
    };

    const ctx = new ResolutionContext(RESOURCE, KEY, token, 'kubernetes');
    resolver.resolve(ctx);

    expect(capturedProvider).toBe('kubernetes');
  });

  it("calls pipelineResolve when the token's resolve() calls ctx.resolve()", () => {
    const pipelineResolve = jest.fn((_key, value) => `resolved:${value}`);
    const resolver = new ImplicitTokenResolver(pipelineResolve);

    const token = {
      resolve: (ctx: { resolve: (v: unknown) => unknown }) =>
        ctx.resolve('inner'),
    };
    const ctx = new ResolutionContext(RESOURCE, KEY, token, PROVIDER);
    resolver.resolve(ctx);

    expect(pipelineResolve).toHaveBeenCalledWith(
      KEY,
      'inner',
      RESOURCE,
      PROVIDER,
    );
    expect(ctx.replacedValue).toBe('resolved:inner');
  });

  it('does NOT replace a Lazy instance (handled by LazyResolver)', () => {
    const pipelineResolve = jest.fn();
    const resolver = new ImplicitTokenResolver(pipelineResolve);

    const lazy = Lazy.any({ produce: () => 1 });
    const ctx = new ResolutionContext(RESOURCE, KEY, lazy, PROVIDER);
    resolver.resolve(ctx);

    expect(ctx.replaced).toBe(false);
    expect(pipelineResolve).not.toHaveBeenCalled();
  });

  it('does not replace a plain object (no resolve method)', () => {
    const pipelineResolve = jest.fn();
    const resolver = new ImplicitTokenResolver(pipelineResolve);

    const ctx = new ResolutionContext(RESOURCE, KEY, { foo: 'bar' }, PROVIDER);
    resolver.resolve(ctx);

    expect(ctx.replaced).toBe(false);
  });

  it('does not replace a primitive', () => {
    const pipelineResolve = jest.fn();
    const resolver = new ImplicitTokenResolver(pipelineResolve);

    const ctx = new ResolutionContext(RESOURCE, KEY, 'hello', PROVIDER);
    resolver.resolve(ctx);

    expect(ctx.replaced).toBe(false);
  });
});
