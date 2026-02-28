import { App, Stack, StackProps } from '@cdk-x/core';
import { TestProvider } from './test-provider.js';

/**
 * A test-friendly Stack that defaults to a `TestProvider` when none is provided.
 *
 * Accepts the full `StackProps` for maximum flexibility.
 * Extend this class to create Stack variants with specific configurations:
 * @example
 * class StackWithCustomSynthesizer extends TestStack {
 *   constructor(scope: App, id: string) {
 *     super(scope, id, { provider: new TestProvider(), synthesizer: mySynthesizer });
 *   }
 * }
 */
export class TestStack extends Stack {
  constructor(scope: App, id = 'TestStack', props?: Partial<StackProps>) {
    super(scope, id, {
      provider: new TestProvider(),
      ...props,
    });
  }
}
