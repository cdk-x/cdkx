import * as os from 'node:os';
import * as path from 'node:path';
import { App } from '../../src/lib/app/app';
import { Stack } from '../../src/lib/stack/stack';

/**
 * Creates an App with a unique temporary outdir so parallel tests don't collide.
 */
export function makeApp(outdir?: string): App {
  const dir =
    outdir ??
    path.join(os.tmpdir(), `cdkx-test-${Math.random().toString(36).slice(2)}`);
  return new App({ outdir: dir });
}

/**
 * Creates a Stack under the given App.
 */
export function makeStack(app: App, id = 'TestStack'): Stack {
  return new Stack(app, id, {});
}
