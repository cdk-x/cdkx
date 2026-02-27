import { IResolvable, ResolveContext, ResolutionContext, Resolvables, isResolvable } from './resolvables.js';

const DUMMY_RESOURCE = {};
const DUMMY_PROVIDER = 'test';

describe('Resolvables.isResolvable()', () => {
  it('returns true for an object with a resolve() method', () => {
    const token: IResolvable = { resolve: (_ctx: ResolveContext) => 'value' };
    expect(Resolvables.isResolvable(token)).toBe(true);
  });

  it('returns false for a plain object without resolve()', () => {
    expect(Resolvables.isResolvable({ foo: 'bar' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(Resolvables.isResolvable(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(Resolvables.isResolvable(undefined)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(Resolvables.isResolvable('hello')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(Resolvables.isResolvable(42)).toBe(false);
  });

  it('returns false when resolve is not a function', () => {
    expect(Resolvables.isResolvable({ resolve: 'not-a-function' })).toBe(false);
  });

  it('returns true when resolve is any function (duck-typed)', () => {
    expect(Resolvables.isResolvable({ resolve: () => undefined })).toBe(true);
  });
});

describe('isResolvable() (deprecated alias)', () => {
  it('delegates to Resolvables.isResolvable()', () => {
    expect(isResolvable({ resolve: () => 1 })).toBe(true);
    expect(isResolvable({})).toBe(false);
  });
});

describe('ResolutionContext', () => {
  it('stores constructor arguments', () => {
    const ctx = new ResolutionContext(DUMMY_RESOURCE, ['key', '0'], 'hello', DUMMY_PROVIDER);
    expect(ctx.providerResource).toBe(DUMMY_RESOURCE);
    expect(ctx.key).toEqual(['key', '0']);
    expect(ctx.value).toBe('hello');
    expect(ctx.provider).toBe(DUMMY_PROVIDER);
  });

  it('starts with replaced = false', () => {
    const ctx = new ResolutionContext(DUMMY_RESOURCE, [], 'val', DUMMY_PROVIDER);
    expect(ctx.replaced).toBe(false);
  });

  it('replaceValue() sets replaced = true and stores the new value', () => {
    const ctx = new ResolutionContext(DUMMY_RESOURCE, [], 'original', DUMMY_PROVIDER);
    ctx.replaceValue('replaced');
    expect(ctx.replaced).toBe(true);
    expect(ctx.replacedValue).toBe('replaced');
  });

  it('replaceValue() accepts null', () => {
    const ctx = new ResolutionContext(DUMMY_RESOURCE, [], 'original', DUMMY_PROVIDER);
    ctx.replaceValue(null);
    expect(ctx.replaced).toBe(true);
    expect(ctx.replacedValue).toBeNull();
  });

  it('replaceValue() accepts objects', () => {
    const ctx = new ResolutionContext(DUMMY_RESOURCE, [], 'original', DUMMY_PROVIDER);
    const obj = { nested: true };
    ctx.replaceValue(obj);
    expect(ctx.replacedValue).toBe(obj);
  });
});
