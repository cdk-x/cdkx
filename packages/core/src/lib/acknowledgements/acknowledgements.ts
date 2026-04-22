import { IConstruct } from 'constructs';
import { App } from '../app/app';

/**
 * Singleton per App that tracks acknowledged annotation IDs.
 * Used by Annotations to filter out acknowledged warnings/info.
 */
export class Acknowledgements {
  private static readonly appMap = new WeakMap<App, Acknowledgements>();

  /**
   * Returns the Acknowledgements singleton for the App containing the scope.
   */
  public static of(scope: IConstruct): Acknowledgements {
    const app = App.of(scope);

    let instance = Acknowledgements.appMap.get(app);
    if (!instance) {
      instance = new Acknowledgements();
      Acknowledgements.appMap.set(app, instance);
    }

    return instance;
  }

  /**
   * Clears the singleton for testing purposes.
   * @internal
   */
  public static clear(app: App): void {
    Acknowledgements.appMap.delete(app);
  }

  private readonly acks = new Map<string, Set<string>>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Registers an acknowledgement for a construct scope.
   * The acknowledgement applies to this scope and all children.
   */
  public add(node: string | IConstruct, ack: string): void {
    const nodePath = typeof node === 'string' ? node : node.node.path;
    const normalizedPath = nodePath.replace(/^\//, '');

    let set = this.acks.get(normalizedPath);
    if (!set) {
      set = new Set();
      this.acks.set(normalizedPath, set);
    }
    set.add(ack);
  }

  /**
   * Checks if an ID is acknowledged for a construct scope.
   * Also checks parent scopes (parent acknowledgement applies to children).
   */
  public has(node: string | IConstruct, ack: string): boolean {
    const nodePath = typeof node === 'string' ? node : node.node.path;
    const normalizedPath = nodePath.replace(/^\//, '');

    for (const candidate of this.searchPaths(normalizedPath)) {
      if (this.acks.get(candidate)?.has(ack)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns all acknowledged IDs for a given scope (not including parents).
   */
  public getAcknowledgedIds(node: string | IConstruct): Set<string> {
    const nodePath = typeof node === 'string' ? node : node.node.path;
    const normalizedPath = nodePath.replace(/^\//, '');
    return new Set(this.acks.get(normalizedPath) ?? []);
  }

  /**
   * Given 'a/b/c', return ['a/b/c', 'a/b', 'a', ''] for parent inheritance.
   * The empty string represents the root/App scope.
   */
  private searchPaths(path: string): string[] {
    const ret: string[] = [];
    let start = 0;

    while (start < path.length) {
      const i = path.indexOf('/', start);
      if (i !== -1) {
        ret.push(path.substring(0, i));
        start = i + 1;
      } else {
        start = path.length;
      }
    }

    // Always include the full path first
    if (path.length > 0) {
      ret.unshift(path);
    }

    // Include root scope (empty string) for global acknowledgements
    ret.push('');

    return ret;
  }
}
