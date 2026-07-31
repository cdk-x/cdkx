import { Construct, IConstruct, RootConstruct } from 'constructs';
import { AncestorWalker } from './ancestors.js';

class DummyMatch extends Construct {}
class DummyOther extends Construct {}

const isDummyMatch = (candidate: IConstruct): candidate is DummyMatch => candidate instanceof DummyMatch;

describe('AncestorWalker', () => {
  describe('findNearest', () => {
    it('returns the matching ancestor at an intermediate level of the chain', () => {
      const root = new RootConstruct('Root');
      const a = new DummyOther(root, 'A');
      const b = new DummyMatch(a, 'B');
      const c = new DummyOther(b, 'C');
      const target = new DummyOther(c, 'Target');

      const result = AncestorWalker.findNearest(target, isDummyMatch, () => false);

      expect(result).toBe(b);
    });

    it('returns undefined when no ancestor matches before the root', () => {
      const root = new RootConstruct('Root');
      const a = new DummyOther(root, 'A');
      const target = new DummyOther(a, 'Target');

      const result = AncestorWalker.findNearest(target, isDummyMatch, () => false);

      expect(result).toBeUndefined();
    });

    it('returns undefined when the only matching candidate is beyond a stopAt node', () => {
      const root = new RootConstruct('Root');
      const match = new DummyMatch(root, 'Match');
      const boundary = new DummyOther(match, 'Boundary');
      const target = new DummyOther(boundary, 'Target');

      const result = AncestorWalker.findNearest(
        target,
        isDummyMatch,
        (candidate) => candidate === boundary,
      );

      expect(result).toBeUndefined();
    });

    it('treats a node satisfying both isMatch and stopAt as the stop boundary, not a match', () => {
      const root = new RootConstruct('Root');
      const both = new DummyMatch(root, 'Both');
      const target = new DummyOther(both, 'Target');

      const result = AncestorWalker.findNearest(
        target,
        isDummyMatch,
        (candidate) => candidate === both,
      );

      expect(result).toBeUndefined();
    });

    it('returns undefined when called on a construct that is already the root', () => {
      const root = new RootConstruct('Root');

      const result = AncestorWalker.findNearest(root, isDummyMatch, () => false);

      expect(result).toBeUndefined();
    });

    it('does not consider the starting construct itself as a valid result', () => {
      const root = new RootConstruct('Root');
      const target = new DummyMatch(root, 'Target');

      const result = AncestorWalker.findNearest(target, isDummyMatch, () => false);

      expect(result).toBeUndefined();
    });
  });

  describe('type-level checks', () => {
    it('does not allow direct instantiation (private constructor)', () => {
      // @ts-expect-error - AncestorWalker's constructor is private; it is a static-only utility class
      const instance = new AncestorWalker();
      expect(instance).toBeInstanceOf(AncestorWalker);
    });
  });
});
