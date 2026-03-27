import { RuntimeLogger } from '@cdkx-io/core';
import { HetznerSshKeyHandler } from './ssh-key-handler';
import { HetznerRuntimeContext } from '../../hetzner-runtime-context';
import { HetznerSdk } from '../../hetzner-sdk-facade';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

function fakeSshKey(overrides?: Record<string, unknown>) {
  return {
    id: 1,
    name: 'my-key',
    public_key: 'ssh-rsa AAAA...',
    fingerprint: 'aa:bb:cc:dd',
    labels: { env: 'test' },
    created: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function stubSdk(overrides?: Partial<HetznerSdk['sshKeys']>): HetznerSdk {
  return {
    sshKeys: {
      createSshKey: jest.fn(),
      updateSshKey: jest.fn(),
      deleteSshKey: jest.fn(),
      listSshKeys: jest.fn(),
      getSshKey: jest.fn(),
      ...overrides,
    },
  } as unknown as HetznerSdk;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HetznerSshKeyHandler', () => {
  let handler: HetznerSshKeyHandler;
  let logger: RuntimeLogger;

  beforeEach(() => {
    handler = new HetznerSshKeyHandler();
    logger = stubLogger();
  });

  // -----------------------------------------------------------------------
  // create
  // -----------------------------------------------------------------------
  describe('create', () => {
    it('calls createSshKey with snake_case params', async () => {
      const sdk = stubSdk({
        createSshKey: jest.fn().mockResolvedValue({
          data: { ssh_key: fakeSshKey() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, {
        name: 'my-key',
        publicKey: 'ssh-rsa AAAA...',
        labels: { env: 'test' },
      });

      expect(sdk.sshKeys.createSshKey).toHaveBeenCalledWith({
        name: 'my-key',
        public_key: 'ssh-rsa AAAA...',
        labels: { env: 'test' },
      });
    });

    it('returns state with camelCase keys', async () => {
      const sdk = stubSdk({
        createSshKey: jest.fn().mockResolvedValue({
          data: {
            ssh_key: fakeSshKey({
              id: 99,
              name: 'new-key',
              public_key: 'ssh-ed25519 BBBB...',
              fingerprint: '11:22:33:44',
              labels: {},
            }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.create(ctx, {
        name: 'new-key',
        publicKey: 'ssh-ed25519 BBBB...',
      });

      expect(state).toEqual({
        sshKeyId: 99,
        name: 'new-key',
        publicKey: 'ssh-ed25519 BBBB...',
        fingerprint: '11:22:33:44',
        labels: {},
      });
    });

    it('logs the create call', async () => {
      const sdk = stubSdk({
        createSshKey: jest.fn().mockResolvedValue({
          data: { ssh_key: fakeSshKey() },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.create(ctx, { name: 'my-key', publicKey: 'ssh-rsa AAAA...' });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.ssh-key.create',
        { name: 'my-key' },
      );
    });

    it('throws when API returns no ssh_key object', async () => {
      const sdk = stubSdk({
        createSshKey: jest
          .fn()
          .mockResolvedValue({ data: { ssh_key: undefined } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.create(ctx, { name: 'x', publicKey: 'ssh-rsa AAAA...' }),
      ).rejects.toThrow(/no ssh.key object/i);
    });
  });

  // -----------------------------------------------------------------------
  // update
  // -----------------------------------------------------------------------
  describe('update', () => {
    it('calls updateSshKey with snake_case params', async () => {
      const sdk = stubSdk({
        updateSshKey: jest.fn().mockResolvedValue({
          data: { ssh_key: fakeSshKey({ name: 'renamed' }) },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.update(
        ctx,
        { name: 'renamed', publicKey: 'ssh-rsa AAAA...', labels: { a: '1' } },
        {
          sshKeyId: 1,
          name: 'my-key',
          publicKey: 'ssh-rsa AAAA...',
          fingerprint: 'aa:bb:cc:dd',
          labels: {},
        },
      );

      expect(sdk.sshKeys.updateSshKey).toHaveBeenCalledWith(1, {
        name: 'renamed',
        labels: { a: '1' },
      });
    });

    it('returns updated state', async () => {
      const sdk = stubSdk({
        updateSshKey: jest.fn().mockResolvedValue({
          data: {
            ssh_key: fakeSshKey({ name: 'renamed', labels: { a: '1' } }),
          },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.update(
        ctx,
        { name: 'renamed', publicKey: 'ssh-rsa AAAA...', labels: { a: '1' } },
        {
          sshKeyId: 1,
          name: 'my-key',
          publicKey: 'ssh-rsa AAAA...',
          fingerprint: 'aa:bb:cc:dd',
          labels: {},
        },
      );

      expect(state.name).toBe('renamed');
      expect(state.labels).toEqual({ a: '1' });
    });

    it('throws when API returns no ssh_key object', async () => {
      const sdk = stubSdk({
        updateSshKey: jest
          .fn()
          .mockResolvedValue({ data: { ssh_key: null } }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.update(
          ctx,
          { name: 'x', publicKey: 'ssh-rsa AAAA...' },
          {
            sshKeyId: 1,
            name: 'x',
            publicKey: 'ssh-rsa AAAA...',
            fingerprint: 'aa:bb:cc:dd',
            labels: {},
          },
        ),
      ).rejects.toThrow(/no ssh.key object/i);
    });
  });

  // -----------------------------------------------------------------------
  // delete
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('calls deleteSshKey with the sshKeyId', async () => {
      const sdk = stubSdk({
        deleteSshKey: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        sshKeyId: 1,
        name: 'my-key',
        publicKey: 'ssh-rsa AAAA...',
        fingerprint: 'aa:bb:cc:dd',
        labels: {},
      });

      expect(sdk.sshKeys.deleteSshKey).toHaveBeenCalledWith(1);
    });

    it('logs the delete call', async () => {
      const sdk = stubSdk({
        deleteSshKey: jest.fn().mockResolvedValue(undefined),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await handler.delete(ctx, {
        sshKeyId: 1,
        name: 'my-key',
        publicKey: 'ssh-rsa AAAA...',
        fingerprint: 'aa:bb:cc:dd',
        labels: {},
      });

      expect(logger.info).toHaveBeenCalledWith(
        'provider.handler.ssh-key.delete',
        { sshKeyId: 1 },
      );
    });
  });

  // -----------------------------------------------------------------------
  // get
  // -----------------------------------------------------------------------
  describe('get', () => {
    it('finds an ssh key by name', async () => {
      const sdk = stubSdk({
        listSshKeys: jest.fn().mockResolvedValue({
          data: { ssh_keys: [fakeSshKey({ id: 77 })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-key',
        publicKey: 'ssh-rsa AAAA...',
      });

      expect(state.sshKeyId).toBe(77);
      expect(sdk.sshKeys.listSshKeys).toHaveBeenCalledWith(
        undefined,
        'my-key',
      );
    });

    it('throws when ssh key is not found', async () => {
      const sdk = stubSdk({
        listSshKeys: jest.fn().mockResolvedValue({
          data: { ssh_keys: [] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      await expect(
        handler.get(ctx, { name: 'missing', publicKey: 'ssh-rsa AAAA...' }),
      ).rejects.toThrow(/not found.*missing/i);
    });

    it('defaults labels to empty object when API returns undefined', async () => {
      const sdk = stubSdk({
        listSshKeys: jest.fn().mockResolvedValue({
          data: { ssh_keys: [fakeSshKey({ labels: undefined })] },
        }),
      });
      const ctx = new HetznerRuntimeContext(sdk, logger);

      const state = await handler.get(ctx, {
        name: 'my-key',
        publicKey: 'ssh-rsa AAAA...',
      });

      expect(state.labels).toEqual({});
    });
  });
});
