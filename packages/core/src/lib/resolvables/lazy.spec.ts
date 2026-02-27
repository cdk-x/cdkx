import { Lazy } from './lazy.js';

describe('Lazy', () => {
  describe('Lazy.any()', () => {
    it('returns a value assignable at runtime (is a Lazy instance internally)', () => {
      const lazy = Lazy.any({ produce: () => 42 });
      // The static type is `any` — at runtime it is a Lazy instance
      expect(lazy).toBeDefined();
      expect(typeof lazy).toBe('object');
    });

    it('does NOT call the producer at construction time', () => {
      let called = false;
      Lazy.any({
        produce: () => {
          called = true;
          return 1;
        },
      });
      expect(called).toBe(false);
    });
  });

  describe('produce()', () => {
    it('calls the producer and returns its value', () => {
      const lazy = Lazy.any({ produce: () => 99 }) as unknown as Lazy;
      // Access internal produce() through the Lazy instance
      expect((lazy as { produce(): unknown }).produce()).toBe(99);
    });

    it('returns a string value', () => {
      const lazy = Lazy.any({ produce: () => 'hello' }) as unknown as { produce(): unknown };
      expect(lazy.produce()).toBe('hello');
    });

    it('returns a nested object', () => {
      const lazy = Lazy.any({ produce: () => ({ key: 'val' }) }) as unknown as { produce(): unknown };
      expect(lazy.produce()).toEqual({ key: 'val' });
    });

    it('returns null', () => {
      const lazy = Lazy.any({ produce: () => null }) as unknown as { produce(): unknown };
      expect(lazy.produce()).toBeNull();
    });

    it('returns undefined', () => {
      const lazy = Lazy.any({ produce: () => undefined }) as unknown as { produce(): unknown };
      expect(lazy.produce()).toBeUndefined();
    });

    it('calls the producer fresh each time (no caching)', () => {
      let counter = 0;
      const lazy = Lazy.any({ produce: () => ++counter }) as unknown as { produce(): unknown };
      expect(lazy.produce()).toBe(1);
      expect(lazy.produce()).toBe(2);
    });
  });
});
