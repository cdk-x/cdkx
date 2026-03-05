import { EventBus } from './event-bus';

describe('EventBus', () => {
  interface TestEvent {
    value: number;
  }

  let bus: EventBus<TestEvent>;

  beforeEach(() => {
    bus = new EventBus<TestEvent>();
  });

  describe('subscribe', () => {
    it('returns an unsubscribe function', () => {
      const unsubscribe = bus.subscribe(() => undefined);
      expect(typeof unsubscribe).toBe('function');
    });

    it('registers the handler so it receives emitted events', () => {
      const received: TestEvent[] = [];
      bus.subscribe((e) => received.push(e));

      bus.emit({ value: 1 });

      expect(received).toHaveLength(1);
      expect(received[0].value).toBe(1);
    });

    it('allows multiple independent handlers', () => {
      const calls: number[] = [];
      bus.subscribe(() => calls.push(1));
      bus.subscribe(() => calls.push(2));

      bus.emit({ value: 0 });

      expect(calls).toEqual([1, 2]);
    });

    it('delivers multiple emitted events to all handlers', () => {
      const received: TestEvent[] = [];
      bus.subscribe((e) => received.push(e));

      bus.emit({ value: 1 });
      bus.emit({ value: 2 });
      bus.emit({ value: 3 });

      expect(received.map((e) => e.value)).toEqual([1, 2, 3]);
    });
  });

  describe('unsubscribe (returned function)', () => {
    it('stops the handler from receiving subsequent events', () => {
      const received: TestEvent[] = [];
      const unsubscribe = bus.subscribe((e) => received.push(e));

      bus.emit({ value: 1 });
      unsubscribe();
      bus.emit({ value: 2 });

      expect(received).toHaveLength(1);
      expect(received[0].value).toBe(1);
    });

    it('does not affect other handlers', () => {
      const first: TestEvent[] = [];
      const second: TestEvent[] = [];

      const unsubscribeFirst = bus.subscribe((e) => first.push(e));
      bus.subscribe((e) => second.push(e));

      bus.emit({ value: 1 });
      unsubscribeFirst();
      bus.emit({ value: 2 });

      expect(first).toHaveLength(1);
      expect(second).toHaveLength(2);
    });

    it('is idempotent — calling it twice does not throw', () => {
      const unsubscribe = bus.subscribe(() => undefined);
      expect(() => {
        unsubscribe();
        unsubscribe();
      }).not.toThrow();
    });
  });

  describe('emit', () => {
    it('does nothing when there are no subscribers', () => {
      expect(() => bus.emit({ value: 42 })).not.toThrow();
    });

    it('passes the exact event object to each handler', () => {
      const received: TestEvent[] = [];
      bus.subscribe((e) => received.push(e));

      const event: TestEvent = { value: 99 };
      bus.emit(event);

      expect(received[0]).toBe(event);
    });
  });

  describe('clear', () => {
    it('removes all handlers', () => {
      const received: TestEvent[] = [];
      bus.subscribe((e) => received.push(e));
      bus.subscribe((e) => received.push(e));

      bus.clear();
      bus.emit({ value: 1 });

      expect(received).toHaveLength(0);
    });

    it('sets size to 0', () => {
      bus.subscribe(() => undefined);
      bus.subscribe(() => undefined);
      bus.clear();

      expect(bus.size).toBe(0);
    });
  });

  describe('size', () => {
    it('is 0 when no handlers are registered', () => {
      expect(bus.size).toBe(0);
    });

    it('increments on each subscribe', () => {
      bus.subscribe(() => undefined);
      expect(bus.size).toBe(1);

      bus.subscribe(() => undefined);
      expect(bus.size).toBe(2);
    });

    it('decrements when a handler unsubscribes', () => {
      const unsub = bus.subscribe(() => undefined);
      expect(bus.size).toBe(1);

      unsub();
      expect(bus.size).toBe(0);
    });
  });
});
