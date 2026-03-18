import { HetznerSdkFactory, HetznerSdkFactoryDeps } from './hetzner-sdk-facade';

/**
 * Creates a stub constructor that records the config it receives, so
 * tests can assert on shared-configuration behaviour without hitting
 * the real Hetzner API.
 */
function makeStub(name: string) {
  return jest.fn().mockImplementation((cfg: unknown) => ({
    __name: name,
    __config: cfg,
  }));
}

function stubDeps(): HetznerSdkFactoryDeps {
  return {
    Configuration: jest.fn().mockImplementation((opts: unknown) => ({
      __type: 'Configuration',
      ...((opts ?? {}) as Record<string, unknown>),
    })),
    ActionsApi: makeStub('ActionsApi'),
    CertificatesApi: makeStub('CertificatesApi'),
    FirewallsApi: makeStub('FirewallsApi'),
    FloatingIPsApi: makeStub('FloatingIPsApi'),
    LoadBalancersApi: makeStub('LoadBalancersApi'),
    NetworkActionsApi: makeStub('NetworkActionsApi'),
    NetworksApi: makeStub('NetworksApi'),
    PlacementGroupsApi: makeStub('PlacementGroupsApi'),
    PrimaryIPsApi: makeStub('PrimaryIPsApi'),
    ServersApi: makeStub('ServersApi'),
    SSHKeysApi: makeStub('SSHKeysApi'),
    VolumesApi: makeStub('VolumesApi'),
  };
}

describe('HetznerSdkFactory', () => {
  it('creates an SDK with all 12 API properties', () => {
    const deps = stubDeps();
    const sdk = HetznerSdkFactory.create({ apiToken: 'test-token' }, deps);

    expect(sdk.actions).toBeDefined();
    expect(sdk.certificates).toBeDefined();
    expect(sdk.firewalls).toBeDefined();
    expect(sdk.floatingIps).toBeDefined();
    expect(sdk.loadBalancers).toBeDefined();
    expect(sdk.networkActions).toBeDefined();
    expect(sdk.networks).toBeDefined();
    expect(sdk.placementGroups).toBeDefined();
    expect(sdk.primaryIps).toBeDefined();
    expect(sdk.servers).toBeDefined();
    expect(sdk.sshKeys).toBeDefined();
    expect(sdk.volumes).toBeDefined();
  });

  it('passes apiToken to Configuration as accessToken', () => {
    const deps = stubDeps();
    const sdk = HetznerSdkFactory.create({ apiToken: 'my-token' }, deps);

    expect(deps.Configuration).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'my-token' }),
    );

    // Every API instance should have received the same config object
    const config = (sdk.networks as unknown as { __config: unknown }).__config;
    expect(config).toBeDefined();
  });

  it('forwards basePath to Configuration', () => {
    const deps = stubDeps();
    HetznerSdkFactory.create(
      { apiToken: 'tok', basePath: 'https://custom.api' },
      deps,
    );

    expect(deps.Configuration).toHaveBeenCalledWith(
      expect.objectContaining({ basePath: 'https://custom.api' }),
    );
  });

  it('all API instances share the same Configuration', () => {
    const deps = stubDeps();
    const sdk = HetznerSdkFactory.create({ apiToken: 'shared' }, deps);

    const networksConfig = (sdk.networks as unknown as { __config: unknown })
      .__config;
    const serversConfig = (sdk.servers as unknown as { __config: unknown })
      .__config;
    const volumesConfig = (sdk.volumes as unknown as { __config: unknown })
      .__config;

    expect(networksConfig).toBe(serversConfig);
    expect(serversConfig).toBe(volumesConfig);
  });
});
