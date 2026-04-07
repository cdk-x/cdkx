import { RuntimeLogger } from '@cdk-x/core';
import { CertificateType } from '@cdk-x/hetzner';
import { HetznerCertificateHandler } from './certificate-handler';
import { HetznerRuntimeContext } from '../../hetzner-runtime-context';
import { HetznerSdk } from '../../hetzner-sdk-facade';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal stub logger that records calls. */
function stubLogger(): RuntimeLogger {
  const noop = jest.fn();
  const logger: RuntimeLogger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: jest.fn(() => logger),
  };
  return logger;
}

/** Fake Hetzner certificate object matching the SDK response shape. */
function fakeCertificate(overrides?: Record<string, unknown>) {
  return {
    id: 42,
    name: 'my-cert',
    labels: { env: 'test' },
    type: CertificateType.UPLOADED,
    certificate: '-----BEGIN CERTIFICATE-----\n...',
    domain_names: ['example.com'],
    ...overrides,
  };
}

/** Creates an HetznerSdk stub with only the `certificates` API mocked. */
function stubSdk(overrides?: Partial<HetznerSdk['certificates']>): HetznerSdk {
  return {
    certificates: {
      createCertificate: jest.fn(),
      updateCertificate: jest.fn(),
      deleteCertificate: jest.fn(),
      listCertificates: jest.fn(),
      ...overrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerCertificateHandler', () => {
  let handler: HetznerCertificateHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerCertificateHandler();
    logger = stubLogger();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('calls createCertificate with snake_case params', async () => {
      const sdk = stubSdk({
        createCertificate: jest.fn().mockResolvedValue({
          data: { certificate: fakeCertificate() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-cert',
        labels: { env: 'test' },
        type: CertificateType.UPLOADED,
        certificate: '-----BEGIN CERTIFICATE-----\n...',
        privateKey: '-----BEGIN PRIVATE KEY-----\n...',
      });

      expect(sdk.certificates.createCertificate).toHaveBeenCalledWith({
        name: 'my-cert',
        labels: { env: 'test' },
        type: CertificateType.UPLOADED,
        certificate: '-----BEGIN CERTIFICATE-----\n...',
        private_key: '-----BEGIN PRIVATE KEY-----\n...',
        domain_names: undefined,
      });
    });

    it('returns state with camelCase keys', async () => {
      const sdk = stubSdk({
        createCertificate: jest.fn().mockResolvedValue({
          data: {
            certificate: fakeCertificate({
              id: 99,
              name: 'new-cert',
              labels: {},
              type: CertificateType.MANAGED,
              domain_names: ['example.com', 'www.example.com'],
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        name: 'new-cert',
        type: CertificateType.MANAGED,
        domainNames: ['example.com', 'www.example.com'],
      });

      expect(state).toEqual({
        certificateId: 99,
        name: 'new-cert',
        labels: {},
        type: CertificateType.MANAGED,
        certificate: '-----BEGIN CERTIFICATE-----\n...',
        domainNames: ['example.com', 'www.example.com'],
      });
    });

    it('throws when API returns no certificate object', async () => {
      const sdk = stubSdk({
        createCertificate: jest
          .fn()
          .mockResolvedValue({ data: { certificate: undefined } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(handler.create(ctx, { name: 'x' })).rejects.toThrow(
        /no certificate object/i,
      );
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        createCertificate: jest.fn().mockResolvedValue({
          data: { certificate: fakeCertificate() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-cert',
        type: CertificateType.UPLOADED,
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.certificate.create',
        { name: 'my-cert', type: CertificateType.UPLOADED },
      );
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('calls updateCertificate with snake_case params', async () => {
      const sdk = stubSdk({
        updateCertificate: jest.fn().mockResolvedValue({
          data: { certificate: fakeCertificate({ name: 'renamed' }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'renamed' },
        {
          certificateId: 42,
          name: 'my-cert',
          labels: {},
        },
      );

      expect(sdk.certificates.updateCertificate).toHaveBeenCalledWith(42, {
        name: 'renamed',
        labels: undefined,
      });
    });

    it('returns updated state', async () => {
      const sdk = stubSdk({
        updateCertificate: jest.fn().mockResolvedValue({
          data: {
            certificate: fakeCertificate({
              name: 'renamed',
              labels: { a: '1' },
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { name: 'renamed', labels: { a: '1' } },
        {
          certificateId: 42,
          name: 'old',
          labels: {},
        },
      );

      expect(state.name).toBe('renamed');
      expect(state.labels).toEqual({ a: '1' });
    });

    it('throws when API returns no certificate object', async () => {
      const sdk = stubSdk({
        updateCertificate: jest
          .fn()
          .mockResolvedValue({ data: { certificate: null } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.update(
          ctx,
          { name: 'x' },
          {
            certificateId: 1,
            name: 'x',
            labels: {},
          },
        ),
      ).rejects.toThrow(/no certificate object/i);
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('calls deleteCertificate with the certificateId', async () => {
      const sdk = stubSdk({
        deleteCertificate: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        certificateId: 42,
        name: 'my-cert',
        labels: {},
      });

      expect(sdk.certificates.deleteCertificate).toHaveBeenCalledWith(42);
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deleteCertificate: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        certificateId: 42,
        name: 'my-cert',
        labels: {},
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.certificate.delete',
        { certificateId: 42 },
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('finds a certificate by name', async () => {
      const sdk = stubSdk({
        listCertificates: jest.fn().mockResolvedValue({
          data: { certificates: [fakeCertificate({ id: 77 })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-cert',
      });

      expect(state.certificateId).toBe(77);
      expect(sdk.certificates.listCertificates).toHaveBeenCalledWith(
        undefined,
        'my-cert',
      );
    });

    it('throws when certificate is not found', async () => {
      const sdk = stubSdk({
        listCertificates: jest.fn().mockResolvedValue({
          data: { certificates: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(handler.get(ctx, { name: 'missing' })).rejects.toThrow(
        /not found.*missing/i,
      );
    });

    it('defaults labels to empty object when API returns undefined', async () => {
      const sdk = stubSdk({
        listCertificates: jest.fn().mockResolvedValue({
          data: {
            certificates: [fakeCertificate({ labels: undefined })],
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-cert',
      });

      expect(state.labels).toEqual({});
    });
  });
});
