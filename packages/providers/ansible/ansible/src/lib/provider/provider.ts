import { Provider } from '@cdk-x/core';

// ─── AnsibleProvider ──────────────────────────────────────────────────────────

/**
 * Provider for Ansible resources.
 *
 * Pass an instance of this class to `Stack` to synthesize Ansible
 * resource manifests.
 *
 * @example
 * ```ts
 * const provider = new AnsibleProvider();
 * const stack = new Stack(app, 'MyStack', { provider });
 * ```
 */
export class AnsibleProvider extends Provider {
  public readonly identifier = 'ansible';
}
