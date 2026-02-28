import { Stack } from '../../src/lib/stack/stack.js';
import { ProviderResource } from '../../src/lib/provider-resource/provider-resource.js';
import { Lazy } from '../../src/lib/resolvables/lazy.js';

/**
 * Object Mother for generic test L1 resources.
 *
 * All methods return a pre-configured `ProviderResource` (L1) so that
 * synthesis tests can focus on the pipeline behaviour rather than resource setup.
 *
 * Analogous to `TestProvider` — a ready-made collaborator with sensible defaults.
 */
export class TestResources {
  /**
   * A basic L1 resource with a fixed set of properties.
   * Use this as a general-purpose resource when the property content is not relevant.
   */
  static resource(scope: Stack, id = 'Resource'): ProviderResource {
    return new ProviderResource(scope, id, {
      type: 'test::Resource',
      properties: { name: id },
    });
  }

  /**
   * An L1 resource that contains a `null` property value.
   * Use to verify that the sanitizer strips null values from the synthesized output.
   */
  static resourceWithNull(scope: Stack, id = 'NullResource'): ProviderResource {
    return new ProviderResource(scope, id, {
      type: 'test::Resource',
      properties: { name: id, optional: null },
    });
  }

  /**
   * An L1 resource whose `value` property is a `Lazy` token.
   * The token captures an internal counter — call `setReplicas` pattern is not needed
   * here; the produce fn returns a fixed value to keep the helper simple.
   *
   * Use to verify that Lazy tokens are resolved at synthesis time.
   */
  static resourceWithLazy(scope: Stack, id = 'LazyResource'): ProviderResource {
    return new ProviderResource(scope, id, {
      type: 'test::Resource',
      properties: { value: Lazy.any({ produce: () => 'lazy-resolved' }) },
    });
  }
}
