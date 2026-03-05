import { Construct } from 'constructs';
import { StackOutput } from './stack-output';
import { IResolvable, ResolveContext } from '../resolvables/resolvables';

/** Minimal resolvable token for tests. */
class TestToken implements IResolvable {
  constructor(private readonly resolved: unknown) {}
  resolve(_context: ResolveContext): unknown {
    return this.resolved;
  }
}

describe('StackOutput', () => {
  let root: Construct;

  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    root = new Construct(undefined as any, '');
  });

  describe('isStackOutput()', () => {
    it('returns true for a StackOutput instance', () => {
      const output = new StackOutput(root, 'MyOutput', { value: 'hello' });
      expect(StackOutput.isStackOutput(output)).toBe(true);
    });

    it('returns false for a plain Construct', () => {
      const construct = new Construct(root, 'NotAnOutput');
      expect(StackOutput.isStackOutput(construct)).toBe(false);
    });

    it('returns false for null', () => {
      expect(StackOutput.isStackOutput(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(StackOutput.isStackOutput(undefined)).toBe(false);
    });
  });

  describe('outputKey', () => {
    it('equals the construct id', () => {
      const output = new StackOutput(root, 'ServerIp', { value: '1.2.3.4' });
      expect(output.outputKey).toBe('ServerIp');
    });
  });

  describe('value', () => {
    it('stores a string literal value', () => {
      const output = new StackOutput(root, 'Url', {
        value: 'https://example.com',
      });
      expect(output.value).toBe('https://example.com');
    });

    it('stores a number literal value', () => {
      const output = new StackOutput(root, 'Port', { value: 8080 });
      expect(output.value).toBe(8080);
    });

    it('stores an IResolvable token', () => {
      const token = new TestToken({ ref: 'MyRes123', attr: 'serverId' });
      const output = new StackOutput(root, 'ServerId', { value: token });
      expect(output.value).toBe(token);
    });
  });

  describe('description', () => {
    it('is undefined when not provided', () => {
      const output = new StackOutput(root, 'Key', { value: 'v' });
      expect(output.description).toBeUndefined();
    });

    it('stores the description when provided', () => {
      const output = new StackOutput(root, 'Key', {
        value: 'v',
        description: 'The server IP address',
      });
      expect(output.description).toBe('The server IP address');
    });
  });

  describe('construct tree', () => {
    it('is a child of its scope', () => {
      const output = new StackOutput(root, 'MyOutput', { value: 'x' });
      expect(root.node.children).toContain(output);
    });

    it('has a node path that includes the id', () => {
      const output = new StackOutput(root, 'MyOutput', { value: 'x' });
      expect(output.node.path).toContain('MyOutput');
    });

    it('multiple outputs with different ids can coexist under same scope', () => {
      const out1 = new StackOutput(root, 'Output1', { value: '1' });
      const out2 = new StackOutput(root, 'Output2', { value: '2' });
      expect(root.node.children).toContain(out1);
      expect(root.node.children).toContain(out2);
    });
  });
});
