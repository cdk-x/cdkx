/**
 * Resource symbol for re-usability.
 */
export const RESOURCE_SYMBOL = Symbol.for('@cdk-x/core.Resource');

/**
 * Represents any valid JSON-like value that can be used as a resource property.
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | PropertyValue[]
  | { [key: string]: PropertyValue };
