export interface CrnComponents {
  readonly provider: string;
  readonly domain: string;
  readonly region?: string;
  readonly account?: string;
  readonly resourceType: string;
  readonly resourceName?: string;
  readonly resourceId: string;
}

export class Crn {
  readonly provider: string;
  readonly domain: string;
  readonly region?: string;
  readonly account?: string;
  readonly resourceType: string;
  readonly resourceName?: string;
  readonly resourceId: string;

  constructor(components: CrnComponents) {
    this.provider = components.provider;
    this.domain = components.domain;
    this.region = components.region;
    this.account = components.account;
    this.resourceType = components.resourceType;
    this.resourceName = components.resourceName;
    this.resourceId = components.resourceId;
  }

  static parse(crn: string): Crn {
    const parts = crn.split(':');

    // Minimum format: crn:cdkx:<provider>:<domain>:<resource-type>/<resource-id>
    if (parts.length < 5) {
      throw new Error(`Invalid CRN format: ${crn}`);
    }

    const provider = parts[2];
    const domain = parts[3];

    // Find the resource part (contains '/')
    let resourceIndex = -1;
    for (let i = 4; i < parts.length; i++) {
      if (parts[i].includes('/')) {
        resourceIndex = i;
        break;
      }
    }

    if (resourceIndex === -1) {
      throw new Error(
        `Invalid CRN format: missing resource separator '/' in ${crn}`,
      );
    }

    // Determine optional segments between domain and resource
    const optionalSegments = resourceIndex - 4;
    let region: string | undefined;
    let account: string | undefined;

    if (optionalSegments === 1) {
      // Only region present
      region = parts[4];
    } else if (optionalSegments === 2) {
      // Both region and account present
      region = parts[4];
      account = parts[5];
    }

    // Parse resource part: <type>[:<name>]/<id>
    const resourcePart = parts[resourceIndex];
    const resourceSeparator = resourcePart.indexOf('/');
    const beforeResourceId = resourcePart.substring(0, resourceSeparator);
    const resourceId = resourcePart.substring(resourceSeparator + 1);

    // Check if there's a resource name (format: type:name/id)
    const nameSeparator = beforeResourceId.indexOf(':');
    let resourceType: string;
    let resourceName: string | undefined;

    if (nameSeparator === -1) {
      resourceType = beforeResourceId;
    } else {
      resourceType = beforeResourceId.substring(0, nameSeparator);
      resourceName = beforeResourceId.substring(nameSeparator + 1);
    }

    return new Crn({
      provider,
      domain,
      region,
      account,
      resourceType,
      resourceName,
      resourceId,
    });
  }

  static format(components: CrnComponents): string {
    // Build segments dynamically - only include non-empty optional segments
    const segments: string[] = [
      'crn',
      'cdkx',
      components.provider,
      components.domain,
    ];

    // Add region only if present
    if (components.region !== undefined && components.region !== '') {
      segments.push(components.region);
    }

    // Add account only if present
    if (components.account !== undefined && components.account !== '') {
      segments.push(components.account);
    }

    // Add resource type and optional name
    const resourceSegment = components.resourceName
      ? `${components.resourceType}:${components.resourceName}`
      : components.resourceType;

    segments.push(`${resourceSegment}/${components.resourceId}`);

    return segments.join(':');
  }

  static isCrn(value: unknown): value is string {
    if (typeof value !== 'string') {
      return false;
    }

    if (!value.startsWith('crn:cdkx:')) {
      return false;
    }

    const parts = value.split(':');
    // Minimum: crn:cdkx:<provider>:<domain>:<resource-type>/<resource-id> = 5 parts
    if (parts.length < 5) {
      return false;
    }

    // Last part must contain '/'
    const lastPart = parts[parts.length - 1];
    if (!lastPart.includes('/')) {
      return false;
    }

    return true;
  }

  toString(): string {
    return Crn.format({
      provider: this.provider,
      domain: this.domain,
      region: this.region,
      account: this.account,
      resourceType: this.resourceType,
      resourceName: this.resourceName,
      resourceId: this.resourceId,
    });
  }
}
