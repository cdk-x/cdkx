import type {
  CreateResult,
  ManifestResource,
  ProviderAdapter,
  UpdateResult,
} from '@cdk-x/engine';
import { ActionPoller, type ActionPollerOptions } from './action-poller';
import { HetznerClient, type HetznerClientOptions } from './hetzner-client';
import { RESOURCE_REGISTRY } from '../generated/resource-registry.generated';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HetznerAdapterOptions {
  /** Hetzner Cloud API token. */
  readonly apiToken: string;
  /** Override the base URL (default: https://api.hetzner.cloud/v1). */
  readonly baseUrl?: string;
  /** Options forwarded to the ActionPoller (poll interval, timeout). */
  readonly pollerOptions?: ActionPollerOptions;
}

/** Shape of a Hetzner API response that may contain an async action. */
interface WithAction {
  action?: { id: number };
}

// ─── HetznerAdapter ───────────────────────────────────────────────────────────

/**
 * Concrete {@link ProviderAdapter} for the Hetzner Cloud API.
 *
 * Translates cdkx engine calls (create / update / delete / getOutput) into
 * Hetzner Cloud REST API requests. Async Hetzner actions are polled
 * transparently — the engine never sees an action ID.
 *
 * @example
 * ```ts
 * const adapter = new HetznerAdapter({ apiToken: process.env.HCLOUD_TOKEN! });
 * // pass to DeploymentEngine: { adapters: { hetzner: adapter } }
 * ```
 */
export class HetznerAdapter implements ProviderAdapter {
  private readonly client: HetznerClient;
  private readonly poller: ActionPoller;

  constructor(options: HetznerAdapterOptions) {
    const clientOptions: HetznerClientOptions = {
      apiToken: options.apiToken,
      baseUrl: options.baseUrl,
    };
    this.client = new HetznerClient(clientOptions);
    this.poller = new ActionPoller(this.client, options.pollerOptions);
  }

  // ─── create ────────────────────────────────────────────────────────────────

  /**
   * Create a Hetzner Cloud resource.
   *
   * For action resources (Subnet, Route), the `{networkId}` placeholder in
   * `createPath` is substituted from the resolved `resource.properties`.
   * Async Hetzner actions are polled until completion before returning.
   *
   * @returns `{ physicalId, outputs }` — `physicalId` is stored in EngineState
   *   for all subsequent update/delete/getOutput calls.
   */
  public async create(resource: ManifestResource): Promise<CreateResult> {
    const config = this.requireConfig(resource.type);

    const path = config.isActionResource
      ? this.substituteNetworkId(config.createPath, resource.properties)
      : config.createPath;

    // For action resources the body is the full properties minus the parent ID.
    // For regular resources the body is the full properties object.
    const body = config.isActionResource
      ? this.omitParentId(resource.properties, config.parentIdProp)
      : resource.properties;

    const response = await this.client.post<WithAction>(path, body);

    // Poll async action if present
    if (response.action !== undefined) {
      await this.poller.poll(response.action.id);
    }

    const physicalId = config.extractPhysicalId(response, resource.properties);
    const outputs = config.extractOutputs(response);

    return {
      physicalId,
      outputs: Object.keys(outputs).length > 0 ? outputs : undefined,
    };
  }

  // ─── update ────────────────────────────────────────────────────────────────

