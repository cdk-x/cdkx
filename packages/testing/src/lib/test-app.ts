import { App } from '@cdk-x/core';

/**
 * A test-friendly App that auto-generates a unique temporary outdir
 * when none is provided, so parallel tests never collide.
 *
 * Extend this class to create App variants with specific configurations:
 * @example
 * class AppWithGlobalResolver extends TestApp {
 *   constructor() {
 *     super(undefined, { resolvers: [myResolver] });
 *   }
 * }
 */
export class TestApp extends App {
  public static default(): App {
    return new App();
  }
}
