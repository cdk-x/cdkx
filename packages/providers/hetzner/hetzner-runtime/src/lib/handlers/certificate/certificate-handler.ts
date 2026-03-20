import { ResourceHandler, RuntimeContext } from '@cdkx-io/core';
import { HetznerCertificate, CertificateType } from '@cdkx-io/hetzner';
import { HetznerSdk } from '../../hetzner-sdk-facade';

/**
 * Persisted state for a Hetzner Certificate resource.
 * Extends {@link HetznerCertificate} adding the `certificateId` field.
 * Returned by {@link HetznerCertificateHandler.create} and
 * {@link HetznerCertificateHandler.get}. Stored by the engine in
 * `ResourceState.outputs`.
 */
export interface HetznerCertificateState extends HetznerCertificate {
  readonly certificateId: number;
}

/**
 * Handler for `Hetzner::Security::Certificate` resources.
 * Translates cdkx CRUD lifecycle calls into Hetzner Cloud SDK
 * requests, mapping camelCase props to snake_case SDK types
 * explicitly.
 */
export class HetznerCertificateHandler extends ResourceHandler<
  HetznerCertificate,
  HetznerCertificateState,
  HetznerSdk
> {
  async create(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerCertificate,
  ): Promise<HetznerCertificateState> {
    ctx.logger.info('provider.handler.certificate.create', {
      name: props.name,
      type: props.type,
    });

    const response = await ctx.sdk.certificates.createCertificate({
      name: props.name,
      labels: props.labels,
      type: props.type as CertificateType,
      certificate: props.certificate,
      private_key: props.privateKey,
      domain_names: props.domainNames,
    });

    const certificate = this.assertExists(
      response.data.certificate,
      'Hetzner API returned no certificate object in create response',
    );

    return {
      certificateId: certificate.id,
      name: certificate.name,
      labels: certificate.labels ?? {},
      type: certificate.type as CertificateType,
      certificate: certificate.certificate ?? undefined,
      privateKey: props.privateKey,
      domainNames: certificate.domain_names,
    };
  }

  async update(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerCertificate,
    state: HetznerCertificateState,
  ): Promise<HetznerCertificateState> {
    ctx.logger.info('provider.handler.certificate.update', {
      certificateId: state.certificateId,
      name: props.name,
    });

    const response = await ctx.sdk.certificates.updateCertificate(
      state.certificateId,
      {
        name: props.name,
        labels: props.labels,
      },
    );

    const certificate = this.assertExists(
      response.data.certificate,
      'Hetzner API returned no certificate object in update response',
    );

    return {
      certificateId: certificate.id,
      name: certificate.name,
      labels: certificate.labels ?? {},
      type: certificate.type as CertificateType,
      certificate: certificate.certificate ?? undefined,
      privateKey: state.privateKey,
      domainNames: certificate.domain_names,
    };
  }

  async delete(
    ctx: RuntimeContext<HetznerSdk>,
    state: HetznerCertificateState,
  ): Promise<void> {
    ctx.logger.info('provider.handler.certificate.delete', {
      certificateId: state.certificateId,
    });

    await ctx.sdk.certificates.deleteCertificate(state.certificateId);
  }

  async get(
    ctx: RuntimeContext<HetznerSdk>,
    props: HetznerCertificate,
  ): Promise<HetznerCertificateState> {
    ctx.logger.debug('provider.handler.certificate.get', {
      name: props.name,
    });

    const listResponse = await ctx.sdk.certificates.listCertificates(
      undefined,
      props.name,
    );

    const certificates = listResponse.data.certificates ?? [];
    const certificate = this.assertExists(
      certificates[0],
      `Hetzner certificate not found: ${props.name}`,
    );

    return {
      certificateId: certificate.id,
      name: certificate.name,
      labels: certificate.labels ?? {},
      type: certificate.type as CertificateType,
      certificate: certificate.certificate ?? undefined,
      domainNames: certificate.domain_names,
    };
  }
}
