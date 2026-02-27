import * as os from 'node:os';
import * as path from 'node:path';
import { App } from '../../lib/app/app.js';
import { Stack } from '../../lib/stack/stack.js';
import { TestProvider } from './test-provider.js';

/**
 * Creates an App with a unique temporary outdir so parallel tests don't collide.
 */
export function makeApp(outdir?: string): App {
  const dir = outdir ?? path.join(os.tmpdir(), `cdkx-test-${Math.random().toString(36).slice(2)}`);
  return new App({ outdir: dir });
}

/**
 * Creates a Stack under the given App using TestProvider.
 */
export function makeStack(app: App, id = 'TestStack', provider = new TestProvider()): Stack {
  return new Stack(app, id, { provider });
}
