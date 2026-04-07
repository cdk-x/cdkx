# Firewall

Hetzner Cloud Firewalls are managed using three separate constructs that map directly to the three Hetzner API endpoint groups:

| Construct | Type | Manages |
|-----------|------|---------|
| `HtzFirewall` | `Hetzner::Security::Firewall` | The firewall entity (name, labels) |
| `HtzFirewallRules` | `Hetzner::Security::FirewallRules` | The complete rules set (atomic replacement) |
| `HtzFirewallAttachment` | `Hetzner::Security::FirewallAttachment` | A single resource attachment (server or label selector) |

Splitting into three constructs lets you update rules independently from attachments, and add or remove individual attachments without touching rules.

**Import:** `@cdk-x/hetzner`

---

## HtzFirewall

Creates and manages the firewall entity.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | ✅ | Name of the Firewall. Must be unique per project. |
| `labels` | `Record<string, string>` | — | User-defined labels. |

### Attribute getters

| Getter | Type | Description |
|--------|------|-------------|
| `attrFirewallId` | `IResolvable` | Numeric ID assigned by Hetzner after creation. Use as input to `HtzFirewallRules` and `HtzFirewallAttachment`. |

### Update behavior

Calls `PUT /firewalls/{id}` — name and labels are freely updatable.

### Destroy behavior

Calls `DELETE /firewalls/{id}`. Hetzner requires all attachments to be removed before deletion. Destroy `HtzFirewallAttachment` resources first (or use `HtzFirewallAttachment.addDependency` to control order).

!!! warning "Destroy fails if firewall is still applied"
    Attempting to delete a firewall that is still applied to resources returns a `422 resource_in_use` error. Remove all attachments before destroying.

---

## HtzFirewallRules

Manages the complete rules set for a firewall via `POST /firewalls/{id}/actions/set_rules`.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `firewallId` | `number \| IResolvable` | ✅ | ID of the Firewall. Typically `firewall.attrFirewallId`. |
| `rules` | `FirewallRule[]` | — | Array of rules. Up to 50 rules per firewall. Omit or pass `[]` for no rules. |

### FirewallRule

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `direction` | `FirewallRuleDirection` | ✅ | `IN` for inbound, `OUT` for outbound. |
| `protocol` | `FirewallRuleProtocol` | ✅ | `TCP`, `UDP`, `ICMP`, `ESP`, or `GRE`. |
| `port` | `string` | — | Port or range (e.g. `"22"`, `"1024-2048"`). Only for `TCP`/`UDP`. |
| `sourceIps` | `string[]` | — | Allowed source CIDRs for `direction: IN`. |
| `destinationIps` | `string[]` | — | Allowed destination CIDRs for `direction: OUT`. |
| `description` | `string` | — | Human-readable description. |

### Update behavior

Both create and update call `set_rules` with the **full** new rules array (atomic replacement). There is no per-rule add/remove — the entire rules list is replaced in a single API call.

### Destroy behavior

Calls `set_rules` with an empty array, clearing all rules from the firewall.

!!! info "Rules are always replaced atomically"
    Changing, adding, or removing a rule always replaces the entire rules list in one API call.

---

## HtzFirewallAttachment

Attaches a firewall to a single resource — either a specific server or a label selector. Each attachment is a separate construct instance.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `firewallId` | `number \| IResolvable` | ✅ | ID of the Firewall. Typically `firewall.attrFirewallId`. |
| `serverId` | `number \| IResolvable` | — | ID of the Server to attach to. Provide either `serverId` or `labelSelector`. |
| `labelSelector` | `string` | — | Label selector string. Attaches to all matching servers. |

`HtzFirewallAttachment` is **immutable** — all props are create-only. To change the target, delete the attachment and create a new one.

### Update behavior

Update is not supported and throws an error. Destroy and recreate to change the target.

### Destroy behavior

Calls `POST /firewalls/{id}/actions/remove_from_resources` for the specific attachment.

---

## Full example

```typescript title="src/main.ts" linenums="1"
import { App, Stack } from '@cdk-x/core';
import {
  HtzFirewall,
  HtzFirewallRules,
  HtzFirewallAttachment,
  HtzServer,
  FirewallRuleDirection,
  FirewallRuleProtocol,
  ServerType,
  Location,
} from '@cdk-x/hetzner';

const app = new App();
const stack = new Stack(app, 'SecurityStack');

const server = new HtzServer(stack, 'AppServer', {
  name: 'app-server',
  serverType: ServerType.CX22,
  image: 'ubuntu-24.04',
  location: Location.NBG1,
});

const firewall = new HtzFirewall(stack, 'AppFirewall', {
  name: 'app-firewall',
});

new HtzFirewallRules(stack, 'AppFirewallRules', {
  firewallId: firewall.attrFirewallId,
  rules: [
    {
      direction: FirewallRuleDirection.IN,
      protocol: FirewallRuleProtocol.TCP,
      port: '22',
      sourceIps: ['0.0.0.0/0', '::/0'],
      description: 'Allow SSH',
    },
    {
      direction: FirewallRuleDirection.IN,
      protocol: FirewallRuleProtocol.TCP,
      port: '443',
      sourceIps: ['0.0.0.0/0', '::/0'],
      description: 'Allow HTTPS',
    },
    {
      direction: FirewallRuleDirection.OUT,
      protocol: FirewallRuleProtocol.TCP,
      destinationIps: ['0.0.0.0/0', '::/0'],
      description: 'Allow all outbound TCP',
    },
  ],
});

// Attach to a specific server
new HtzFirewallAttachment(stack, 'AppFirewallServerAttachment', {
  firewallId: firewall.attrFirewallId,
  serverId: server.attrServerId, // (1)!
});

// Attach to all servers with a label
new HtzFirewallAttachment(stack, 'AppFirewallLabelAttachment', {
  firewallId: firewall.attrFirewallId,
  labelSelector: 'role=web',
});

app.synth();
```

1. `attrServerId` is an `IResolvable` token resolved at deploy time. No cast needed — `serverId` accepts `number | IResolvable`.

---

## Dependency graph

```
HtzServer ──► HtzFirewall ──► HtzFirewallRules
                         └──► HtzFirewallAttachment (server)
HtzFirewall ──► HtzFirewallAttachment (label_selector)
```

The engine infers `HtzFirewallRules` and `HtzFirewallAttachment` dependencies on `HtzFirewall` automatically from the `firewallId` token reference. The dependency on `HtzServer` is inferred from the `serverId` token.

!!! tip "Prefer label selectors for scalability"
    Attaching by label selector means new servers with the label automatically fall under the firewall policy without any cdkx change. Attaching by server ID is more explicit but requires a new `HtzFirewallAttachment` for each server.

---

!!! info "See also"
    - [Server](server.md) — attach a firewall directly to a server via `attrServerId`
    - [Tokens & Cross-resource References](../../concepts/tokens.md) — how token references resolve at deploy time
