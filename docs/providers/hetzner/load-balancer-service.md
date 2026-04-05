# Load Balancer Service

`HtzLoadBalancerService` manages a listener on a [Hetzner Cloud Load Balancer](https://docs.hetzner.com/cloud/load-balancers/overview). Each service defines a port the load balancer listens on, the protocol it uses, an optional health check, and optional HTTP-specific settings.

**Type:** `Hetzner::Compute::LoadBalancerService`
**Import:** `@cdkx-io/hetzner`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `loadBalancerId` | `string \| IResolvable` | ✅ | ID of the load balancer that owns this service. Create-only. |
| `listenPort` | `number` | ✅ | Port the load balancer listens on (1–65535). Create-only. |
| `protocol` | `LoadBalancerServiceProtocol` | — | Protocol for this service. Defaults to `tcp`. |
| `destinationPort` | `number` | — | Port on backend targets to forward traffic to. Defaults to the same as `listenPort`. |
| `proxyprotocol` | `boolean` | — | Prepend PROXY protocol header to connections. Requires backend support. |
| `healthCheck` | `LoadBalancerServiceHealthCheck` | — | Health check configuration. See below. |
| `http` | `LoadBalancerServiceHttp` | — | HTTP/HTTPS-specific settings. Only applicable when `protocol` is `http` or `https`. |

### `LoadBalancerServiceProtocol` enum

| Value | Description |
|-------|-------------|
| `LoadBalancerServiceProtocol.TCP` | Raw TCP passthrough. |
| `LoadBalancerServiceProtocol.HTTP` | HTTP with optional redirect and cookie-based stickiness. |
| `LoadBalancerServiceProtocol.HTTPS` | HTTPS with TLS termination at the load balancer. |

### `LoadBalancerServiceHealthCheck` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `protocol` | `LoadBalancerServiceHealthCheckProtocol` | ✅ | `tcp` or `http`. |
| `port` | `number` | ✅ | Port on the target to send health checks to. |
| `interval` | `number` | ✅ | Seconds between health checks. |
| `timeout` | `number` | ✅ | Seconds before a health check times out. |
| `retries` | `number` | ✅ | Number of consecutive failures before marking a target unhealthy. |
| `http` | `LoadBalancerServiceHealthCheckHttp` | — | HTTP-specific health check settings. Required when `protocol` is `http`. |

### `LoadBalancerServiceHealthCheckHttp` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | `string` | — | `Host` header value sent with the health check request. |
| `path` | `string` | — | URL path to request (e.g. `/health`). |
| `response` | `string` | — | Expected response body substring. |
| `statusCodes` | `string[]` | — | Acceptable HTTP status codes (e.g. `['2??', '301']`). |
| `tls` | `boolean` | — | Use TLS for the health check even when the main protocol is `http`. |

### `LoadBalancerServiceHttp` object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `certificates` | `(string \| IResolvable)[]` | — | Certificate IDs for TLS termination. Required when `protocol` is `https`. |
| `cookieName` | `string` | — | Cookie name for sticky sessions. |
| `cookieLifetime` | `number` | — | Sticky session cookie lifetime in seconds. |
| `redirectHttp` | `boolean` | — | Redirect HTTP (port 80) to HTTPS. Only applies when `protocol` is `https`. |
| `stickySessions` | `boolean` | — | Enable cookie-based session stickiness. |

## Synthesized output

The service does not have a standalone resource ID — it is identified by the combination `loadBalancerId/listenPort`.

```json
{
  "LbStackHttpServiceA1B2C3D4": {
    "type": "Hetzner::Compute::LoadBalancerService",
    "provider": "hetzner",
    "properties": {
      "loadBalancerId": { "ref": "LbStackLoadBalancerA1B2C3D4", "attr": "loadBalancerId" },
      "listenPort": 80,
      "protocol": "tcp",
      "destinationPort": 8080,
      "proxyprotocol": false
    },
    "metadata": { "cdkx:path": "LbStack/HttpService" }
  }
}
```

## Create example — TCP listener

```typescript title="src/main.ts" linenums="1" hl_lines="9 10 11 12 13 14"
import { App, Stack } from '@cdkx-io/core';
import { HtzLoadBalancer, HtzLoadBalancerService, LoadBalancerType, LoadBalancerServiceProtocol, NetworkZone } from '@cdkx-io/hetzner';

const app = new App();
const stack = new Stack(app, 'LbStack');

const lb = new HtzLoadBalancer(stack, 'LoadBalancer', {
  name: 'my-lb',
  loadBalancerType: LoadBalancerType.LB11,
  networkZone: NetworkZone.EU_CENTRAL,
});

new HtzLoadBalancerService(stack, 'HttpService', {
  loadBalancerId: lb.attrLoadBalancerId, // (1)!
  listenPort: 80,
  protocol: LoadBalancerServiceProtocol.TCP,
  destinationPort: 8080, // (2)!
  proxyprotocol: false,
});

app.synth();
```

1. `attrLoadBalancerId` resolves to the integer load balancer ID. The service is created after the load balancer.
2. Frontend listens on port 80, forwards to port 8080 on the backend.

## Create example — HTTPS with health check

```typescript linenums="1" hl_lines="5 6 7 8 9 10 11 12 13 14 15 16 17 18"
import { HtzCertificate, HtzLoadBalancerService, CertificateType, LoadBalancerServiceProtocol } from '@cdkx-io/hetzner';

const cert = new HtzCertificate(stack, 'Cert', {
  name: 'my-cert',
  type: CertificateType.MANAGED,
  domainNames: ['example.com'],
});

new HtzLoadBalancerService(stack, 'HttpsService', {
  loadBalancerId: lb.attrLoadBalancerId,
  listenPort: 443,
  protocol: LoadBalancerServiceProtocol.HTTPS,
  destinationPort: 80,
  http: {
    certificates: [cert.attrCertificateId], // (1)!
    redirectHttp: true,                     // (2)!
    stickySessions: false,
  },
  healthCheck: {
    protocol: 'http',
    port: 80,
    interval: 15,
    timeout: 10,
    retries: 3,
    http: {
      path: '/health',
      statusCodes: ['2??'],
    },
  },
});
```

1. The certificate must be created before the service. Using `attrCertificateId` creates this dependency automatically.
2. The load balancer automatically redirects plain HTTP requests to HTTPS.

## Destroy behavior

The engine calls `POST /load_balancers/{id}/actions/delete_service` with the `listen_port`. If targets depend on this service, destroy them first. The load balancer itself can only be deleted after all its services are removed.

!!! info "Update limitations"
    Health check and HTTP configuration cannot be updated in-place. To change these settings, destroy and recreate the service. Only `destinationPort`, `protocol`, and `proxyprotocol` can be updated without recreation.

---

!!! info "See also"
    - [Load Balancer](load-balancer.md) — the parent resource
    - [Load Balancer Target](load-balancer-target.md) — register backend servers
    - [Certificate](certificate.md) — TLS certificates for HTTPS services
    - [Tokens](../../concepts/tokens.md) — how `attrLoadBalancerId` resolves at deploy time
