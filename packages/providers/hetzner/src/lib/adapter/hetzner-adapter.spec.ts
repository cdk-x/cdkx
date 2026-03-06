import type { ManifestResource } from '@cdk-x/engine';
import { HetznerAdapter } from './hetzner-adapter';
import type { HetznerClient } from './hetzner-client';
import type { ActionPoller } from './action-poller';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeResource(
  overrides: Partial<ManifestResource> = {},
): ManifestResource {
  return {
    logicalId: 'MyNetworkA1B2C3D4',
    type: 'Hetzner::Networking::Network',
    properties: { name: 'my-net', ipRange: '10.0.0.0/16' },
    stackId: 'MyStack',
    provider: 'hetzner',
    ...overrides,
  };
}

/**
 * Builds a HetznerAdapter with fully injectable client and poller.
 * All client methods and poller.poll default to no-op jest.fn() unless overridden.
 */
function makeAdapter(
  clientOverrides: Partial<Record<keyof HetznerClient, jest.Mock>> = {},
  pollerPollMock: jest.Mock = jest.fn().mockResolvedValue(undefined),
): { adapter: HetznerAdapter; client: HetznerClient; poller: ActionPoller } {
  const client: HetznerClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    ...clientOverrides,
  } as unknown as HetznerClient;

  const poller: ActionPoller = {
    poll: pollerPollMock,
  } as unknown as ActionPoller;

  // We use the two-arg constructor to inject client + poller directly.
  // Since the adapter constructs them internally, we reach into the instance
  // after construction and replace them for unit testing.
  const adapter = new HetznerAdapter({ apiToken: 'test-token' });
  // Inject mocks directly onto the private fields via bracket access
  (adapter as unknown as Record<string, unknown>)['client'] = client;
  (adapter as unknown as Record<string, unknown>)['poller'] = poller;

  return { adapter, client, poller };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HetznerAdapter', () => {
  // ─── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('POSTs to createPath and returns physicalId + outputs', async () => {
      const { adapter, client } = makeAdapter({
        post: jest.fn().mockResolvedValue({
          network: { id: 42 },
        }),
      });

      const result = await adapter.create(makeResource());

      expect(client.post).toHaveBeenCalledWith('/networks', {
        name: 'my-net',
        ipRange: '10.0.0.0/16',
      });
      expect(result.physicalId).toBe('42');
      expect(result.outputs).toEqual({ networkId: 42 });
    });

    it('polls action when response contains an action field', async () => {
      const pollMock = jest.fn().mockResolvedValue(undefined);
      const { adapter, client } = makeAdapter(
        {
          post: jest
            .fn()
            .mockResolvedValue({ network: { id: 1 }, action: { id: 99 } }),
        },
        pollMock,
      );

      await adapter.create(makeResource());

      expect(pollMock).toHaveBeenCalledWith(99);
      expect(client.post).toHaveBeenCalledTimes(1);
    });

    it('does NOT poll when response has no action field', async () => {
      const pollMock = jest.fn();
      const { adapter } = makeAdapter(
        { post: jest.fn().mockResolvedValue({ network: { id: 5 } }) },
        pollMock,
      );

      await adapter.create(makeResource());

      expect(pollMock).not.toHaveBeenCalled();
    });

    it('omits outputs when extractOutputs returns empty', async () => {
      const { adapter } = makeAdapter({
        post: jest.fn().mockResolvedValue({}),
      });

      // SshKey returns empty outputs
      const resource = makeResource({
        type: 'Hetzner::Security::SshKey',
        properties: { name: 'my-key', publicKey: 'ssh-rsa AAAA...' },
      });
      const postMock = jest.fn().mockResolvedValue({ ssh_key: { id: 77 } });
      (adapter as unknown as Record<string, unknown>)['client'] = {
        post: postMock,
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
      } as unknown as HetznerClient;

      const result = await adapter.create(resource);

      expect(result.physicalId).toBe('77');
      expect(result.outputs).toBeUndefined();
    });

    it('throws for an unknown resource type', async () => {
      const { adapter } = makeAdapter();

      await expect(
        adapter.create(makeResource({ type: 'Unknown::Type' })),
      ).rejects.toThrow("Unknown Hetzner resource type: 'Unknown::Type'");
    });

    describe('action resources (Subnet)', () => {
      it('substitutes {networkId} in createPath and omits networkId from body', async () => {
        const postMock = jest.fn().mockResolvedValue({ action: { id: 10 } });
        const { adapter } = makeAdapter({ post: postMock });

        const resource = makeResource({
          type: 'Hetzner::Networking::Subnet',
          properties: {
            networkId: '42',
            type: 'cloud',
            networkZone: 'eu-central',
            ipRange: '10.0.1.0/24',
          },
        });

        const result = await adapter.create(resource);

        expect(postMock).toHaveBeenCalledWith(
          '/networks/42/actions/add_subnet',
          { type: 'cloud', networkZone: 'eu-central', ipRange: '10.0.1.0/24' },
        );
        // Composite physicalId: {networkId}:{ipRange}
        expect(result.physicalId).toBe('42:10.0.1.0/24');
        expect(result.outputs).toBeUndefined();
      });

      it('throws when networkId is missing from action resource properties', async () => {
        const { adapter } = makeAdapter();

        const resource = makeResource({
          type: 'Hetzner::Networking::Subnet',
          properties: { type: 'cloud', ipRange: '10.0.1.0/24' },
        });

        await expect(adapter.create(resource)).rejects.toThrow(
          "requires 'networkId' in properties",
        );
      });
    });
  });

  // ─── update() ─────────────────────────────────────────────────────────────

  describe('update()', () => {
    it('PUTs to updatePath using physicalId and returns outputs', async () => {
      const putMock = jest.fn().mockResolvedValue({ network: { id: 42 } });
      const { adapter } = makeAdapter({ put: putMock });

      const resource = makeResource({ physicalId: '42' });
      const result = await adapter.update(resource, { name: 'renamed-net' });

      expect(putMock).toHaveBeenCalledWith('/networks/42', {
        name: 'renamed-net',
      });
      expect(result.outputs).toEqual({ networkId: 42 });
    });

    it('strips createOnlyProps from the patch body', async () => {
      const putMock = jest.fn().mockResolvedValue({ network: { id: 42 } });
      const { adapter } = makeAdapter({ put: putMock });

      const resource = makeResource({ physicalId: '42' });
      // Patch contains 'name' (mutable) and 'labels' (mutable) — no violations
      await adapter.update(resource, { name: 'new', labels: { env: 'prod' } });

      expect(putMock).toHaveBeenCalledWith('/networks/42', {
        name: 'new',
        labels: { env: 'prod' },
      });
    });

    it('throws when patch contains a createOnly property', async () => {
      const { adapter } = makeAdapter();

      const resource = makeResource({ physicalId: '42' });
      await expect(
        adapter.update(resource, { name: 'ok', ipRange: '10.1.0.0/16' }),
      ).rejects.toThrow(
        "Cannot update create-only property on 'Hetzner::Networking::Network': ipRange",
      );
    });

    it('polls action when update response contains an action field', async () => {
      const pollMock = jest.fn().mockResolvedValue(undefined);
      const { adapter } = makeAdapter(
        {
          put: jest
            .fn()
            .mockResolvedValue({ network: { id: 42 }, action: { id: 55 } }),
        },
        pollMock,
      );

      await adapter.update(makeResource({ physicalId: '42' }), {
        name: 'new',
      });

      expect(pollMock).toHaveBeenCalledWith(55);
    });

    it('throws for action resources (immutable)', async () => {
      const { adapter } = makeAdapter();

      const resource = makeResource({
        type: 'Hetzner::Networking::Subnet',
        physicalId: '42:10.0.1.0/24',
      });

      await expect(
        adapter.update(resource, { ipRange: '10.0.2.0/24' }),
      ).rejects.toThrow('action resource and cannot be updated in place');
    });

    it('throws when physicalId is not provided', async () => {
      const { adapter } = makeAdapter();

      // physicalId is undefined
      await expect(
        adapter.update(makeResource(), { name: 'new' }),
      ).rejects.toThrow('physicalId is required');
    });

    it('omits outputs when extractOutputs returns empty', async () => {
      const putMock = jest.fn().mockResolvedValue({ ssh_key: { id: 77 } });
      const { adapter } = makeAdapter({ put: putMock });

      const resource = makeResource({
        type: 'Hetzner::Security::SshKey',
        physicalId: '77',
      });

      const result = await adapter.update(resource, { name: 'renamed-key' });

      expect(result.outputs).toBeUndefined();
    });
  });

  // ─── delete() ─────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('DELETEs using physicalId', async () => {
      const deleteMock = jest.fn().mockResolvedValue(undefined);
      const { adapter } = makeAdapter({ delete: deleteMock });

      await adapter.delete(makeResource({ physicalId: '42' }));

      expect(deleteMock).toHaveBeenCalledWith('/networks/42');
    });

    it('throws when physicalId is not provided', async () => {
      const { adapter } = makeAdapter();

      await expect(adapter.delete(makeResource())).rejects.toThrow(
        'physicalId is required',
      );
    });

    describe('action resources (Route)', () => {
      it('POSTs to the delete_route action endpoint', async () => {
        const postMock = jest.fn().mockResolvedValue({});
        const { adapter } = makeAdapter({ post: postMock });

        const resource = makeResource({
          type: 'Hetzner::Networking::Route',
          physicalId: '42:10.0.0.0/8',
          properties: {
            networkId: '42',
            destination: '10.0.0.0/8',
            gateway: '10.0.0.1',
          },
        });

        await adapter.delete(resource);

        expect(postMock).toHaveBeenCalledWith(
          '/networks/42/actions/delete_route',
          { destination: '10.0.0.0/8', gateway: '10.0.0.1' },
        );
      });

      it('polls action when delete_route response has action field', async () => {
        const pollMock = jest.fn().mockResolvedValue(undefined);
        const { adapter } = makeAdapter(
          { post: jest.fn().mockResolvedValue({ action: { id: 20 } }) },
          pollMock,
        );

        const resource = makeResource({
          type: 'Hetzner::Networking::Route',
          physicalId: '42:10.0.0.0/8',
          properties: {
            networkId: '42',
            destination: '10.0.0.0/8',
            gateway: '10.0.0.1',
          },
        });

        await adapter.delete(resource);

        expect(pollMock).toHaveBeenCalledWith(20);
      });

      it('throws when networkId is missing from action resource properties', async () => {
        const { adapter } = makeAdapter();

        const resource = makeResource({
          type: 'Hetzner::Networking::Subnet',
          physicalId: 'x:y',
          properties: { type: 'cloud', ipRange: '10.0.1.0/24' },
        });

        await expect(adapter.delete(resource)).rejects.toThrow(
          "'networkId' is required in properties",
        );
      });
    });
  });

  // ─── validate() ───────────────────────────────────────────────────────────

  describe('validate()', () => {
    it('resolves without error for a known resource type', async () => {
      const { adapter } = makeAdapter();

      await expect(adapter.validate(makeResource())).resolves.toBeUndefined();
    });

    it('throws for an unknown resource type', async () => {
      const { adapter } = makeAdapter();

      await expect(
        adapter.validate(makeResource({ type: 'Unknown::Type' })),
      ).rejects.toThrow("Unknown Hetzner resource type: 'Unknown::Type'");
    });
  });

  // ─── getOutput() ──────────────────────────────────────────────────────────

  describe('getOutput()', () => {
    it('GETs the resource and returns the named attr', async () => {
      const getMock = jest.fn().mockResolvedValue({ network: { id: 42 } });
      const { adapter } = makeAdapter({ get: getMock });

      const result = await adapter.getOutput(
        makeResource({ physicalId: '42' }),
        'networkId',
      );

      expect(getMock).toHaveBeenCalledWith('/networks/42');
      expect(result).toBe(42);
    });

    it('returns undefined for unknown attr', async () => {
      const getMock = jest.fn().mockResolvedValue({ network: { id: 42 } });
      const { adapter } = makeAdapter({ get: getMock });

      const result = await adapter.getOutput(
        makeResource({ physicalId: '42' }),
        'nonExistentAttr',
      );

      expect(result).toBeUndefined();
    });

    it('returns undefined for action resources (no GET endpoint)', async () => {
      const getMock = jest.fn();
      const { adapter } = makeAdapter({ get: getMock });

      const resource = makeResource({
        type: 'Hetzner::Networking::Subnet',
        physicalId: '42:10.0.1.0/24',
      });

      const result = await adapter.getOutput(resource, 'networkId');

      expect(result).toBeUndefined();
      expect(getMock).not.toHaveBeenCalled();
    });

    it('throws when physicalId is not provided', async () => {
      const { adapter } = makeAdapter();

      await expect(
        adapter.getOutput(makeResource(), 'networkId'),
      ).rejects.toThrow('physicalId is required');
    });
  });
});
