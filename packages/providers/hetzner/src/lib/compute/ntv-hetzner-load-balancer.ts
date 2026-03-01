// =============================================================================
// AUTO-GENERATED — do not edit manually.
// Regenerate with: yarn nx run @cdk-x/hetzner:codegen
// =============================================================================

import { ProviderResource, PropertyValue, IResolvable } from '@cdk-x/core';
import { Construct } from 'constructs';
import { HetznerResourceType } from '../common/index.js';

/**
 * Algorithm of the Load Balancer.
 */
export interface LoadBalancerAlgorithm {
  /** Type of the algorithm. */
  readonly type: LoadBalancerAlgorithmType;
}

/**
 * Additional configuration for protocol http.
 */
export interface LoadBalancerServiceHealthCheckHttp {
  /** Host header to send in the HTTP request. May not contain spaces, percent or backslash symbols. Can be null, in that case no host header is sent. */
  readonly domain: string | null;
  /** HTTP path to use for health checks. May not contain literal spaces, use percent-encoding instead. */
  readonly path: string;
  /** String that must be contained in HTTP response in order to pass the health check. */
  readonly response?: string;
  /** List of returned HTTP status codes in order to pass the health check. Supports the wildcards `?` for exactly one character and `*` for multiple ones. */
  readonly statusCodes?: string[];
  /** Use HTTPS for health check. */
  readonly tls?: boolean;
}

/**
 * Service health check.
 */
export interface LoadBalancerServiceHealthCheck {
  /** Type of the health check. */
  readonly protocol: LoadBalancerServiceHealthCheckProtocol;
  /** Port the health check will be performed on. */
  readonly port: number;
  /** Time interval in seconds health checks are performed. */
  readonly interval: number;
  /** Time in seconds after an attempt is considered a timeout. */
  readonly timeout: number;
  /** Unsuccessful retries needed until a target is considered unhealthy; an unhealthy target needs the same number of successful retries to become healthy again. */
  readonly retries: number;
  /** Additional configuration for protocol http. */
  readonly http?: LoadBalancerServiceHealthCheckHttp;
}

/**
 * Configuration option for protocols http and https.
 */
export interface LoadBalancerServiceHttp {
  /** Name of the cookie used for sticky sessions. */
  readonly cookieName?: string;
  /** Lifetime of the cookie used for sticky sessions (in seconds). */
  readonly cookieLifetime?: number;
  /** IDs of the Certificates to use for TLS/SSL termination by the Load Balancer; empty for TLS/SSL passthrough or if `protocol` is `http`. */
  readonly certificates?: number[];
  /** Redirect HTTP requests to HTTPS. Only available if `protocol` is `https`. */
  readonly redirectHttp?: boolean;
  /** Use sticky sessions. Only available if `protocol` is `http` or `https`. */
  readonly stickySessions?: boolean;
}

/**
 * Array of services.
 */
export interface LoadBalancerService {
  /** Protocol of the Load Balancer. */
  readonly protocol: LoadBalancerServiceProtocol;
  /** Port the Load Balancer listens on. */
  readonly listenPort: number;
  /** Port the Load Balancer will balance to. */
  readonly destinationPort: number;
  /** Is Proxyprotocol enabled or not. */
  readonly proxyprotocol: boolean;
  /** Service health check. */
  readonly healthCheck: LoadBalancerServiceHealthCheck;
  /** Configuration option for protocols http and https. */
  readonly http?: LoadBalancerServiceHttp;
}

/**
 * Configuration for type Server, only valid and required if type is `server`.
 */
export interface LoadBalancerTargetServer {}

/**
 * Configuration for label selector targets, only valid and required if type is `label_selector`.
 */
export interface LoadBalancerTargetLabelSelector {
  /** Label selector. */
  readonly selector: string;
}

/**
 * Configuration for an IP target. It is only possible to use the (Public or vSwitch) IPs of Hetzner Online Root Servers belonging to the project owner. IPs belonging to other users are blocked. Additionally IPs belonging to services provided by Hetzner Cloud (Servers, Load Balancers, ...) are blocked as well. Only valid and required if type is `ip`.
 */