  /**
   * Update a mutable Hetzner Cloud resource.
   *
   * Throws if `patch` contains any `createOnlyProperties` — these cannot be
   * changed after creation and require resource replacement instead. Strips
   * any read-only or excluded props before sending the PUT request.
   *
   * Action resources (Subnet, Route) are fully immutable — calling update on
   * them always throws.
   */
  public async update(
    resource: ManifestResource,
    patch: unknown,
  ): Promise<UpdateResult> {
    const config = this.requireConfig(resource.type);

    if (config.isActionResource) {
      throw new Error(
        `Resource type '${resource.type}' is an action resource and cannot be ` +
          `updated in place. Remove and re-create the resource to change its configuration.`,
      );
    }

    if (config.updatePath === undefined) {
      throw new Error(
        `Resource type '${resource.type}' has no updatePath defined in the registry.`,
      );
    }

    const physicalId = this.requirePhysicalId(resource);
    const patchRecord = patch as Record<string, unknown>;

    // Detect create-only props in the patch and throw
    const violatingProps = [...config.createOnlyProps].filter((prop) =>
      Object.prototype.hasOwnProperty.call(patchRecord, prop),
    );
    if (violatingProps.length > 0) {
      throw new Error(
        `Cannot update create-only ${violatingProps.length === 1 ? 'property' : 'properties'} ` +
          `on '${resource.type}': ${violatingProps.join(', ')}. ` +
          `These can only be set at creation time.`,
      );
    }

    // Strip create-only and any additional excluded props before sending
    const excluded = new Set([
      ...config.createOnlyProps,
      ...(config.updateExcludeProps ?? []),
    ]);
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patchRecord)) {
      if (!excluded.has(key)) {
        body[key] = value;
      }
    }

    const response = await this.client.put<WithAction>(
      config.updatePath(physicalId),
      body,
    );

    // Some update endpoints return an async action
    if (response.action !== undefined) {
      await this.poller.poll(response.action.id);
    }

    const outputs = config.extractOutputs(response);
    return {
      outputs: Object.keys(outputs).length > 0 ? outputs : undefined,
    };
  }

  // ─── delete ────────────────────────────────────────────────────────────────

  /**
   * Delete a Hetzner Cloud resource by its physical ID.
   *
   * For action resources (Subnet, Route), a POST to the parent network's
   * action endpoint is made. The `physicalId` encodes `{networkId}:{discriminator}`
   * but we use `resource.properties` (fully resolved by the engine) to build
   * the request body instead of parsing the composite ID.
   */
  public async delete(resource: ManifestResource): Promise<void> {
    const config = this.requireConfig(resource.type);

    if (config.isActionResource) {
      await this.deleteActionResource(resource, config.deletePath as string);
      return;
    }

    const physicalId = this.requirePhysicalId(resource);
    const path =
      typeof config.deletePath === 'function'
        ? config.deletePath(physicalId)
        : config.deletePath;

    await this.client.delete(path);
  }

  // ─── validate ──────────────────────────────────────────────────────────────

  /**
   * Pre-deployment validation. Verifies the resource type is known.
   * Create-only prop enforcement happens at `update()` time.
   */
  public async validate(resource: ManifestResource): Promise<void> {
    if (RESOURCE_REGISTRY[resource.type] === undefined) {
      throw new Error(
        `Unknown Hetzner resource type: '${resource.type}'. ` +
          `Ensure the type is registered in the ResourceRegistry.`,
      );
    }
  }

  // ─── getOutput ─────────────────────────────────────────────────────────────

  /**
   * Read a named output attribute from an already-created resource by calling
   * the Hetzner GET endpoint and extracting the named attribute.
   *
   * For action resources (Subnet, Route) which have no GET endpoint, this
   * always returns `undefined` — they produce no output attributes.
   */
  public async getOutput(
    resource: ManifestResource,
    attr: string,
  ): Promise<unknown> {
    const config = this.requireConfig(resource.type);

    if (config.isActionResource || config.getPath === undefined) {
      return undefined;
    }

    const physicalId = this.requirePhysicalId(resource);
    const response = await this.client.get<unknown>(config.getPath(physicalId));
    const outputs = config.extractOutputs(response);
    return outputs[attr];
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private requireConfig(type: string) {
    const config = RESOURCE_REGISTRY[type];
    if (config === undefined) {
      throw new Error(
        `Unknown Hetzner resource type: '${type}'. ` +
          `Ensure the type is registered in the ResourceRegistry.`,
      );
    }
    return config;
  }

  private requirePhysicalId(resource: ManifestResource): string {
    if (resource.physicalId === undefined) {
      throw new Error(
        `HetznerAdapter: physicalId is required for resource '${resource.logicalId}' ` +
          `(type: '${resource.type}') but was not provided. ` +
          `This is set by the engine after a successful create().`,
      );
    }
    return resource.physicalId;
  }

  private substituteNetworkId(
    template: string,
    properties: Record<string, unknown>,
  ): string {
    const networkId = properties['networkId'];
    if (networkId === undefined || networkId === null) {
      throw new Error(
        `Action resource path template '${template}' requires 'networkId' in ` +
          `properties, but it was not found.`,
      );
    }
    return template.replace('{networkId}', String(networkId));
  }

  private omitParentId(
    properties: Record<string, unknown>,
    parentIdProp: string | undefined,
  ): Record<string, unknown> {
    if (parentIdProp === undefined) {
      return properties;
    }
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (key !== parentIdProp) {
        result[key] = value;
      }
    }
    return result;
  }

  private async deleteActionResource(
    resource: ManifestResource,
    pathTemplate: string,
  ): Promise<void> {
    const networkId = resource.properties['networkId'];
    if (networkId === undefined || networkId === null) {
      throw new Error(
        `Cannot delete action resource '${resource.logicalId}': ` +
          `'networkId' is required in properties to resolve the delete path.`,
      );
    }

    const path = pathTemplate.replace('{networkId}', String(networkId));

    // Build the delete action body from properties, excluding networkId
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(resource.properties)) {
      if (key !== 'networkId') {
        body[key] = value;
      }
    }

    const response = await this.client.post<WithAction>(path, body);

    if (response.action !== undefined) {
      await this.poller.poll(response.action.id);
    }
  }
}
