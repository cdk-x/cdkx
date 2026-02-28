import { Provider } from '@cdk-x/core';
import { IStackSynthesizer } from '@cdk-x/core';

/**
 * Minimal concrete Provider for use in tests.
 * Uses the default JsonSynthesizer and returns no custom resolvers.
 */
export class TestProvider extends Provider {
  public readonly identifier: string;

  constructor(identifier = 'test') {
    super();
    this.identifier = identifier;
  }
}

/**
 * Provider that records which resolvers were requested (for pipeline cache tests).
 */
export class SpyProvider extends Provider {
  public readonly identifier = 'spy';
  public getResolversCalled = 0;

  public override getResolvers() {
    this.getResolversCalled++;
    return [];
  }
}

/**
 * Provider that overrides the default synthesizer.
 */
export class CustomSynthesizerProvider extends Provider {
  public readonly identifier = 'custom-synth';

  constructor(private readonly customSynthesizer: IStackSynthesizer) {
    super();
  }

  public override getSynthesizer(): IStackSynthesizer {
    return this.customSynthesizer;
  }
}
