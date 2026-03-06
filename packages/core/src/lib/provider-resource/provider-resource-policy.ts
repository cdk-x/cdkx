/**
 * When the Engine creates the associated resource, configures the number of required success signals and
 * the length of time that the Engine waits for those signals.
 */
export interface ResourceSignal {
  /**
   * The number of success signals the Engine must receive before it sets the resource status as CREATE_COMPLETE.
   * If the resource receives a failure signal or doesn't receive the specified number of signals
   * before the timeout period expires, the resource creation fails and the Engine rolls the stack back.
   */
  count?: number;
  /**
   * The length of time that the Engine waits for the number of signals that was specified in the Count property.
   * The timeout period starts after the Engine starts creating the resource, and the timeout expires no sooner
   * than the time you specify but can occur shortly thereafter. The maximum time that you can specify is 12 hours.
   */
  timeout?: string;
}

/**
 * Associate the CreationPolicy attribute with a resource to prevent its status from reaching create complete until
 * the Engine receives a specified number of success signals or the timeout period is exceeded. To signal a
 * resource, you can use the cfn-signal helper script or SignalResource API. The Engine publishes valid signals
 * to the stack events so that you track the number of signals sent.
 *
 * Use the CreationPolicy attribute when you want to wait on resource configuration actions before stack creation proceeds.
 * For example, if you install and configure software applications on an Virtual Machine or Instance, you might want those applications to
 * be running before proceeding. In such cases, you can add a CreationPolicy attribute to the instance, and then send a success
 * signal to the instance after the applications are installed and configured.
 */
export interface ProviderCreatePolicy {
  /**
   * When the Engine creates the associated resource, configures the number of required success signals and
   * the length of time that the Engine waits for those signals.
   */
  resourceSignal: ResourceSignal;
}

/**
 * With the DeletionPolicy attribute you can preserve or (in some cases) backup a resource when its stack is deleted.
 * You specify a DeletionPolicy attribute for each resource that you want to control. If a resource has no DeletionPolicy
 * attribute, the Engine deletes the resource by default. Note that this capability also applies to update operations
 * that lead to resources being removed.
 */
export enum ProviderDeletionPolicy {
  /**
   * The Engine deletes the resource and all its content if applicable during stack deletion. You can add this
   * deletion policy to any resource type. By default, if you don't specify a DeletionPolicy, the Engine deletes
   * your resources. However, be aware of the following considerations when using this deletion policy:
   * - If the resource has a DeletionPolicy of Delete, the Engine deletes the resource and all its content if applicable during stack deletion.
   * - If the resource has a DeletionPolicy of Retain, the Engine keeps the resource without deleting the resource or its contents when its stack is deleted.
   * - If the resource has a DeletionPolicy of RetainExceptOnCreate, the Engine behaves like Retain for stack operations, except for the stack operation that initially created the resource. If the stack operation that created the resource is rolled back, the Engine deletes the resource. For all other stack operations, such as stack deletion, the Engine retains the resource and its contents. The result is that new, empty, and unused resources are deleted, while in-use resources and their data are retained.
   * - If the resource has a DeletionPolicy of Snapshot and supports snapshots (AWS::EC2::Volume, AWS::ElastiCache::CacheCluster, AWS::El
   */
  DELETE = 'Delete',

  /**
   * The Engine keeps the resource without deleting the resource or its contents when its stack is deleted.
   * You can add this deletion policy to any resource type. Note that when the Engine completes the stack deletion,
   * the stack will be in Delete_Complete state; however, resources that are retained continue to exist and continue to incur
   * applicable charges until you delete those resources.
   */
  RETAIN = 'Retain',

  /**
   * RetainExceptOnCreate behaves like Retain for stack operations, except for the stack operation that initially created the resource.
   * If the stack operation that created the resource is rolled back, the Engine deletes the resource. For all other stack operations,
   * such as stack deletion, the Engine retains the resource and its contents. The result is that new, empty, and unused resources are deleted,
   * while in-use resources and their data are retained.
   */
  RETAIN_EXCEPT_ON_CREATE = 'RetainExceptOnCreate',
}

/**
 * Represents provider-specific update policy configuration.
 * Each provider defines its own update policy semantics.
 * Use a provider-specific type alias or sub-interface to add typed fields.
 */
export type ProviderUpdatePolicy = Record<string, unknown>;
