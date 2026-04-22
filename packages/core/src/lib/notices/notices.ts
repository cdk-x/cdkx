import { IConstruct } from 'constructs';
import { App } from '../app/app';
import { Acknowledgements } from '../acknowledgements/acknowledgements';

export interface Notice {
  /** Unique identifier for this notice */
  readonly id: string;
  /** Title of the notice */
  readonly title: string;
  /** Detailed message */
  readonly message: string;
  /** Severity level */
  readonly severity: 'info' | 'warning' | 'critical';
  /** Optional URL for more information */
  readonly url?: string;
}

/**
 * Global notices system for framework-level announcements.
 * Similar to AWS CDK notices, displayed at the end of synthesis.
 */
export class Notices {
  private static readonly appMap = new WeakMap<App, Notices>();
  private readonly notices: Notice[] = [];

  /**
   * Returns the Notices singleton for the App containing the scope.
   */
  public static of(scope: IConstruct): Notices {
    const app = App.of(scope);

    let instance = Notices.appMap.get(app);
    if (!instance) {
      instance = new Notices();
      Notices.appMap.set(app, instance);
    }

    return instance;
  }

  /**
   * Clears the singleton for testing purposes.
   * @internal
   */
  public static clear(app: App): void {
    Notices.appMap.delete(app);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Adds a global notice.
   * @internal - This should only be called by the framework, not user code
   */
  public add(scope: IConstruct, notice: Notice): void {
    // Check if already acknowledged
    const acks = Acknowledgements.of(scope);
    if (acks.has('', notice.id)) {
      return;
    }

    // Avoid duplicates
    if (this.notices.some((n) => n.id === notice.id)) {
      return;
    }

    this.notices.push(notice);
  }

  /**
   * Returns all active (non-acknowledged) notices.
   */
  public list(): readonly Notice[] {
    return [...this.notices];
  }

  /**
   * Checks if there are any active notices.
   */
  public hasNotices(): boolean {
    return this.notices.length > 0;
  }

  /**
   * Gets the IDs of all notices (for tracking used IDs).
   */
  public getNoticeIds(): Set<string> {
    return new Set(this.notices.map((n) => n.id));
  }
}

/**
 * Predefined framework notices.
 * These are displayed during synthesis unless acknowledged.
 */
export const FrameworkNotices = {
  /** Experimental phase warning */
  EXPERIMENTAL: {
    id: '10001',
    title: 'CDK-X is in Experimental Phase',
    message:
      'CDK-X is currently in active development. APIs, constructs, and behavior may change significantly between releases. Please pin your dependencies to specific versions and review the changelog before upgrading.',
    severity: 'warning' as const,
    url: 'https://github.com/cdk-x/cdkx/blob/main/CHANGELOG.md',
  },
  STABLE: {
    id: '10002',
    title: 'CDK-X is in Stable Phase',
    message:
      'CDK-X has reached a stable phase. APIs, constructs, and behavior are expected to be stable. Please refer to the documentation for guidance on usage.',
    severity: 'info' as const,
    url: 'https://github.com/cdk-x/cdkx/blob/main/CHANGELOG.md',
  },
} as const;
