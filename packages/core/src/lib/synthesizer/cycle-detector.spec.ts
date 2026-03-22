import { CycleDetector, CycleError } from './cycle-detector';

describe('CycleDetector', () => {
  describe('detect()', () => {
    it('returns null for an empty dependency map', () => {
      expect(CycleDetector.detect({})).toBeNull();
    });

    it('returns null for a single node with no dependencies', () => {
      expect(CycleDetector.detect({ A: [] })).toBeNull();
    });

    it('returns null for two independent nodes', () => {
      expect(CycleDetector.detect({ A: [], B: [] })).toBeNull();
    });

    it('returns null for a valid chain A → B → C', () => {
      expect(CycleDetector.detect({ A: [], B: ['A'], C: ['B'] })).toBeNull();
    });

    it('returns cycle nodes for a direct two-node cycle A ↔ B', () => {
      const result = CycleDetector.detect({ A: ['B'], B: ['A'] });
      expect(result).not.toBeNull();
      expect(result).toContain('A');
      expect(result).toContain('B');
    });

    it('returns cycle nodes for a three-node cycle A → B → C → A', () => {
      const result = CycleDetector.detect({ A: ['C'], B: ['A'], C: ['B'] });
      expect(result).not.toBeNull();
      expect(result).toHaveLength(3);
    });

    it('returns only the cycle nodes, not uninvolved nodes', () => {
      // D is independent; cycle is A ↔ B
      const result = CycleDetector.detect({ A: ['B'], B: ['A'], D: [] });
      expect(result).not.toBeNull();
      expect(result).toContain('A');
      expect(result).toContain('B');
      expect(result).not.toContain('D');
    });
  });
});

describe('CycleError', () => {
  it('extends Error', () => {
    expect(new CycleError(['A', 'B'])).toBeInstanceOf(Error);
  });

  it('exposes cycleNodes', () => {
    const err = new CycleError(['A', 'B']);
    expect(err.cycleNodes).toEqual(['A', 'B']);
  });

  it('includes node IDs in the message', () => {
    const err = new CycleError(['StackA', 'StackB']);
    expect(err.message).toContain('StackA');
    expect(err.message).toContain('StackB');
  });
});
