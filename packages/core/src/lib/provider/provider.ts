import { IResolver } from '../resolvables/resolvables.js';
import {
  IStackSynthesizer,
  JsonSynthesizer,
} from '../synthesizer/synthesizer.js';

/**
 * Abstract base class for all cdkx providers.
 *
 * A Provider represents the configuration and behaviour for a specific target platform
 * (e.g. Kubernetes, Hetzner Cloud, GitHub Actions). Each provider encapsulates:
 *
 * - A unique `identifier` string used in `ResolveContext.provider` and in `manifest.json`
 * - Optional custom `IResolver` instances that are injected into the resolver pipeline
 *   before the built-in resolvers, enabling provider-specific token resolution
 *   (e.g. a `SecretRef` that resolves to `${{ secrets.NAME }}` in GitHub Actions vs
 *   `{ secretKeyRef: { name, key } }` in Kubernetes)
 * - A default `IStackSynthesizer` that controls how stacks are serialized
 *   (e.g. `YamlSynthesizer` for Kubernetes, `JsonSynthesizer` for Hetzner)
 *
 * Provider packages (e.g. `@cdkx/kubernetes`, `@cdkx/hetzner`) extend this class and
 * accept their own configuration in the constructor (credentials, datacenter, cluster, etc.).
 * That configuration is intentionally NOT serialized into the synthesis output — it is
 * runtime-only information used by the deployer CLI.
 *
 * @example
 * // In @cdkx/hetzner:
 * export class HetznerProvider extends Provider {
 *   public readonly identifier = 'hetzner';
 *   constructor(private readonly config: HetznerConfig) { super(); }
 * }
 *
 * // In @cdkx/kubernetes:
 * export class KubernetesProvider extends Provider {
 *   public readonly identifier = 'kubernetes';
 *   constructor(private readonly config: KubeConfig) { super(); }
 *   public override getSynthesizer(): IStackSynthesizer {
 *     return new YamlSynthesizer();
 *   }
 * }
 */
export abstract class Provider {
  /**
   * Unique identifier for this provider type.
   * Used in `ResolveContext.provider` during synthesis and written to `manifest.json`.
   * Examples: `'kubernetes'`, `'hetzner'`, `'github-actions'`
   */
  public abstract readonly identifier: string;

  /**
   * Returns provider-specific resolvers to be prepended to the resolver pipeline
   * when synthesizing stacks that use this provider.
   *
   * Custom resolvers run before the built-in `LazyResolver` and `ImplicitTokenResolver`,
   * allowing them to intercept any value first.
   *
   * Override this method in provider subclasses to register custom token resolvers.
   *
   * @returns An ordered list of `IResolver` instances. Default: empty array.
   */
  public getResolvers(): IResolver[] {
    return [];
  }

  /**
   * Returns the default synthesizer for stacks that use this provider.
   *
   * Override in provider subclasses to change the output format.
   * For example, a `KubernetesProvider` would return a `YamlSynthesizer`.
   *
   * @returns An `IStackSynthesizer` instance. Default: `JsonSynthesizer`.
   */
  public getSynthesizer(): IStackSynthesizer {
    return new JsonSynthesizer();
  }

  /**
   * Returns provider-specific environment metadata written into `manifest.json`.
   *
   * This is the information the runtime engine needs to know WHERE and HOW to
   * deploy the stack — e.g. the Hetzner project, the Kubernetes cluster API
   * server, the GitHub org, etc.
   *
   * Override in provider subclasses to expose deployment target metadata.
   * The returned object must be JSON-serializable; do NOT include credentials.
   *
   * @example
   * // In @cdkx/hetzner:
   * public override getEnvironment() {
   *   return { project: this.config.project, datacenter: this.config.datacenter };
   * }
   *
   * @example
   * // In @cdkx/kubernetes:
   * public override getEnvironment() {
   *   return { cluster: this.config.clusterName, apiServer: this.config.apiServer };
   * }
   *
   * @returns A plain JSON-serializable object. Default: `{}`.
   */
  public getEnvironment(): Record<string, unknown> {
    return {};
  }
}
