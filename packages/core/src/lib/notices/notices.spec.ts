import { Construct } from 'constructs';
import { App } from '../app/app';
import { Acknowledgements } from '../acknowledgements/acknowledgements';
import { Notices, FrameworkNotices } from './notices';

describe('Notices', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  afterEach(() => {
    Notices.clear(app);
    try {
      Acknowledgements.clear(app);
    } catch {
      // Ignore
    }
  });

  describe('singleton behavior', () => {
    it('should return same instance for same app', () => {
      const child = new Construct(app, 'Child');

      const notices1 = Notices.of(app);
      const notices2 = Notices.of(child);

      expect(notices1).toBe(notices2);
    });

    it('should return different instances for different apps', () => {
      const app2 = new App();

      const notices1 = Notices.of(app);
      const notices2 = Notices.of(app2);

      expect(notices1).not.toBe(notices2);

      Notices.clear(app2);
    });
  });

  describe('add and list', () => {
    it('should add and list notices', () => {
      const notices = Notices.of(app);

      notices.add(app, {
        id: 'test-001',
        title: 'Test Notice',
        message: 'This is a test',
        severity: 'info',
      });

      const list = notices.list();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('test-001');
    });

    it('should not add duplicate notices', () => {
      const notices = Notices.of(app);

      notices.add(app, {
        id: 'test-001',
        title: 'Test Notice',
        message: 'This is a test',
        severity: 'info',
      });
      notices.add(app, {
        id: 'test-001',
        title: 'Different Title',
        message: 'Different message',
        severity: 'warning',
      });

      expect(notices.list()).toHaveLength(1);
    });

    it('should filter out acknowledged notices', () => {
      const notices = Notices.of(app);
      const acks = Acknowledgements.of(app);

      // Acknowledge before adding
      acks.add('', 'test-001');

      notices.add(app, {
        id: 'test-001',
        title: 'Test Notice',
        message: 'This is a test',
        severity: 'info',
      });

      expect(notices.list()).toHaveLength(0);
    });
  });

  describe('hasNotices', () => {
    it('should return false when no notices', () => {
      const notices = Notices.of(app);
      expect(notices.hasNotices()).toBe(false);
    });

    it('should return true when there are notices', () => {
      const notices = Notices.of(app);
      notices.add(app, {
        id: 'test-001',
        title: 'Test',
        message: 'Test message',
        severity: 'info',
      });
      expect(notices.hasNotices()).toBe(true);
    });
  });

  describe('FrameworkNotices', () => {
    it('should have EXPERIMENTAL notice defined', () => {
      expect(FrameworkNotices.EXPERIMENTAL.id).toBe('10001');
      expect(FrameworkNotices.EXPERIMENTAL.severity).toBe('warning');
    });
  });
});
