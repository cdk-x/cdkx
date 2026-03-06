/**
 * Represents a single resource as the engine reads it from a stack template
 * JSON file. Properties may still contain unresolved `{ ref, attr }` tokens
 * at this stage — the engine substitutes them before calling the adapter.
 */
export interface ManifestResource {
  /**
   * The logical ID of this resource — the key in the stack template JSON
   * (e.g. `'MyServerA1B2C3D4'`).
   */
  readonly logicalId: string;

  /**
   * The provider resource type string, as declared in the stack template
   * (e.g. `'Hetzner::Compute::Server'`, `'Kubernetes::Apps::Deployment'`).
   */
  readonly type: string;

  /**
   * Resolved properties to pass to the provider API. At the point the adapter
   * receives this, all `{ ref, attr }` tokens have been substituted with real
   * provider-assigned values.
   */
  readonly properties: Record<string, unknown>;

  /**
   * The artifact ID of the stack this resource belongs to
   * (the key in `manifest.json`'s `artifacts` map).
   */
  readonly stackId: string;

  /**
   * The provider identifier string (e.g. `'hetzner'`, `'kubernetes'`).
   * Matches `manifest.artifacts[stackId].provider`.
   */
  readonly provider: string;

  /**
   * The provider-assigned physical ID of this resource.
   *
   * Present when the engine calls `update()`, `delete()`, or `getOutput()` —
   * i.e. when the resource has already been created and its physical ID has been
   * stored in `EngineState`. Absent (`undefined`) for `create()` calls, where
   * the physical ID is not yet known.
   */
  readonly physicalId?: string;
}

/**
 * Result returned by a successful `ProviderAdapter.create()` call.
 */
export interface CreateResult {
  /**
   * The provider-assigned physical ID for the newly created resource
   * (e.g. Hetzner server integer id, Kubernetes `metadata.name`).
   */
  readonly physicalId: string;

  /**
   * Named output attributes produced by the create operation that can be
   * referenced by other resources via `{ ref, attr }` tokens.
   * Keys match the `attr` field of cross-resource reference tokens.
   */
  readonly outputs?: Record<string, unknown>;
}

/**
 * Result returned by a successful `ProviderAdapter.update()` call.
 */
export interface UpdateResult {
  /**
   * Updated named output attributes (e.g. after a name change that affects
   * a derived hostname). Only include attributes that have changed.
   */
  readonly outputs?: Record<string, unknown>;
}

/**
 * Contract that every provider adapter must implement.
 *
 * The engine calls these methods at the appropriate point in the state machine:
 * - `create()` is called when a resource transitions to `CREATE_IN_PROGRESS`
 * - `update()` is called when a resource transitions to `UPDATE_IN_PROGRESS`
 * - `delete()` is called when a resource transitions to `DELETE_IN_PROGRESS`
 *   or during rollback
 * - `validate()` is called (if present) before the deployment loop begins
 * - `getOutput()` is called after `create()` to resolve `{ ref, attr }` tokens
 *   for dependent resources
 *
 * Provider adapters live in their respective provider packages (e.g.
 * `@cdkx-io/hetzner` will ship a `HetznerAdapter`). The engine imports only this
 * interface — it has no compile-time dependency on any concrete adapter.
 */
export interface ProviderAdapter {
  /**
   * Create the resource in the target provider and return its physical ID and
   * any output attributes.
   */
  create(resource: ManifestResource): Promise<CreateResult>;

  /**
   * Apply an update to an existing resource. The `patch` contains only the
   * properties that have changed since the last deployment.
   */
  update(resource: ManifestResource, patch: unknown): Promise<UpdateResult>;

  /**
   * Delete the resource from the target provider.
   * Called during a normal delete operation or during rollback.
   */
  delete(resource: ManifestResource): Promise<void>;

  /**
   * Optional pre-deployment validation. Called once per resource before the
   * deployment loop begins. Should throw if the resource configuration is
   * invalid without making any API calls.
   */
  validate?(resource: ManifestResource): Promise<void>;

  /**
   * Read a specific named output attribute from a resource that has already
   * been created. Used by the engine to resolve `{ ref, attr }` tokens for
   * dependent resources.
   *
   * @param resource — The already-created resource.
   * @param attr — The attribute name (matches the `attr` field in a
   *   cross-resource reference token, e.g. `'networkId'`, `'serverId'`).
   * @returns The resolved attribute value.
   */
  getOutput(resource: ManifestResource, attr: string): Promise<unknown>;
}
