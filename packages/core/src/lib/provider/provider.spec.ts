import { Provider } from './provider';
import { IStackSynthesizer, JsonSynthesizer } from '../synthesizer/synthesizer';
import { IResolver } from '../resolvables/resolvables';

class MinimalProvider extends Provider {
  public readonly identifier = 'minimal';
}

class ProviderWithResolvers extends Provider {
  public readonly identifier = 'with-resolvers';
  private readonly customResolvers: IResolver[];

  constructor(resolvers: IResolver[]) {
    super();
    this.customResolvers = resolvers;
  }

  public override getResolvers(): IResolver[] {
    return this.customResolvers;
  }
}

class ProviderWithCustomSynth extends Provider {
  public readonly identifier = 'custom-synth';
  private readonly synth: IStackSynthesizer;

  constructor(synth: IStackSynthesizer) {
    super();
    this.synth = synth;
  }

  public override getSynthesizer(): IStackSynthesizer {
    return this.synth;
  }
}

describe('Provider', () => {
  describe('getResolvers()', () => {
    it('returns an empty array by default', () => {
      const provider = new MinimalProvider();
      expect(provider.getResolvers()).toEqual([]);
    });

    it('returns custom resolvers when overridden', () => {
      const r1: IResolver = { resolve: jest.fn() };
      const r2: IResolver = { resolve: jest.fn() };
      const provider = new ProviderWithResolvers([r1, r2]);
      expect(provider.getResolvers()).toEqual([r1, r2]);
    });
  });

  describe('getSynthesizer()', () => {
    it('returns a JsonSynthesizer by default', () => {
      const provider = new MinimalProvider();
      expect(provider.getSynthesizer()).toBeInstanceOf(JsonSynthesizer);
    });

    it('returns a new instance on each call', () => {
      const provider = new MinimalProvider();
      const s1 = provider.getSynthesizer();
      const s2 = provider.getSynthesizer();
      // Different instances — provider creates fresh each time
      expect(s1).not.toBe(s2);
    });

    it('returns the overridden synthesizer when getSynthesizer() is overridden', () => {
      const mockSynth: IStackSynthesizer = {
        bind: jest.fn(),
        synthesize: jest.fn(),
      };
      const provider = new ProviderWithCustomSynth(mockSynth);
      expect(provider.getSynthesizer()).toBe(mockSynth);
    });
  });

  describe('identifier', () => {
    it('exposes the identifier string', () => {
      expect(new MinimalProvider().identifier).toBe('minimal');
    });
  });
});
