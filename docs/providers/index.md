# Providers

cdkx providers bridge the gap between your TypeScript construct tree and a target platform's API. Each provider ships as a separate npm package and adds its own set of L1 constructs and a runtime deployment adapter.

<div class="grid cards" markdown>

-   **Hetzner Cloud**

    ---

    Manage Hetzner Cloud infrastructure — networks, servers, load balancers, volumes, floating IPs, and more. Deploys via the Hetzner Cloud API.

    **Status:** Alpha &nbsp;·&nbsp; **Resources:** 15

    [:octicons-arrow-right-24: Hetzner Cloud](hetzner/index.md)

-   **Multipass**

    ---

    Provision and manage local Ubuntu VMs using Canonical Multipass. Ideal for local development environments. No cloud account required.

    **Status:** Alpha &nbsp;·&nbsp; **Resources:** 1

    [:octicons-arrow-right-24: Multipass](multipass/index.md)

</div>

## How providers work

Each provider is split into two packages:

| Package | Role |
|---------|------|
| `@cdk-x/<provider>` | L1 constructs — TypeScript classes you use in your `App` |
| `@cdk-x/<provider>-runtime` | Deployment adapter — called by the engine at `cdkx deploy` time |

At synthesis, constructs emit a JSON manifest. At deploy time, the engine loads the runtime adapter, resolves cross-resource tokens, and calls the provider API in dependency order.