export interface LoadBalancerTargetIp {
  /** IP of a server that belongs to the same customer (public IPv4/IPv6) or private IP in a subnet type vswitch. */
  readonly ip: string;
}

/**
 * Array of targets.
 */
export interface LoadBalancerTarget {
  /** Type of the resource. */
  readonly type: LoadBalancerTargetType;
  /** Configuration for type Server, only valid and required if type is `server`. */
  readonly server?: LoadBalancerTargetServer;
  /** Use the private network IP instead of the public IP of the Server, requires the Server and Load Balancer to be in the same network. Only valid for target types `server` and `label_selector`. */
  readonly usePrivateIp?: boolean;
  /** Configuration for label selector targets, only valid and required if type is `label_selector`. */
  readonly labelSelector?: LoadBalancerTargetLabelSelector;
  /** Configuration for an IP target. It is only possible to use the (Public or vSwitch) IPs of Hetzner Online Root Servers belonging to the project owner. IPs belonging to other users are blocked. Additionally IPs belonging to services provided by Hetzner Cloud (Servers, Load Balancers, ...) are blocked as well. Only valid and required if type is `ip`. */
  readonly ip?: LoadBalancerTargetIp;
}

/**
 * Type of the algorithm.
 */
export enum LoadBalancerAlgorithmType {
  ROUND_ROBIN = 'round_robin',
  LEAST_CONNECTIONS = 'least_connections',
}

/**
 * Protocol of the Load Balancer.
 */
export enum LoadBalancerServiceProtocol {
  TCP = 'tcp',
  HTTP = 'http',
  HTTPS = 'https',
}

/**
 * Type of the health check.
 */
export enum LoadBalancerServiceHealthCheckProtocol {
  TCP = 'tcp',
  HTTP = 'http',
}

/**
 * Type of the resource.
 */
export enum LoadBalancerTargetType {
  SERVER = 'server',
  LABEL_SELECTOR = 'label_selector',
  IP = 'ip',
}

/**
 * Properties that describe a Hetzner LoadBalancer resource.
 */
export interface HetznerLoadBalancer {
  /** Name of the Load Balancer. */
  readonly name: string;
  /** ID or name of the Load Balancer type this Load Balancer should be created with. */
  readonly loadBalancerType: string;
  /** Algorithm of the Load Balancer. */
  readonly algorithm?: LoadBalancerAlgorithm;
  /** Array of services. */
  readonly services?: LoadBalancerService[];
  /** Array of targets. */
  readonly targets?: LoadBalancerTarget[];
  /** User-defined labels (`key/value` pairs) for the Resource. */
  readonly labels?: Record<string, string>;
  /** Enable or disable the public interface of the Load Balancer. */
  readonly publicInterface?: boolean;
  /** ID of the network the Load Balancer should be attached to on creation. */
  readonly network?: number;
  /** Name of network zone. */
  readonly networkZone?: string;
  /** ID or name of Location to create Load Balancer in. */
  readonly location?: string;
}

/**
 * Props for {@link NtvHetznerLoadBalancer}.
 *
 * Identical to {@link HetznerLoadBalancer} — extended here for future additions.
 */
export interface NtvHetznerLoadBalancerProps extends HetznerLoadBalancer {}

/**
 * L1 construct representing a `Hetzner::Compute::LoadBalancer` resource.
 */
export class NtvHetznerLoadBalancer extends ProviderResource {
  /**
   * Cloud-assigned ID of this loadbalancer resource.
   */
  get loadbalancerId(): IResolvable {
    return {
      resolve: () => ({ ref: this.logicalId, attr: 'loadbalancerId' }),
    };
  }

  /**
   * @param scope - The construct scope (parent).
   * @param id    - The construct ID, unique within the scope.
   * @param props - Resource configuration.
   */
  constructor(
    scope: Construct,
    id: string,
    props: NtvHetznerLoadBalancerProps,
  ) {
    super(scope, id, {
      type: HetznerResourceType.Compute.LOADBALANCER,
      properties: props as unknown as Record<string, PropertyValue>,
    });
    this.node.defaultChild = this;
  }
}
