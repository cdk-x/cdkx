import { Provider } from '@cdk-x/core';
import { Location } from '../common/common.js';

/**
 * Configuration properties for {@link HetznerProvider}.
 *
 * `projectName` and `apiToken` are always required. `location` and `datacenter`
 * are optional stack-level defaults — resources that do not specify their own
 * location/datacenter will use these values at deploy time.
 *
 * **Credentials note:** `apiToken` is stored on the provider instance and
 * accessible via the `apiToken` getter for the engine to use at deploy time.
 * It is intentionally NOT serialized into `manifest.json`. For L2 constructs
 * that need to look up existing resources at synthesis time (similar to AWS CDK
 * `fromLookup()` methods), the engine will resolve the token from this getter
 * or from environment variables (`HETZNER_API_TOKEN`).
 */
export interface HetznerProviderProps {
  /**
   * Human-readable name of the Hetzner Cloud project.
   *
   * The Hetzner API does not expose the project name — the API token already
   * implies the project. This field is written to `manifest.json` so the
   * engine knows which project it is deploying to.
   */
  readonly projectName: string;

  /**
   * Hetzner Cloud API token for this project.
   *
   * Generated in the Hetzner Console under Security → API Tokens.
   * Each project has its own token. Do NOT commit this value — use an
   * environment variable (e.g. `process.env.HETZNER_API_TOKEN`) in your
   * cdkx app entry point.
   *
   * Accessible via `HetznerProvider.apiToken` for the engine at deploy time.
   * Never written to `manifest.json`.
   */
  readonly apiToken: string;

  /**
   * Default physical location for resources in this stack.
   *
   * When a resource does not specify its own `location`, the engine will use
   * this value. Use the {@link Location} enum for type safety.
   *
   * `location` and `datacenter` are mutually exclusive at the resource level
   * in the Hetzner API. You may set one, the other, or neither on the provider —
   * individual resources can always override.
   */
  readonly location?: Location;

  /**
   * Default datacenter for resources in this stack (e.g. `'nbg1-dc3'`).
   *
   * More specific than `location`. When set, the engine will use this datacenter
   * as the default for resources that support it (e.g. Servers with a
   * PlacementGroup). Note: Hetzner is deprecating `datacenter` on Servers
   * in favour of `location` — prefer `location` unless you need datacenter-level
   * control.
   */
  readonly datacenter?: string;
}

/**
 * Hetzner Cloud provider for cdkx.
 *
 * Attach this provider to a {@link Stack} to synthesize Hetzner Cloud resource
 * manifests. The `projectName`, `location`, and `datacenter` are written to
 * `manifest.json` so the engine knows where to deploy. The `apiToken` is kept
 * in memory only — never serialized.
 *
 * @example
 * const provider = new HetznerProvider({
 *   projectName: 'my-project',
 *   apiToken: process.env.HETZNER_API_TOKEN!,
 *   location: Location.NBG1,
 * });
 *
 * const stack = new Stack(app, 'MyStack', { provider });
 */
export class HetznerProvider extends Provider {
  readonly identifier = 'Hetzner';

  constructor(private readonly props: HetznerProviderProps) {
    super();
  }

  /**
   * The Hetzner Cloud API token for this project.
   *
   * Used by the engine at deploy time to authenticate against the Hetzner API.
   * Also used by L2 `fromLookup()` methods at synthesis time when context
   * population is needed (similar to AWS CDK context API / cxapi).
   *
   * Never written to `manifest.json`.
   */
  get apiToken(): string {
    return this.props.apiToken;
  }

  /**
   * Returns non-sensitive deployment target metadata written to `manifest.json`.
   *
   * Always includes `projectName`. Includes `location` and/or `datacenter`
   * only when they were provided in the constructor.
   *
   * The `apiToken` is intentionally excluded — it is a credential.
   */
  override getEnvironment(): Record<string, unknown> {
    const env: Record<string, unknown> = {
      projectName: this.props.projectName,
    };
    if (this.props.location !== undefined) {
      env['location'] = this.props.location;
    }
    if (this.props.datacenter !== undefined) {
      env['datacenter'] = this.props.datacenter;
    }
    return env;
  }
}
