// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Choose between uploading a Certificate in PEM format or requesting a managed *Let's Encrypt* Certificate.
 */
export enum CertificateType {
  UPLOADED = 'uploaded',
  MANAGED = 'managed',
}

/**
 * Properties that describe a Hetzner Certificate resource.
 */
export interface HetznerCertificate {
  /** Name of the Certificate. */
  readonly name: string;
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
  /** Choose between uploading a Certificate in PEM format or requesting a managed *Let's Encrypt* Certificate. */
  readonly type?: CertificateType;
  /** Certificate and chain in PEM format, in order so that each record directly certifies the one preceding. Required for type `uploaded` Certificates. */
  readonly certificate?: string;
  /** Certificate key in PEM format. Required for type `uploaded` Certificates. */
  readonly privateKey?: string;
  /** Domains and subdomains that should be contained in the Certificate issued by *Let's Encrypt*. Required for type `managed` Certificates. */
  readonly domainNames?: string[];
}

/**
 * Props for {@link NtvHetznerCertificate}.
 *
 * Identical to {@link HetznerCertificate} — extended here for future additions.
 */
export interface NtvHetznerCertificateProps extends HetznerCertificate {}

/**
 * L1 construct representing a `Hetzner::Security::Certificate` resource.
 */
export class NtvHetznerCertificate extends ProviderResource {
  /**
   * Cloud-assigned ID of this certificate resource.
   */
  get certificateId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'certificateId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(scope: Construct, id: string, props: NtvHetznerCertificateProps) {
    super(scope, id, {
      type: HetznerResourceType.Security.CERTIFICATE,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
