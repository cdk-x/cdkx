import { App, Stack, StackProps } from '@cdkx-io/core';

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
  public static default(scope: App, props: StackProps): Stack {
    return new Stack(scope, 'DefaultTestStack', props);
  }
}
