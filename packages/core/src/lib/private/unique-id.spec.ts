import { makeUniqueId } from './unique-id.js';

describe('makeUniqueId', () => {
  // ── Single component (no hash suffix) ────────────────────────────────────
  describe('single component', () => {
    it('returns the component as-is for a simple alphanumeric name', () => {
      expect(makeUniqueId(['MyStack'])).toBe('MyStack');
    });

    it('strips non-alphanumeric characters from a single component', () => {
      expect(makeUniqueId(['my-stack_v2'])).toBe('mystackv2');
    });
  });

  // ── Multi-component (human prefix + 8-char hash) ─────────────────────────
  describe('multi-component', () => {
    it('produces a stable ID for a typical L1 path (Stack/Resource/Resource)', () => {
      const id = makeUniqueId(['HetznerStack', 'WebServer', 'Resource']);
      // human part: 'HetznerStack' + 'WebServer' ('Resource' hidden from human)
      expect(id.startsWith('HetznerStackWebServer')).toBe(true);
      // 8-char uppercase hex hash suffix
      expect(id).toMatch(/[A-F0-9]{8}$/);
      // exact stable value (SHA-256 of 'HetznerStack/WebServer/Resource')
      expect(id).toBe('HetznerStackWebServerF4A2268D');
    });

    it('produces a stable ID for a bare resource (no Resource segment)', () => {
      expect(makeUniqueId(['HetznerStack', 'Firewall'])).toBe(
        'HetznerStackFirewall0C0F9636',
      );
    });

    it('produces a stable ID for FloatingIp', () => {
      expect(makeUniqueId(['HetznerStack', 'FloatingIp', 'Resource'])).toBe(
        'HetznerStackFloatingIpA9D942A1',
      );
    });

    it('produces a stable ID for KubernetesDeployment', () => {
      expect(
        makeUniqueId(['KubernetesStack', 'WebDeployment', 'Resource']),
      ).toBe('KubernetesStackWebDeployment26E91316');
    });

    it('produces a stable ID for KubernetesService', () => {
      expect(makeUniqueId(['KubernetesStack', 'WebService', 'Resource'])).toBe(
        'KubernetesStackWebServiceD2644869',
      );
    });

    it('is deterministic — same input always produces same output', () => {
      const components = ['StackA', 'BucketB', 'Resource'];
      expect(makeUniqueId(components)).toBe(makeUniqueId(components));
    });

    it('produces different IDs for different paths', () => {
      const a = makeUniqueId(['Stack', 'ServerA', 'Resource']);
      const b = makeUniqueId(['Stack', 'ServerB', 'Resource']);
      expect(a).not.toBe(b);
    });
  });

  // ── 'Default' stripping ───────────────────────────────────────────────────
  describe("'Default' segment filtering", () => {
    it("strips 'Default' from both human part and hash input", () => {
      // ['A', 'Default', 'B'] → components treated as ['A', 'B']
      const withDefault = makeUniqueId(['A', 'Default', 'B']);
      const withoutDefault = makeUniqueId(['A', 'B']);
      expect(withDefault).toBe(withoutDefault);
    });

    it("strips multiple 'Default' segments", () => {
      expect(makeUniqueId(['A', 'Default', 'Default', 'B'])).toBe(
        makeUniqueId(['A', 'B']),
      );
    });
  });

  // ── 'Resource' hidden from human, present in hash ─────────────────────────
  describe("'Resource' segment behaviour", () => {
    it("hides 'Resource' from the human part but includes it in the hash", () => {
      const id = makeUniqueId(['Stack', 'Foo', 'Resource']);
      // Human prefix must NOT contain 'Resource'
      const hash = id.slice(-8);
      const human = id.slice(0, -8);
      expect(human).toBe('StackFoo');
      expect(hash).toMatch(/^[A-F0-9]{8}$/);
    });

    it('produces a different ID for same path with and without Resource suffix (hash differs)', () => {
      const withResource = makeUniqueId(['Stack', 'Foo', 'Resource']);
      const withoutResource = makeUniqueId(['Stack', 'Foo']);
      // Human parts are the same, but hash inputs differ → IDs must differ
      expect(withResource).not.toBe(withoutResource);
    });
  });

  // ── Duplicate suffix deduplication ────────────────────────────────────────
  describe('consecutive duplicate suffix deduplication', () => {
    it('deduplicates when previous component ends with the current one', () => {
      // 'FooBar' ends with 'Bar' → 'Bar' is skipped in the human part
      const id = makeUniqueId(['FooBar', 'Bar', 'Resource']);
      expect(id).toBe('FooBar627BCACF');
    });
  });

  // ── Error cases ────────────────────────────────────────────────────────────
  describe('error cases', () => {
    it('throws when all components reduce to empty after Default filtering', () => {
      expect(() => makeUniqueId(['Default'])).toThrow(
        'Unable to calculate a unique id for an empty set of components',
      );
    });

    it('throws for an empty components array', () => {
      expect(() => makeUniqueId([])).toThrow(
        'Unable to calculate a unique id for an empty set of components',
      );
    });
  });
});
