import * as os from 'node:os';
import * as path from 'node:path';
import { App, AppProps } from '@cdk-x/core';

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
  constructor(outdir?: string, props?: Omit<AppProps, 'outdir'>) {
    const dir =
      outdir ??
      path.join(
        os.tmpdir(),
        `cdkx-test-${Math.random().toString(36).slice(2)}`,
      );
    super({ ...props, outdir: dir });
  }
}
