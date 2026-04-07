## @cdk-x/hetzner-sdk@1.0.0

This generator creates TypeScript/JavaScript client that utilizes [axios](https://github.com/axios/axios). The generated Node module can be used in the following environments:

Environment

- Node.js
- Webpack
- Browserify

Language level

- ES5 - you must have a Promises/A+ library installed
- ES6

Module system

- CommonJS
- ES6 module system

It can be used in both TypeScript and JavaScript. In TypeScript, the definition will be automatically resolved via `package.json`. ([Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html))

### Building

To build and compile the typescript sources to javascript use:

```
npm install
npm run build
```

### Publishing

First build the package then run `npm publish`

### Consuming

navigate to the folder of your consuming project and run one of the following commands.

_published:_

```
npm install @cdk-x/hetzner-sdk@1.0.0 --save
```

_unPublished (not recommended):_

```
npm install PATH_TO_GENERATED_PACKAGE --save
```

### Documentation for API Endpoints

All URIs are relative to *https://api.hetzner.cloud/v1*

| Class                    | Method                                                                                                      | HTTP request                                                                      | Description                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------- |
| _ActionsApi_             | [**getAction**](docs/ActionsApi.md#getaction)                                                               | **GET** /actions/{id}                                                             | Get an Action                                   |
| _ActionsApi_             | [**getActions**](docs/ActionsApi.md#getactions)                                                             | **GET** /actions                                                                  | Get multiple Actions                            |
| _CertificateActionsApi_  | [**getCertificateAction**](docs/CertificateActionsApi.md#getcertificateaction)                              | **GET** /certificates/{id}/actions/{action_id}                                    | Get an Action for a Certificate                 |
| _CertificateActionsApi_  | [**getCertificatesAction**](docs/CertificateActionsApi.md#getcertificatesaction)                            | **GET** /certificates/actions/{id}                                                | Get an Action                                   |
| _CertificateActionsApi_  | [**listCertificateActions**](docs/CertificateActionsApi.md#listcertificateactions)                          | **GET** /certificates/{id}/actions                                                | List Actions for a Certificate                  |
| _CertificateActionsApi_  | [**listCertificatesActions**](docs/CertificateActionsApi.md#listcertificatesactions)                        | **GET** /certificates/actions                                                     | List Actions                                    |
| _CertificateActionsApi_  | [**retryCertificate**](docs/CertificateActionsApi.md#retrycertificate)                                      | **POST** /certificates/{id}/actions/retry                                         | Retry Issuance or Renewal                       |
| _CertificatesApi_        | [**createCertificate**](docs/CertificatesApi.md#createcertificate)                                          | **POST** /certificates                                                            | Create a Certificate                            |
| _CertificatesApi_        | [**deleteCertificate**](docs/CertificatesApi.md#deletecertificate)                                          | **DELETE** /certificates/{id}                                                     | Delete a Certificate                            |
| _CertificatesApi_        | [**getCertificate**](docs/CertificatesApi.md#getcertificate)                                                | **GET** /certificates/{id}                                                        | Get a Certificate                               |
| _CertificatesApi_        | [**listCertificates**](docs/CertificatesApi.md#listcertificates)                                            | **GET** /certificates                                                             | List Certificates                               |
| _CertificatesApi_        | [**updateCertificate**](docs/CertificatesApi.md#updatecertificate)                                          | **PUT** /certificates/{id}                                                        | Update a Certificate                            |
| _DataCentersApi_         | [**getDatacenter**](docs/DataCentersApi.md#getdatacenter)                                                   | **GET** /datacenters/{id}                                                         | Get a Data Center                               |
| _DataCentersApi_         | [**listDatacenters**](docs/DataCentersApi.md#listdatacenters)                                               | **GET** /datacenters                                                              | List Data Centers                               |
| _FirewallActionsApi_     | [**applyFirewallToResources**](docs/FirewallActionsApi.md#applyfirewalltoresources)                         | **POST** /firewalls/{id}/actions/apply_to_resources                               | Apply to Resources                              |
| _FirewallActionsApi_     | [**getFirewallAction**](docs/FirewallActionsApi.md#getfirewallaction)                                       | **GET** /firewalls/{id}/actions/{action_id}                                       | Get an Action for a Firewall                    |
| _FirewallActionsApi_     | [**getFirewallsAction**](docs/FirewallActionsApi.md#getfirewallsaction)                                     | **GET** /firewalls/actions/{id}                                                   | Get an Action                                   |
| _FirewallActionsApi_     | [**listFirewallActions**](docs/FirewallActionsApi.md#listfirewallactions)                                   | **GET** /firewalls/{id}/actions                                                   | List Actions for a Firewall                     |
| _FirewallActionsApi_     | [**listFirewallsActions**](docs/FirewallActionsApi.md#listfirewallsactions)                                 | **GET** /firewalls/actions                                                        | List Actions                                    |
| _FirewallActionsApi_     | [**removeFirewallFromResources**](docs/FirewallActionsApi.md#removefirewallfromresources)                   | **POST** /firewalls/{id}/actions/remove_from_resources                            | Remove from Resources                           |
| _FirewallActionsApi_     | [**setFirewallRules**](docs/FirewallActionsApi.md#setfirewallrules)                                         | **POST** /firewalls/{id}/actions/set_rules                                        | Set Rules                                       |
| _FirewallsApi_           | [**createFirewall**](docs/FirewallsApi.md#createfirewall)                                                   | **POST** /firewalls                                                               | Create a Firewall                               |
| _FirewallsApi_           | [**deleteFirewall**](docs/FirewallsApi.md#deletefirewall)                                                   | **DELETE** /firewalls/{id}                                                        | Delete a Firewall                               |
| _FirewallsApi_           | [**getFirewall**](docs/FirewallsApi.md#getfirewall)                                                         | **GET** /firewalls/{id}                                                           | Get a Firewall                                  |
| _FirewallsApi_           | [**listFirewalls**](docs/FirewallsApi.md#listfirewalls)                                                     | **GET** /firewalls                                                                | List Firewalls                                  |
| _FirewallsApi_           | [**updateFirewall**](docs/FirewallsApi.md#updatefirewall)                                                   | **PUT** /firewalls/{id}                                                           | Update a Firewall                               |
| _FloatingIPActionsApi_   | [**assignFloatingIp**](docs/FloatingIPActionsApi.md#assignfloatingip)                                       | **POST** /floating_ips/{id}/actions/assign                                        | Assign a Floating IP to a Server                |
| _FloatingIPActionsApi_   | [**changeFloatingIpDnsPtr**](docs/FloatingIPActionsApi.md#changefloatingipdnsptr)                           | **POST** /floating_ips/{id}/actions/change_dns_ptr                                | Change reverse DNS records for a Floating IP    |
| _FloatingIPActionsApi_   | [**changeFloatingIpProtection**](docs/FloatingIPActionsApi.md#changefloatingipprotection)                   | **POST** /floating_ips/{id}/actions/change_protection                             | Change Floating IP Protection                   |
| _FloatingIPActionsApi_   | [**getFloatingIpAction**](docs/FloatingIPActionsApi.md#getfloatingipaction)                                 | **GET** /floating_ips/{id}/actions/{action_id}                                    | Get an Action for a Floating IP                 |
| _FloatingIPActionsApi_   | [**getFloatingIpsAction**](docs/FloatingIPActionsApi.md#getfloatingipsaction)                               | **GET** /floating_ips/actions/{id}                                                | Get an Action                                   |
| _FloatingIPActionsApi_   | [**listFloatingIpActions**](docs/FloatingIPActionsApi.md#listfloatingipactions)                             | **GET** /floating_ips/{id}/actions                                                | List Actions for a Floating IP                  |
| _FloatingIPActionsApi_   | [**listFloatingIpsActions**](docs/FloatingIPActionsApi.md#listfloatingipsactions)                           | **GET** /floating_ips/actions                                                     | List Actions                                    |
| _FloatingIPActionsApi_   | [**unassignFloatingIp**](docs/FloatingIPActionsApi.md#unassignfloatingip)                                   | **POST** /floating_ips/{id}/actions/unassign                                      | Unassign a Floating IP                          |
| _FloatingIPsApi_         | [**createFloatingIp**](docs/FloatingIPsApi.md#createfloatingip)                                             | **POST** /floating_ips                                                            | Create a Floating IP                            |
| _FloatingIPsApi_         | [**deleteFloatingIp**](docs/FloatingIPsApi.md#deletefloatingip)                                             | **DELETE** /floating_ips/{id}                                                     | Delete a Floating IP                            |
| _FloatingIPsApi_         | [**getFloatingIp**](docs/FloatingIPsApi.md#getfloatingip)                                                   | **GET** /floating_ips/{id}                                                        | Get a Floating IP                               |
| _FloatingIPsApi_         | [**listFloatingIps**](docs/FloatingIPsApi.md#listfloatingips)                                               | **GET** /floating_ips                                                             | List Floating IPs                               |
| _FloatingIPsApi_         | [**updateFloatingIp**](docs/FloatingIPsApi.md#updatefloatingip)                                             | **PUT** /floating_ips/{id}                                                        | Update a Floating IP                            |
| _ISOsApi_                | [**getIso**](docs/ISOsApi.md#getiso)                                                                        | **GET** /isos/{id}                                                                | Get an ISO                                      |
| _ISOsApi_                | [**listIsos**](docs/ISOsApi.md#listisos)                                                                    | **GET** /isos                                                                     | List ISOs                                       |
| _ImageActionsApi_        | [**changeImageProtection**](docs/ImageActionsApi.md#changeimageprotection)                                  | **POST** /images/{id}/actions/change_protection                                   | Change Image Protection                         |
| _ImageActionsApi_        | [**getImageAction**](docs/ImageActionsApi.md#getimageaction)                                                | **GET** /images/{id}/actions/{action_id}                                          | Get an Action for an Image                      |
| _ImageActionsApi_        | [**getImagesAction**](docs/ImageActionsApi.md#getimagesaction)                                              | **GET** /images/actions/{id}                                                      | Get an Action                                   |
| _ImageActionsApi_        | [**listImageActions**](docs/ImageActionsApi.md#listimageactions)                                            | **GET** /images/{id}/actions                                                      | List Actions for an Image                       |
| _ImageActionsApi_        | [**listImagesActions**](docs/ImageActionsApi.md#listimagesactions)                                          | **GET** /images/actions                                                           | List Actions                                    |
| _ImagesApi_              | [**deleteImage**](docs/ImagesApi.md#deleteimage)                                                            | **DELETE** /images/{id}                                                           | Delete an Image                                 |
| _ImagesApi_              | [**getImage**](docs/ImagesApi.md#getimage)                                                                  | **GET** /images/{id}                                                              | Get an Image                                    |
| _ImagesApi_              | [**listImages**](docs/ImagesApi.md#listimages)                                                              | **GET** /images                                                                   | List Images                                     |
| _ImagesApi_              | [**updateImage**](docs/ImagesApi.md#updateimage)                                                            | **PUT** /images/{id}                                                              | Update an Image                                 |
| _LoadBalancerActionsApi_ | [**addLoadBalancerService**](docs/LoadBalancerActionsApi.md#addloadbalancerservice)                         | **POST** /load_balancers/{id}/actions/add_service                                 | Add Service                                     |
| _LoadBalancerActionsApi_ | [**addLoadBalancerTarget**](docs/LoadBalancerActionsApi.md#addloadbalancertarget)                           | **POST** /load_balancers/{id}/actions/add_target                                  | Add Target                                      |
| _LoadBalancerActionsApi_ | [**attachLoadBalancerToNetwork**](docs/LoadBalancerActionsApi.md#attachloadbalancertonetwork)               | **POST** /load_balancers/{id}/actions/attach_to_network                           | Attach a Load Balancer to a Network             |
| _LoadBalancerActionsApi_ | [**changeLoadBalancerAlgorithm**](docs/LoadBalancerActionsApi.md#changeloadbalanceralgorithm)               | **POST** /load_balancers/{id}/actions/change_algorithm                            | Change Algorithm                                |
| _LoadBalancerActionsApi_ | [**changeLoadBalancerDnsPtr**](docs/LoadBalancerActionsApi.md#changeloadbalancerdnsptr)                     | **POST** /load_balancers/{id}/actions/change_dns_ptr                              | Change reverse DNS entry for this Load Balancer |
| _LoadBalancerActionsApi_ | [**changeLoadBalancerProtection**](docs/LoadBalancerActionsApi.md#changeloadbalancerprotection)             | **POST** /load_balancers/{id}/actions/change_protection                           | Change Load Balancer Protection                 |
| _LoadBalancerActionsApi_ | [**changeLoadBalancerType**](docs/LoadBalancerActionsApi.md#changeloadbalancertype)                         | **POST** /load_balancers/{id}/actions/change_type                                 | Change the Type of a Load Balancer              |
| _LoadBalancerActionsApi_ | [**deleteLoadBalancerService**](docs/LoadBalancerActionsApi.md#deleteloadbalancerservice)                   | **POST** /load_balancers/{id}/actions/delete_service                              | Delete Service                                  |
| _LoadBalancerActionsApi_ | [**detachLoadBalancerFromNetwork**](docs/LoadBalancerActionsApi.md#detachloadbalancerfromnetwork)           | **POST** /load_balancers/{id}/actions/detach_from_network                         | Detach a Load Balancer from a Network           |
| _LoadBalancerActionsApi_ | [**disableLoadBalancerPublicInterface**](docs/LoadBalancerActionsApi.md#disableloadbalancerpublicinterface) | **POST** /load_balancers/{id}/actions/disable_public_interface                    | Disable the public interface of a Load Balancer |
| _LoadBalancerActionsApi_ | [**enableLoadBalancerPublicInterface**](docs/LoadBalancerActionsApi.md#enableloadbalancerpublicinterface)   | **POST** /load_balancers/{id}/actions/enable_public_interface                     | Enable the public interface of a Load Balancer  |
| _LoadBalancerActionsApi_ | [**getLoadBalancerAction**](docs/LoadBalancerActionsApi.md#getloadbalanceraction)                           | **GET** /load_balancers/{id}/actions/{action_id}                                  | Get an Action for a Load Balancer               |
| _LoadBalancerActionsApi_ | [**getLoadBalancersAction**](docs/LoadBalancerActionsApi.md#getloadbalancersaction)                         | **GET** /load_balancers/actions/{id}                                              | Get an Action                                   |
| _LoadBalancerActionsApi_ | [**listLoadBalancerActions**](docs/LoadBalancerActionsApi.md#listloadbalanceractions)                       | **GET** /load_balancers/{id}/actions                                              | List Actions for a Load Balancer                |
| _LoadBalancerActionsApi_ | [**listLoadBalancersActions**](docs/LoadBalancerActionsApi.md#listloadbalancersactions)                     | **GET** /load_balancers/actions                                                   | List Actions                                    |
| _LoadBalancerActionsApi_ | [**removeLoadBalancerTarget**](docs/LoadBalancerActionsApi.md#removeloadbalancertarget)                     | **POST** /load_balancers/{id}/actions/remove_target                               | Remove Target                                   |
| _LoadBalancerActionsApi_ | [**updateLoadBalancerService**](docs/LoadBalancerActionsApi.md#updateloadbalancerservice)                   | **POST** /load_balancers/{id}/actions/update_service                              | Update Service                                  |
| _LoadBalancerTypesApi_   | [**getLoadBalancerType**](docs/LoadBalancerTypesApi.md#getloadbalancertype)                                 | **GET** /load_balancer_types/{id}                                                 | Get a Load Balancer Type                        |
| _LoadBalancerTypesApi_   | [**listLoadBalancerTypes**](docs/LoadBalancerTypesApi.md#listloadbalancertypes)                             | **GET** /load_balancer_types                                                      | List Load Balancer Types                        |
| _LoadBalancersApi_       | [**createLoadBalancer**](docs/LoadBalancersApi.md#createloadbalancer)                                       | **POST** /load_balancers                                                          | Create a Load Balancer                          |
| _LoadBalancersApi_       | [**deleteLoadBalancer**](docs/LoadBalancersApi.md#deleteloadbalancer)                                       | **DELETE** /load_balancers/{id}                                                   | Delete a Load Balancer                          |
| _LoadBalancersApi_       | [**getLoadBalancer**](docs/LoadBalancersApi.md#getloadbalancer)                                             | **GET** /load_balancers/{id}                                                      | Get a Load Balancer                             |
| _LoadBalancersApi_       | [**getLoadBalancerMetrics**](docs/LoadBalancersApi.md#getloadbalancermetrics)                               | **GET** /load_balancers/{id}/metrics                                              | Get Metrics for a LoadBalancer                  |
| _LoadBalancersApi_       | [**listLoadBalancers**](docs/LoadBalancersApi.md#listloadbalancers)                                         | **GET** /load_balancers                                                           | List Load Balancers                             |
| _LoadBalancersApi_       | [**updateLoadBalancer**](docs/LoadBalancersApi.md#updateloadbalancer)                                       | **PUT** /load_balancers/{id}                                                      | Update a Load Balancer                          |
| _LocationsApi_           | [**getLocation**](docs/LocationsApi.md#getlocation)                                                         | **GET** /locations/{id}                                                           | Get a Location                                  |
| _LocationsApi_           | [**listLocations**](docs/LocationsApi.md#listlocations)                                                     | **GET** /locations                                                                | List Locations                                  |
| _NetworkActionsApi_      | [**addNetworkRoute**](docs/NetworkActionsApi.md#addnetworkroute)                                            | **POST** /networks/{id}/actions/add_route                                         | Add a route to a Network                        |
| _NetworkActionsApi_      | [**addNetworkSubnet**](docs/NetworkActionsApi.md#addnetworksubnet)                                          | **POST** /networks/{id}/actions/add_subnet                                        | Add a subnet to a Network                       |
| _NetworkActionsApi_      | [**changeNetworkIpRange**](docs/NetworkActionsApi.md#changenetworkiprange)                                  | **POST** /networks/{id}/actions/change_ip_range                                   | Change IP range of a Network                    |
| _NetworkActionsApi_      | [**changeNetworkProtection**](docs/NetworkActionsApi.md#changenetworkprotection)                            | **POST** /networks/{id}/actions/change_protection                                 | Change Network Protection                       |
| _NetworkActionsApi_      | [**deleteNetworkRoute**](docs/NetworkActionsApi.md#deletenetworkroute)                                      | **POST** /networks/{id}/actions/delete_route                                      | Delete a route from a Network                   |
| _NetworkActionsApi_      | [**deleteNetworkSubnet**](docs/NetworkActionsApi.md#deletenetworksubnet)                                    | **POST** /networks/{id}/actions/delete_subnet                                     | Delete a subnet from a Network                  |
| _NetworkActionsApi_      | [**getNetworkAction**](docs/NetworkActionsApi.md#getnetworkaction)                                          | **GET** /networks/{id}/actions/{action_id}                                        | Get an Action for a Network                     |
| _NetworkActionsApi_      | [**getNetworksAction**](docs/NetworkActionsApi.md#getnetworksaction)                                        | **GET** /networks/actions/{id}                                                    | Get an Action                                   |
| _NetworkActionsApi_      | [**listNetworkActions**](docs/NetworkActionsApi.md#listnetworkactions)                                      | **GET** /networks/{id}/actions                                                    | List Actions for a Network                      |
| _NetworkActionsApi_      | [**listNetworksActions**](docs/NetworkActionsApi.md#listnetworksactions)                                    | **GET** /networks/actions                                                         | List Actions                                    |
| _NetworksApi_            | [**createNetwork**](docs/NetworksApi.md#createnetwork)                                                      | **POST** /networks                                                                | Create a Network                                |
| _NetworksApi_            | [**deleteNetwork**](docs/NetworksApi.md#deletenetwork)                                                      | **DELETE** /networks/{id}                                                         | Delete a Network                                |
| _NetworksApi_            | [**getNetwork**](docs/NetworksApi.md#getnetwork)                                                            | **GET** /networks/{id}                                                            | Get a Network                                   |
| _NetworksApi_            | [**listNetworks**](docs/NetworksApi.md#listnetworks)                                                        | **GET** /networks                                                                 | List Networks                                   |
| _NetworksApi_            | [**updateNetwork**](docs/NetworksApi.md#updatenetwork)                                                      | **PUT** /networks/{id}                                                            | Update a Network                                |
| _PlacementGroupsApi_     | [**createPlacementGroup**](docs/PlacementGroupsApi.md#createplacementgroup)                                 | **POST** /placement_groups                                                        | Create a PlacementGroup                         |
| _PlacementGroupsApi_     | [**deletePlacementGroup**](docs/PlacementGroupsApi.md#deleteplacementgroup)                                 | **DELETE** /placement_groups/{id}                                                 | Delete a PlacementGroup                         |
| _PlacementGroupsApi_     | [**getPlacementGroup**](docs/PlacementGroupsApi.md#getplacementgroup)                                       | **GET** /placement_groups/{id}                                                    | Get a PlacementGroup                            |
| _PlacementGroupsApi_     | [**listPlacementGroups**](docs/PlacementGroupsApi.md#listplacementgroups)                                   | **GET** /placement_groups                                                         | List Placement Groups                           |
| _PlacementGroupsApi_     | [**updatePlacementGroup**](docs/PlacementGroupsApi.md#updateplacementgroup)                                 | **PUT** /placement_groups/{id}                                                    | Update a PlacementGroup                         |
| _PricingApi_             | [**getPricing**](docs/PricingApi.md#getpricing)                                                             | **GET** /pricing                                                                  | Get all prices                                  |
| _PrimaryIPActionsApi_    | [**assignPrimaryIp**](docs/PrimaryIPActionsApi.md#assignprimaryip)                                          | **POST** /primary_ips/{id}/actions/assign                                         | Assign a Primary IP to a resource               |
| _PrimaryIPActionsApi_    | [**changePrimaryIpDnsPtr**](docs/PrimaryIPActionsApi.md#changeprimaryipdnsptr)                              | **POST** /primary_ips/{id}/actions/change_dns_ptr                                 | Change reverse DNS records for a Primary IP     |
| _PrimaryIPActionsApi_    | [**changePrimaryIpProtection**](docs/PrimaryIPActionsApi.md#changeprimaryipprotection)                      | **POST** /primary_ips/{id}/actions/change_protection                              | Change Primary IP Protection                    |
| _PrimaryIPActionsApi_    | [**getPrimaryIpAction**](docs/PrimaryIPActionsApi.md#getprimaryipaction)                                    | **GET** /primary_ips/{id}/actions/{action_id}                                     | Get an Action for a Primary IP                  |
| _PrimaryIPActionsApi_    | [**getPrimaryIpsAction**](docs/PrimaryIPActionsApi.md#getprimaryipsaction)                                  | **GET** /primary_ips/actions/{id}                                                 | Get an Action                                   |
| _PrimaryIPActionsApi_    | [**listPrimaryIpActions**](docs/PrimaryIPActionsApi.md#listprimaryipactions)                                | **GET** /primary_ips/{id}/actions                                                 | List Actions for a Primary IP                   |
| _PrimaryIPActionsApi_    | [**listPrimaryIpsActions**](docs/PrimaryIPActionsApi.md#listprimaryipsactions)                              | **GET** /primary_ips/actions                                                      | List Actions                                    |
| _PrimaryIPActionsApi_    | [**unassignPrimaryIp**](docs/PrimaryIPActionsApi.md#unassignprimaryip)                                      | **POST** /primary_ips/{id}/actions/unassign                                       | Unassign a Primary IP from a resource           |
| _PrimaryIPsApi_          | [**createPrimaryIp**](docs/PrimaryIPsApi.md#createprimaryip)                                                | **POST** /primary_ips                                                             | Create a Primary IP                             |
| _PrimaryIPsApi_          | [**deletePrimaryIp**](docs/PrimaryIPsApi.md#deleteprimaryip)                                                | **DELETE** /primary_ips/{id}                                                      | Delete a Primary IP                             |
| _PrimaryIPsApi_          | [**getPrimaryIp**](docs/PrimaryIPsApi.md#getprimaryip)                                                      | **GET** /primary_ips/{id}                                                         | Get a Primary IP                                |
| _PrimaryIPsApi_          | [**listPrimaryIps**](docs/PrimaryIPsApi.md#listprimaryips)                                                  | **GET** /primary_ips                                                              | List Primary IPs                                |
| _PrimaryIPsApi_          | [**updatePrimaryIp**](docs/PrimaryIPsApi.md#updateprimaryip)                                                | **PUT** /primary_ips/{id}                                                         | Update a Primary IP                             |
| _SSHKeysApi_             | [**createSshKey**](docs/SSHKeysApi.md#createsshkey)                                                         | **POST** /ssh_keys                                                                | Create an SSH key                               |
| _SSHKeysApi_             | [**deleteSshKey**](docs/SSHKeysApi.md#deletesshkey)                                                         | **DELETE** /ssh_keys/{id}                                                         | Delete an SSH key                               |
| _SSHKeysApi_             | [**getSshKey**](docs/SSHKeysApi.md#getsshkey)                                                               | **GET** /ssh_keys/{id}                                                            | Get a SSH key                                   |
| _SSHKeysApi_             | [**listSshKeys**](docs/SSHKeysApi.md#listsshkeys)                                                           | **GET** /ssh_keys                                                                 | List SSH keys                                   |
| _SSHKeysApi_             | [**updateSshKey**](docs/SSHKeysApi.md#updatesshkey)                                                         | **PUT** /ssh_keys/{id}                                                            | Update an SSH key                               |
| _ServerActionsApi_       | [**addServerToPlacementGroup**](docs/ServerActionsApi.md#addservertoplacementgroup)                         | **POST** /servers/{id}/actions/add_to_placement_group                             | Add a Server to a Placement Group               |
| _ServerActionsApi_       | [**attachServerIso**](docs/ServerActionsApi.md#attachserveriso)                                             | **POST** /servers/{id}/actions/attach_iso                                         | Attach an ISO to a Server                       |
| _ServerActionsApi_       | [**attachServerToNetwork**](docs/ServerActionsApi.md#attachservertonetwork)                                 | **POST** /servers/{id}/actions/attach_to_network                                  | Attach a Server to a Network                    |
| _ServerActionsApi_       | [**changeServerAliasIps**](docs/ServerActionsApi.md#changeserveraliasips)                                   | **POST** /servers/{id}/actions/change_alias_ips                                   | Change alias IPs of a Network                   |
| _ServerActionsApi_       | [**changeServerDnsPtr**](docs/ServerActionsApi.md#changeserverdnsptr)                                       | **POST** /servers/{id}/actions/change_dns_ptr                                     | Change reverse DNS entry for this Server        |
| _ServerActionsApi_       | [**changeServerProtection**](docs/ServerActionsApi.md#changeserverprotection)                               | **POST** /servers/{id}/actions/change_protection                                  | Change Server Protection                        |
| _ServerActionsApi_       | [**changeServerType**](docs/ServerActionsApi.md#changeservertype)                                           | **POST** /servers/{id}/actions/change_type                                        | Change the Type of a Server                     |
| _ServerActionsApi_       | [**createServerImage**](docs/ServerActionsApi.md#createserverimage)                                         | **POST** /servers/{id}/actions/create_image                                       | Create Image from a Server                      |
| _ServerActionsApi_       | [**detachServerFromNetwork**](docs/ServerActionsApi.md#detachserverfromnetwork)                             | **POST** /servers/{id}/actions/detach_from_network                                | Detach a Server from a Network                  |
| _ServerActionsApi_       | [**detachServerIso**](docs/ServerActionsApi.md#detachserveriso)                                             | **POST** /servers/{id}/actions/detach_iso                                         | Detach an ISO from a Server                     |
| _ServerActionsApi_       | [**disableServerBackup**](docs/ServerActionsApi.md#disableserverbackup)                                     | **POST** /servers/{id}/actions/disable_backup                                     | Disable Backups for a Server                    |
| _ServerActionsApi_       | [**disableServerRescue**](docs/ServerActionsApi.md#disableserverrescue)                                     | **POST** /servers/{id}/actions/disable_rescue                                     | Disable Rescue Mode for a Server                |
| _ServerActionsApi_       | [**enableServerBackup**](docs/ServerActionsApi.md#enableserverbackup)                                       | **POST** /servers/{id}/actions/enable_backup                                      | Enable and Configure Backups for a Server       |
| _ServerActionsApi_       | [**enableServerRescue**](docs/ServerActionsApi.md#enableserverrescue)                                       | **POST** /servers/{id}/actions/enable_rescue                                      | Enable Rescue Mode for a Server                 |
| _ServerActionsApi_       | [**getServerAction**](docs/ServerActionsApi.md#getserveraction)                                             | **GET** /servers/{id}/actions/{action_id}                                         | Get an Action for a Server                      |
| _ServerActionsApi_       | [**getServersAction**](docs/ServerActionsApi.md#getserversaction)                                           | **GET** /servers/actions/{id}                                                     | Get an Action                                   |
| _ServerActionsApi_       | [**listServerActions**](docs/ServerActionsApi.md#listserveractions)                                         | **GET** /servers/{id}/actions                                                     | List Actions for a Server                       |
| _ServerActionsApi_       | [**listServersActions**](docs/ServerActionsApi.md#listserversactions)                                       | **GET** /servers/actions                                                          | List Actions                                    |
| _ServerActionsApi_       | [**poweroffServer**](docs/ServerActionsApi.md#poweroffserver)                                               | **POST** /servers/{id}/actions/poweroff                                           | Power off a Server                              |
| _ServerActionsApi_       | [**poweronServer**](docs/ServerActionsApi.md#poweronserver)                                                 | **POST** /servers/{id}/actions/poweron                                            | Power on a Server                               |
| _ServerActionsApi_       | [**rebootServer**](docs/ServerActionsApi.md#rebootserver)                                                   | **POST** /servers/{id}/actions/reboot                                             | Soft-reboot a Server                            |
| _ServerActionsApi_       | [**rebuildServer**](docs/ServerActionsApi.md#rebuildserver)                                                 | **POST** /servers/{id}/actions/rebuild                                            | Rebuild a Server from an Image                  |
| _ServerActionsApi_       | [**removeServerFromPlacementGroup**](docs/ServerActionsApi.md#removeserverfromplacementgroup)               | **POST** /servers/{id}/actions/remove_from_placement_group                        | Remove from Placement Group                     |
| _ServerActionsApi_       | [**requestServerConsole**](docs/ServerActionsApi.md#requestserverconsole)                                   | **POST** /servers/{id}/actions/request_console                                    | Request Console for a Server                    |
| _ServerActionsApi_       | [**resetServer**](docs/ServerActionsApi.md#resetserver)                                                     | **POST** /servers/{id}/actions/reset                                              | Reset a Server                                  |
| _ServerActionsApi_       | [**resetServerPassword**](docs/ServerActionsApi.md#resetserverpassword)                                     | **POST** /servers/{id}/actions/reset_password                                     | Reset root Password of a Server                 |
| _ServerActionsApi_       | [**shutdownServer**](docs/ServerActionsApi.md#shutdownserver)                                               | **POST** /servers/{id}/actions/shutdown                                           | Shutdown a Server                               |
| _ServerTypesApi_         | [**getServerType**](docs/ServerTypesApi.md#getservertype)                                                   | **GET** /server_types/{id}                                                        | Get a Server Type                               |
| _ServerTypesApi_         | [**listServerTypes**](docs/ServerTypesApi.md#listservertypes)                                               | **GET** /server_types                                                             | List Server Types                               |
| _ServersApi_             | [**createServer**](docs/ServersApi.md#createserver)                                                         | **POST** /servers                                                                 | Create a Server                                 |
| _ServersApi_             | [**deleteServer**](docs/ServersApi.md#deleteserver)                                                         | **DELETE** /servers/{id}                                                          | Delete a Server                                 |
| _ServersApi_             | [**getServer**](docs/ServersApi.md#getserver)                                                               | **GET** /servers/{id}                                                             | Get a Server                                    |
| _ServersApi_             | [**getServerMetrics**](docs/ServersApi.md#getservermetrics)                                                 | **GET** /servers/{id}/metrics                                                     | Get Metrics for a Server                        |
| _ServersApi_             | [**listServers**](docs/ServersApi.md#listservers)                                                           | **GET** /servers                                                                  | List Servers                                    |
| _ServersApi_             | [**updateServer**](docs/ServersApi.md#updateserver)                                                         | **PUT** /servers/{id}                                                             | Update a Server                                 |
| _VolumeActionsApi_       | [**attachVolume**](docs/VolumeActionsApi.md#attachvolume)                                                   | **POST** /volumes/{id}/actions/attach                                             | Attach Volume to a Server                       |
| _VolumeActionsApi_       | [**changeVolumeProtection**](docs/VolumeActionsApi.md#changevolumeprotection)                               | **POST** /volumes/{id}/actions/change_protection                                  | Change Volume Protection                        |
| _VolumeActionsApi_       | [**detachVolume**](docs/VolumeActionsApi.md#detachvolume)                                                   | **POST** /volumes/{id}/actions/detach                                             | Detach Volume                                   |
| _VolumeActionsApi_       | [**getVolumeAction**](docs/VolumeActionsApi.md#getvolumeaction)                                             | **GET** /volumes/{id}/actions/{action_id}                                         | Get an Action for a Volume                      |
| _VolumeActionsApi_       | [**getVolumesAction**](docs/VolumeActionsApi.md#getvolumesaction)                                           | **GET** /volumes/actions/{id}                                                     | Get an Action                                   |
| _VolumeActionsApi_       | [**listVolumeActions**](docs/VolumeActionsApi.md#listvolumeactions)                                         | **GET** /volumes/{id}/actions                                                     | List Actions for a Volume                       |
| _VolumeActionsApi_       | [**listVolumesActions**](docs/VolumeActionsApi.md#listvolumesactions)                                       | **GET** /volumes/actions                                                          | List Actions                                    |
| _VolumeActionsApi_       | [**resizeVolume**](docs/VolumeActionsApi.md#resizevolume)                                                   | **POST** /volumes/{id}/actions/resize                                             | Resize Volume                                   |
| _VolumesApi_             | [**createVolume**](docs/VolumesApi.md#createvolume)                                                         | **POST** /volumes                                                                 | Create a Volume                                 |
| _VolumesApi_             | [**deleteVolume**](docs/VolumesApi.md#deletevolume)                                                         | **DELETE** /volumes/{id}                                                          | Delete a Volume                                 |
| _VolumesApi_             | [**getVolume**](docs/VolumesApi.md#getvolume)                                                               | **GET** /volumes/{id}                                                             | Get a Volume                                    |
| _VolumesApi_             | [**listVolumes**](docs/VolumesApi.md#listvolumes)                                                           | **GET** /volumes                                                                  | List Volumes                                    |
| _VolumesApi_             | [**updateVolume**](docs/VolumesApi.md#updatevolume)                                                         | **PUT** /volumes/{id}                                                             | Update a Volume                                 |
| _ZoneActionsApi_         | [**changeZonePrimaryNameservers**](docs/ZoneActionsApi.md#changezoneprimarynameservers)                     | **POST** /zones/{id_or_name}/actions/change_primary_nameservers                   | Change a Zone\&#39;s Primary Nameservers        |
| _ZoneActionsApi_         | [**changeZoneProtection**](docs/ZoneActionsApi.md#changezoneprotection)                                     | **POST** /zones/{id_or_name}/actions/change_protection                            | Change a Zone\&#39;s Protection                 |
| _ZoneActionsApi_         | [**changeZoneTtl**](docs/ZoneActionsApi.md#changezonettl)                                                   | **POST** /zones/{id_or_name}/actions/change_ttl                                   | Change a Zone\&#39;s Default TTL                |
| _ZoneActionsApi_         | [**getZoneAction**](docs/ZoneActionsApi.md#getzoneaction)                                                   | **GET** /zones/{id_or_name}/actions/{action_id}                                   | Get an Action for a Zone                        |
| _ZoneActionsApi_         | [**getZonesAction**](docs/ZoneActionsApi.md#getzonesaction)                                                 | **GET** /zones/actions/{id}                                                       | Get an Action                                   |
| _ZoneActionsApi_         | [**importZoneZonefile**](docs/ZoneActionsApi.md#importzonezonefile)                                         | **POST** /zones/{id_or_name}/actions/import_zonefile                              | Import a Zone file                              |
| _ZoneActionsApi_         | [**listZoneActions**](docs/ZoneActionsApi.md#listzoneactions)                                               | **GET** /zones/{id_or_name}/actions                                               | List Actions for a Zone                         |
| _ZoneActionsApi_         | [**listZonesActions**](docs/ZoneActionsApi.md#listzonesactions)                                             | **GET** /zones/actions                                                            | List Actions                                    |
| _ZoneRRSetActionsApi_    | [**addZoneRrsetRecords**](docs/ZoneRRSetActionsApi.md#addzonerrsetrecords)                                  | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/add_records       | Add Records to an RRSet                         |
| _ZoneRRSetActionsApi_    | [**changeZoneRrsetProtection**](docs/ZoneRRSetActionsApi.md#changezonerrsetprotection)                      | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/change_protection | Change an RRSet\&#39;s Protection               |
| _ZoneRRSetActionsApi_    | [**changeZoneRrsetTtl**](docs/ZoneRRSetActionsApi.md#changezonerrsetttl)                                    | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/change_ttl        | Change an RRSet\&#39;s TTL                      |
| _ZoneRRSetActionsApi_    | [**removeZoneRrsetRecords**](docs/ZoneRRSetActionsApi.md#removezonerrsetrecords)                            | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/remove_records    | Remove Records from an RRSet                    |
| _ZoneRRSetActionsApi_    | [**setZoneRrsetRecords**](docs/ZoneRRSetActionsApi.md#setzonerrsetrecords)                                  | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/set_records       | Set Records of an RRSet                         |
| _ZoneRRSetActionsApi_    | [**updateZoneRrsetRecords**](docs/ZoneRRSetActionsApi.md#updatezonerrsetrecords)                            | **POST** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}/actions/update_records    | Update Records of an RRSet                      |
| _ZoneRRSetsApi_          | [**createZoneRrset**](docs/ZoneRRSetsApi.md#createzonerrset)                                                | **POST** /zones/{id_or_name}/rrsets                                               | Create an RRSet                                 |
| _ZoneRRSetsApi_          | [**deleteZoneRrset**](docs/ZoneRRSetsApi.md#deletezonerrset)                                                | **DELETE** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}                         | Delete an RRSet                                 |
| _ZoneRRSetsApi_          | [**getZoneRrset**](docs/ZoneRRSetsApi.md#getzonerrset)                                                      | **GET** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}                            | Get an RRSet                                    |
| _ZoneRRSetsApi_          | [**listZoneRrsets**](docs/ZoneRRSetsApi.md#listzonerrsets)                                                  | **GET** /zones/{id_or_name}/rrsets                                                | List RRSets                                     |
| _ZoneRRSetsApi_          | [**updateZoneRrset**](docs/ZoneRRSetsApi.md#updatezonerrset)                                                | **PUT** /zones/{id_or_name}/rrsets/{rr_name}/{rr_type}                            | Update an RRSet                                 |
| _ZonesApi_               | [**createZone**](docs/ZonesApi.md#createzone)                                                               | **POST** /zones                                                                   | Create a Zone                                   |
| _ZonesApi_               | [**deleteZone**](docs/ZonesApi.md#deletezone)                                                               | **DELETE** /zones/{id_or_name}                                                    | Delete a Zone                                   |
| _ZonesApi_               | [**getZone**](docs/ZonesApi.md#getzone)                                                                     | **GET** /zones/{id_or_name}                                                       | Get a Zone                                      |
| _ZonesApi_               | [**getZoneZonefile**](docs/ZonesApi.md#getzonezonefile)                                                     | **GET** /zones/{id_or_name}/zonefile                                              | Export a Zone file                              |
| _ZonesApi_               | [**listZones**](docs/ZonesApi.md#listzones)                                                                 | **GET** /zones                                                                    | List Zones                                      |
| _ZonesApi_               | [**updateZone**](docs/ZonesApi.md#updatezone)                                                               | **PUT** /zones/{id_or_name}                                                       | Update a Zone                                   |

### Documentation For Models

- [Action](docs/Action.md)
- [ActionError](docs/ActionError.md)
- [ActionListResponse](docs/ActionListResponse.md)
- [ActionListResponseWithMeta](docs/ActionListResponseWithMeta.md)
- [ActionNullable](docs/ActionNullable.md)
- [ActionResourcesInner](docs/ActionResourcesInner.md)
- [ActionResponse](docs/ActionResponse.md)
- [ActionResponse1](docs/ActionResponse1.md)
- [AddRouteRequest](docs/AddRouteRequest.md)
- [AddSubnetRequest](docs/AddSubnetRequest.md)
- [AddToPlacementGroupRequest](docs/AddToPlacementGroupRequest.md)
- [AddZoneRrsetRecordsRequest](docs/AddZoneRrsetRecordsRequest.md)
- [ApplyToResourcesRequest](docs/ApplyToResourcesRequest.md)
- [AttachLoadBalancerToNetworkRequest](docs/AttachLoadBalancerToNetworkRequest.md)
- [AttachServerIsoRequest](docs/AttachServerIsoRequest.md)
- [AttachToNetworkRequest](docs/AttachToNetworkRequest.md)
- [AttachVolumeRequest](docs/AttachVolumeRequest.md)
- [Certificate](docs/Certificate.md)
- [CertificateResponse](docs/CertificateResponse.md)
- [CertificateStatus](docs/CertificateStatus.md)
- [CertificateStatusError](docs/CertificateStatusError.md)
- [CertificateUsedByInner](docs/CertificateUsedByInner.md)
- [CertificatesResponse](docs/CertificatesResponse.md)
- [ChangeIPRangeRequest](docs/ChangeIPRangeRequest.md)
- [ChangeImageProtectionRequest](docs/ChangeImageProtectionRequest.md)
- [ChangeLoadBalancerAlgorithmRequest](docs/ChangeLoadBalancerAlgorithmRequest.md)
- [ChangeLoadBalancerProtectionRequest](docs/ChangeLoadBalancerProtectionRequest.md)
- [ChangeLoadbalancerDnsPtrRequest](docs/ChangeLoadbalancerDnsPtrRequest.md)
- [ChangeProtectionRequest](docs/ChangeProtectionRequest.md)
- [ChangeServerAliasIpsRequest](docs/ChangeServerAliasIpsRequest.md)
- [ChangeServerDnsPtrRequest](docs/ChangeServerDnsPtrRequest.md)
- [ChangeServerProtectionRequest](docs/ChangeServerProtectionRequest.md)
- [ChangeServerTypeRequest](docs/ChangeServerTypeRequest.md)
- [ChangeTypeRequest](docs/ChangeTypeRequest.md)
- [ChangeVolumeProtectionRequest](docs/ChangeVolumeProtectionRequest.md)
- [ChangeZonePrimaryNameserversRequest](docs/ChangeZonePrimaryNameserversRequest.md)
- [ChangeZoneProtectionRequest](docs/ChangeZoneProtectionRequest.md)
- [ChangeZoneRrsetTtlRequest](docs/ChangeZoneRrsetTtlRequest.md)
- [ChangeZoneTtlRequest](docs/ChangeZoneTtlRequest.md)
- [CreateCertificateRequest](docs/CreateCertificateRequest.md)
- [CreateCertificateResponse](docs/CreateCertificateResponse.md)
- [CreateFirewallRequest](docs/CreateFirewallRequest.md)
- [CreateFirewallResponse](docs/CreateFirewallResponse.md)
- [CreateFloatingIp201Response](docs/CreateFloatingIp201Response.md)
- [CreateImageRequest](docs/CreateImageRequest.md)
- [CreateLoadBalancer201Response](docs/CreateLoadBalancer201Response.md)
- [CreateLoadBalancerRequest](docs/CreateLoadBalancerRequest.md)
- [CreateNetwork201Response](docs/CreateNetwork201Response.md)
- [CreatePlacementGroupRequest](docs/CreatePlacementGroupRequest.md)
- [CreatePlacementGroupResponse](docs/CreatePlacementGroupResponse.md)
- [CreatePrimaryIPResponse](docs/CreatePrimaryIPResponse.md)
- [CreateServerImage201Response](docs/CreateServerImage201Response.md)
- [CreateServerRequest](docs/CreateServerRequest.md)
- [CreateServerRequestFirewallsInner](docs/CreateServerRequestFirewallsInner.md)
- [CreateServerRequestPublicNet](docs/CreateServerRequestPublicNet.md)
- [CreateServerResponse](docs/CreateServerResponse.md)
- [CreateSshKey201Response](docs/CreateSshKey201Response.md)
- [CreateSshKeyRequest](docs/CreateSshKeyRequest.md)
- [CreateVolume201Response](docs/CreateVolume201Response.md)
- [CreateVolumeRequest](docs/CreateVolumeRequest.md)
- [CreateZone201Response](docs/CreateZone201Response.md)
- [CreateZoneRequest](docs/CreateZoneRequest.md)
- [CreateZoneRequestRrsetsInner](docs/CreateZoneRequestRrsetsInner.md)
- [CreateZoneRrset201Response](docs/CreateZoneRrset201Response.md)
- [DeleteLoadBalancerServiceRequest](docs/DeleteLoadBalancerServiceRequest.md)
- [DeleteRouteRequest](docs/DeleteRouteRequest.md)
- [DeleteServer200Response](docs/DeleteServer200Response.md)
- [DeleteSubnetRequest](docs/DeleteSubnetRequest.md)
- [DeprecationInfo](docs/DeprecationInfo.md)
- [DeprecationInfo1](docs/DeprecationInfo1.md)
- [DetachFromNetworkRequest](docs/DetachFromNetworkRequest.md)
- [DetachLoadBalancerFromNetworkRequest](docs/DetachLoadBalancerFromNetworkRequest.md)
- [EnableServerRescue201Response](docs/EnableServerRescue201Response.md)
- [EnableServerRescueRequest](docs/EnableServerRescueRequest.md)
- [FirewallResource](docs/FirewallResource.md)
- [FirewallResourceServer](docs/FirewallResourceServer.md)
- [FirewallResponse](docs/FirewallResponse.md)
- [FirewallResponse1](docs/FirewallResponse1.md)
- [FirewallResponseAppliedToInner](docs/FirewallResponseAppliedToInner.md)
- [FirewallResponseAppliedToInnerAppliedToResourcesInner](docs/FirewallResponseAppliedToInnerAppliedToResourcesInner.md)
- [FirewallResponseAppliedToInnerLabelSelector](docs/FirewallResponseAppliedToInnerLabelSelector.md)
- [FirewallResponseAppliedToInnerServer](docs/FirewallResponseAppliedToInnerServer.md)
- [FirewallsResponse](docs/FirewallsResponse.md)
- [FloatingIPActionsAssignRequest](docs/FloatingIPActionsAssignRequest.md)
- [FloatingIPCreateRequest](docs/FloatingIPCreateRequest.md)
- [FloatingIPUpdateRequest](docs/FloatingIPUpdateRequest.md)
- [GetActions4xxResponse](docs/GetActions4xxResponse.md)
- [GetActions4xxResponseError](docs/GetActions4xxResponseError.md)
- [GetActions5xxResponse](docs/GetActions5xxResponse.md)
- [GetDatacenter200Response](docs/GetDatacenter200Response.md)
- [GetFloatingIp200Response](docs/GetFloatingIp200Response.md)
- [GetImage200Response](docs/GetImage200Response.md)
- [GetIso200Response](docs/GetIso200Response.md)
- [GetLoadBalancer200Response](docs/GetLoadBalancer200Response.md)
- [GetLoadBalancerMetrics200Response](docs/GetLoadBalancerMetrics200Response.md)
- [GetLoadBalancerMetrics200ResponseMetrics](docs/GetLoadBalancerMetrics200ResponseMetrics.md)
- [GetLoadBalancerMetrics200ResponseMetricsTimeSeriesValue](docs/GetLoadBalancerMetrics200ResponseMetricsTimeSeriesValue.md)
- [GetLoadBalancerMetrics200ResponseMetricsTimeSeriesValueValuesInnerInner](docs/GetLoadBalancerMetrics200ResponseMetricsTimeSeriesValueValuesInnerInner.md)
- [GetLoadBalancerType200Response](docs/GetLoadBalancerType200Response.md)
- [GetLocation200Response](docs/GetLocation200Response.md)
- [GetPricing200Response](docs/GetPricing200Response.md)
- [GetPricing200ResponsePricing](docs/GetPricing200ResponsePricing.md)
- [GetPricing200ResponsePricingFloatingIp](docs/GetPricing200ResponsePricingFloatingIp.md)
- [GetPricing200ResponsePricingFloatingIpPriceMonthly](docs/GetPricing200ResponsePricingFloatingIpPriceMonthly.md)
- [GetPricing200ResponsePricingFloatingIpsInner](docs/GetPricing200ResponsePricingFloatingIpsInner.md)
- [GetPricing200ResponsePricingFloatingIpsInnerPricesInner](docs/GetPricing200ResponsePricingFloatingIpsInnerPricesInner.md)
- [GetPricing200ResponsePricingImage](docs/GetPricing200ResponsePricingImage.md)
- [GetPricing200ResponsePricingImagePricePerGbMonth](docs/GetPricing200ResponsePricingImagePricePerGbMonth.md)
- [GetPricing200ResponsePricingLoadBalancerTypesInner](docs/GetPricing200ResponsePricingLoadBalancerTypesInner.md)
- [GetPricing200ResponsePricingPrimaryIpsInner](docs/GetPricing200ResponsePricingPrimaryIpsInner.md)
- [GetPricing200ResponsePricingPrimaryIpsInnerPricesInner](docs/GetPricing200ResponsePricingPrimaryIpsInnerPricesInner.md)
- [GetPricing200ResponsePricingServerBackup](docs/GetPricing200ResponsePricingServerBackup.md)
- [GetPricing200ResponsePricingServerTypesInner](docs/GetPricing200ResponsePricingServerTypesInner.md)
- [GetPricing200ResponsePricingVolume](docs/GetPricing200ResponsePricingVolume.md)
- [GetPricing200ResponsePricingVolumePricePerGbMonth](docs/GetPricing200ResponsePricingVolumePricePerGbMonth.md)
- [GetServer200Response](docs/GetServer200Response.md)
- [GetServerType200Response](docs/GetServerType200Response.md)
- [GetVolume200Response](docs/GetVolume200Response.md)
- [GetZone200Response](docs/GetZone200Response.md)
- [GetZoneRrset200Response](docs/GetZoneRrset200Response.md)
- [GetZoneZonefile200Response](docs/GetZoneZonefile200Response.md)
- [ImportZoneZonefileRequest](docs/ImportZoneZonefileRequest.md)
- [ListDatacenters200Response](docs/ListDatacenters200Response.md)
- [ListDatacenters200ResponseDatacentersInner](docs/ListDatacenters200ResponseDatacentersInner.md)
- [ListDatacenters200ResponseDatacentersInnerLocation](docs/ListDatacenters200ResponseDatacentersInnerLocation.md)
- [ListDatacenters200ResponseDatacentersInnerServerTypes](docs/ListDatacenters200ResponseDatacentersInnerServerTypes.md)
- [ListFloatingIpActions200Response](docs/ListFloatingIpActions200Response.md)
- [ListFloatingIps200Response](docs/ListFloatingIps200Response.md)
- [ListFloatingIps200ResponseFloatingIpsInner](docs/ListFloatingIps200ResponseFloatingIpsInner.md)
- [ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner](docs/ListFloatingIps200ResponseFloatingIpsInnerDnsPtrInner.md)
- [ListFloatingIps200ResponseFloatingIpsInnerHomeLocation](docs/ListFloatingIps200ResponseFloatingIpsInnerHomeLocation.md)
- [ListFloatingIps200ResponseFloatingIpsInnerProtection](docs/ListFloatingIps200ResponseFloatingIpsInnerProtection.md)
- [ListImages200Response](docs/ListImages200Response.md)
- [ListImages200ResponseImagesInner](docs/ListImages200ResponseImagesInner.md)
- [ListImages200ResponseImagesInnerCreatedFrom](docs/ListImages200ResponseImagesInnerCreatedFrom.md)
- [ListIsos200Response](docs/ListIsos200Response.md)
- [ListIsos200ResponseIsosInner](docs/ListIsos200ResponseIsosInner.md)
- [ListLoadBalancerTypes200Response](docs/ListLoadBalancerTypes200Response.md)
- [ListLoadBalancerTypes200ResponseLoadBalancerTypesInner](docs/ListLoadBalancerTypes200ResponseLoadBalancerTypesInner.md)
- [ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner](docs/ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInner.md)
- [ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceHourly](docs/ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceHourly.md)
- [ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceMonthly](docs/ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPriceMonthly.md)
- [ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPricePerTbTraffic](docs/ListLoadBalancerTypes200ResponseLoadBalancerTypesInnerPricesInnerPricePerTbTraffic.md)
- [ListLoadBalancers200Response](docs/ListLoadBalancers200Response.md)
- [ListLoadBalancers200ResponseLoadBalancersInner](docs/ListLoadBalancers200ResponseLoadBalancersInner.md)
- [ListLoadBalancers200ResponseLoadBalancersInnerAlgorithm](docs/ListLoadBalancers200ResponseLoadBalancersInnerAlgorithm.md)
- [ListLoadBalancers200ResponseLoadBalancersInnerPrivateNetInner](docs/ListLoadBalancers200ResponseLoadBalancersInnerPrivateNetInner.md)
- [ListLoadBalancers200ResponseLoadBalancersInnerPublicNet](docs/ListLoadBalancers200ResponseLoadBalancersInnerPublicNet.md)
- [ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv4](docs/ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv4.md)
- [ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv6](docs/ListLoadBalancers200ResponseLoadBalancersInnerPublicNetIpv6.md)
- [ListLocations200Response](docs/ListLocations200Response.md)
- [ListMeta](docs/ListMeta.md)
- [ListMetaPagination](docs/ListMetaPagination.md)
- [ListNetworks200Response](docs/ListNetworks200Response.md)
- [ListNetworks200ResponseNetworksInner](docs/ListNetworks200ResponseNetworksInner.md)
- [ListNetworks200ResponseNetworksInnerRoutesInner](docs/ListNetworks200ResponseNetworksInnerRoutesInner.md)
- [ListNetworks200ResponseNetworksInnerSubnetsInner](docs/ListNetworks200ResponseNetworksInnerSubnetsInner.md)
- [ListServerTypes200Response](docs/ListServerTypes200Response.md)
- [ListServerTypes200ResponseServerTypesInner](docs/ListServerTypes200ResponseServerTypesInner.md)
- [ListServerTypes200ResponseServerTypesInnerLocationsInner](docs/ListServerTypes200ResponseServerTypesInnerLocationsInner.md)
- [ListServers200Response](docs/ListServers200Response.md)
- [ListServers200ResponseServersInner](docs/ListServers200ResponseServersInner.md)
- [ListServers200ResponseServersInnerDatacenter](docs/ListServers200ResponseServersInnerDatacenter.md)
- [ListServers200ResponseServersInnerImage](docs/ListServers200ResponseServersInnerImage.md)
- [ListServers200ResponseServersInnerIso](docs/ListServers200ResponseServersInnerIso.md)
- [ListServers200ResponseServersInnerLocation](docs/ListServers200ResponseServersInnerLocation.md)
- [ListServers200ResponseServersInnerPrivateNetInner](docs/ListServers200ResponseServersInnerPrivateNetInner.md)
- [ListServers200ResponseServersInnerProtection](docs/ListServers200ResponseServersInnerProtection.md)
- [ListServers200ResponseServersInnerPublicNet](docs/ListServers200ResponseServersInnerPublicNet.md)
- [ListServers200ResponseServersInnerPublicNetIpv4](docs/ListServers200ResponseServersInnerPublicNetIpv4.md)
- [ListServers200ResponseServersInnerPublicNetIpv6](docs/ListServers200ResponseServersInnerPublicNetIpv6.md)
- [ListServers200ResponseServersInnerPublicNetIpv6DnsPtrInner](docs/ListServers200ResponseServersInnerPublicNetIpv6DnsPtrInner.md)
- [ListSshKeys200Response](docs/ListSshKeys200Response.md)
- [ListSshKeys200ResponseSshKeysInner](docs/ListSshKeys200ResponseSshKeysInner.md)
- [ListVolumes200Response](docs/ListVolumes200Response.md)
- [ListVolumes200ResponseVolumesInner](docs/ListVolumes200ResponseVolumesInner.md)
- [ListVolumes200ResponseVolumesInnerLocation](docs/ListVolumes200ResponseVolumesInnerLocation.md)
- [ListZoneRrsets200Response](docs/ListZoneRrsets200Response.md)
- [ListZones200Response](docs/ListZones200Response.md)
- [LoadBalancerAlgorithm](docs/LoadBalancerAlgorithm.md)
- [LoadBalancerService](docs/LoadBalancerService.md)
- [LoadBalancerServiceHTTP](docs/LoadBalancerServiceHTTP.md)
- [LoadBalancerServiceHTTP1](docs/LoadBalancerServiceHTTP1.md)
- [LoadBalancerServiceHealthCheck](docs/LoadBalancerServiceHealthCheck.md)
- [LoadBalancerServiceHealthCheckHttp](docs/LoadBalancerServiceHealthCheckHttp.md)
- [LoadBalancerTarget](docs/LoadBalancerTarget.md)
- [LoadBalancerTarget1](docs/LoadBalancerTarget1.md)
- [LoadBalancerTargetHealthStatusInner](docs/LoadBalancerTargetHealthStatusInner.md)
- [LoadBalancerTargetIP](docs/LoadBalancerTargetIP.md)
- [LoadBalancerTargetIP1](docs/LoadBalancerTargetIP1.md)
- [LoadBalancerTargetLabelSelector](docs/LoadBalancerTargetLabelSelector.md)
- [LoadBalancerTargetLabelSelector1](docs/LoadBalancerTargetLabelSelector1.md)
- [LoadBalancerTargetServer](docs/LoadBalancerTargetServer.md)
- [LoadBalancerTargetServer1](docs/LoadBalancerTargetServer1.md)
- [LoadBalancerTargetTarget](docs/LoadBalancerTargetTarget.md)
- [ModelRecord](docs/ModelRecord.md)
- [NetworkCreateRequest](docs/NetworkCreateRequest.md)
- [NetworkCreateRequestSubnetsInner](docs/NetworkCreateRequestSubnetsInner.md)
- [NetworkUpdateRequest](docs/NetworkUpdateRequest.md)
- [PlacementGroup](docs/PlacementGroup.md)
- [PlacementGroupNullable](docs/PlacementGroupNullable.md)
- [PlacementGroupResponse](docs/PlacementGroupResponse.md)
- [PlacementGroupsResponse](docs/PlacementGroupsResponse.md)
- [PrimaryIP](docs/PrimaryIP.md)
- [PrimaryIPActionsAssignRequest](docs/PrimaryIPActionsAssignRequest.md)
- [PrimaryIPCreateRequest](docs/PrimaryIPCreateRequest.md)
- [PrimaryIPDatacenter](docs/PrimaryIPDatacenter.md)
- [PrimaryIPLocation](docs/PrimaryIPLocation.md)
- [PrimaryIPResponse](docs/PrimaryIPResponse.md)
- [PrimaryIPUpdateRequest](docs/PrimaryIPUpdateRequest.md)
- [PrimaryIPsResponse](docs/PrimaryIPsResponse.md)
- [PrimaryZone](docs/PrimaryZone.md)
- [PrimaryZoneAllOfAuthoritativeNameservers](docs/PrimaryZoneAllOfAuthoritativeNameservers.md)
- [PrimaryZoneAllOfPrimaryNameserversInner](docs/PrimaryZoneAllOfPrimaryNameserversInner.md)
- [RRSet](docs/RRSet.md)
- [RRSetProtection](docs/RRSetProtection.md)
- [RebuildServer201Response](docs/RebuildServer201Response.md)
- [RebuildServerRequest](docs/RebuildServerRequest.md)
- [Record1](docs/Record1.md)
- [RemoveFromResourcesRequest](docs/RemoveFromResourcesRequest.md)
- [RemoveTargetRequest](docs/RemoveTargetRequest.md)
- [RemoveTargetRequestLabelSelector](docs/RemoveTargetRequestLabelSelector.md)
- [RemoveTargetRequestServer](docs/RemoveTargetRequestServer.md)
- [RemoveZoneRrsetRecordsRequest](docs/RemoveZoneRrsetRecordsRequest.md)
- [RequestServerConsole201Response](docs/RequestServerConsole201Response.md)
- [ResetServerPassword201Response](docs/ResetServerPassword201Response.md)
- [ResizeVolumeRequest](docs/ResizeVolumeRequest.md)
- [Rule](docs/Rule.md)
- [RuleResponse](docs/RuleResponse.md)
- [SecondaryZone](docs/SecondaryZone.md)
- [ServerPublicNetFirewall](docs/ServerPublicNetFirewall.md)
- [SetRulesRequest](docs/SetRulesRequest.md)
- [SetZoneRrsetRecordsRequest](docs/SetZoneRrsetRecordsRequest.md)
- [UpdateCertificateRequest](docs/UpdateCertificateRequest.md)
- [UpdateFirewallRequest](docs/UpdateFirewallRequest.md)
- [UpdateImageRequest](docs/UpdateImageRequest.md)
- [UpdateLoadBalancerRequest](docs/UpdateLoadBalancerRequest.md)
- [UpdateLoadBalancerService](docs/UpdateLoadBalancerService.md)
- [UpdateLoadBalancerServiceHealthCheck](docs/UpdateLoadBalancerServiceHealthCheck.md)
- [UpdateLoadBalancerServiceHealthCheckHttp](docs/UpdateLoadBalancerServiceHealthCheckHttp.md)
- [UpdatePlacementGroupRequest](docs/UpdatePlacementGroupRequest.md)
- [UpdateServerRequest](docs/UpdateServerRequest.md)
- [UpdateSshKeyRequest](docs/UpdateSshKeyRequest.md)
- [UpdateVolumeRequest](docs/UpdateVolumeRequest.md)
- [UpdateZoneRrsetRecordsRequest](docs/UpdateZoneRrsetRecordsRequest.md)
- [UpdateZoneRrsetRequest](docs/UpdateZoneRrsetRequest.md)
- [Zone](docs/Zone.md)
- [ZonePrimary](docs/ZonePrimary.md)
- [ZoneSecondary](docs/ZoneSecondary.md)
- [ZoneUpdateRequest](docs/ZoneUpdateRequest.md)

<a id="documentation-for-authorization"></a>

## Documentation For Authorization

Authentication schemes defined for the API:
<a id="APIToken"></a>

### APIToken

- **Type**: Bearer authentication
