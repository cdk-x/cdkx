import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { Resource } from '../resource/resource.js';
import { Stack } from '../stack/stack.js';
import { App } from './app.js';

function tmpOutdir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cdkx-test-'));
}

class DummyResource extends Resource {
  public readonly resourceType = 'Dummy';
  public readonly apiVersion = 'dummy.cdk-x.com/v1';

  protected toProperties(): Record<string, unknown> {
    return { name: 'thing' };
  }
}

describe('App', () => {
  it('creates an App instance with the default outdir when no props are given', () => {
    const app = new App();
    expect(app.outdir).toBe('cdkx.out');
  });

  it('creates an App instance with the outdir from props when provided', () => {
    const app = new App({ outdir: 'custom.out' });
    expect(app.outdir).toBe('custom.out');
  });

  describe('isApp', () => {
    it('returns true for an App instance', () => {
      const app = new App();
      expect(App.isApp(app)).toBe(true);
    });

    it('returns false for a non-App value', () => {
      expect(App.isApp({})).toBe(false);
    });
  });

  describe('synth', () => {
    it('writes a resource assembly (manifest.json + <StackId>.json) to outdir', () => {
      const outdir = tmpOutdir();
      const app = new App({ outdir });
      const stack = new Stack(app, 'TestStack');
      new DummyResource(stack, 'Thing');

      const manifests = app.synth();

      const manifestJson = JSON.parse(
        fs.readFileSync(path.join(outdir, 'manifest.json'), 'utf-8'),
      );
      expect(manifestJson.artifacts.TestStack.properties.templateFile).toBe(
        'TestStack.json',
      );

      const stackJson = JSON.parse(
        fs.readFileSync(path.join(outdir, 'TestStack.json'), 'utf-8'),
      );
      expect(stackJson).toEqual(manifests['TestStack']);
    });
  });
});
