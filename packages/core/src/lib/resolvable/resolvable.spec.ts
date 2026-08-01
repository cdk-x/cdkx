import { Resolvable } from './resolvable.js';
import type { IResolvable } from './resolvable.js';

describe('Resolvable', () => {
  describe('isResolvable', () => {
    it('returns true for an object with a resolve method', () => {
      const value: IResolvable = { resolve: () => 'x' };
      expect(Resolvable.isResolvable(value)).toBe(true);
    });

    it('returns false for null', () => {
      expect(Resolvable.isResolvable(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(Resolvable.isResolvable(undefined)).toBe(false);
    });

    it('returns false for a string', () => {
      expect(Resolvable.isResolvable('a string')).toBe(false);
    });

    it('returns false for a number', () => {
      expect(Resolvable.isResolvable(42)).toBe(false);
    });

    it('returns false for an array', () => {
      expect(Resolvable.isResolvable([1, 2, 3])).toBe(false);
    });

    it('returns false for a plain object without resolve', () => {
      expect(Resolvable.isResolvable({ foo: 'bar' })).toBe(false);
    });

    it('returns false for an object whose resolve property is not a function', () => {
      expect(Resolvable.isResolvable({ resolve: 'foo' })).toBe(false);
    });
  });

  describe('type-level checks', () => {
    it('does not allow direct instantiation (private constructor)', () => {
      // @ts-expect-error - Resolvable's constructor is private; it is a static-only utility class
      const instance = new Resolvable();
      expect(instance).toBeInstanceOf(Resolvable);
    });

    it('accepts an IResolvable nested anywhere within an arbitrary properties tree', () => {
      const resolvable: IResolvable = { resolve: () => 'resolved' };

      const value: any = {
        name: 'example',
        count: 1,
        enabled: true,
        tags: ['a', 'b', resolvable],
        nested: {
          direct: resolvable,
          deeper: {
            list: [resolvable, { inner: resolvable }],
          },
        },
      };

      expect(Resolvable.isResolvable(resolvable)).toBe(true);
      expect(Resolvable.isResolvable(value)).toBe(false);
    });
  });
});
