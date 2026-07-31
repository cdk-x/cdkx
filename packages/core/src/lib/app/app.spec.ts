import { App } from './app.js';

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
});
