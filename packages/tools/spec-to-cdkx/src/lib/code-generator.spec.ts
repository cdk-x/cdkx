import * as path from 'path';
import { SchemaReader } from './schema-reader.js';
import { CodeGenerator } from './code-generator.js';

const FIXTURES_DIR = path.join(__dirname, '../../test/fixtures/schemas');

describe('CodeGenerator', () => {
  let source: string;

  beforeAll(() => {
    const resources = SchemaReader.read(FIXTURES_DIR);
    source = CodeGenerator.generate(resources, {
      prefix: 'Tst',
      providerName: 'Test',
      resourceTypeConst: 'TestResourceType',
    });
  });

  describe('header', () => {
    it('emits the auto-generated header comment', () => {
      expect(source).toContain('AUTO-GENERATED — DO NOT EDIT');
    });
  });

  describe('imports', () => {
    it('imports ProviderResource, IResolvable, PropertyValue from @cdk-x/core', () => {
      expect(source).toContain(
        "import { ProviderResource, IResolvable, PropertyValue } from '@cdk-x/core';",
      );
    });

    it('imports Construct from constructs', () => {
      expect(source).toContain("import { Construct } from 'constructs';");
    });
  });

  describe('ResourceType constant', () => {
    it('emits the ResourceType const with the given name', () => {
      expect(source).toContain('export const TestResourceType = {');
    });

    it('includes domain groups', () => {
      expect(source).toContain('Networking:');
      expect(source).toContain('Compute:');
    });

    it('includes resource type strings', () => {
      expect(source).toContain("Network: 'Test::Networking::Network'");
      expect(source).toContain("Server: 'Test::Compute::Server'");
    });
  });

  describe('nested interfaces', () => {
    it('emits the ServerPublicNet interface', () => {
      expect(source).toContain('export interface ServerPublicNet {');
    });

    it('emits properties in the nested interface', () => {
      expect(source).toContain('enableIpv4?: boolean;');
      expect(source).toContain('enableIpv6?: boolean;');
    });
  });

  describe('shared (common) definitions', () => {
    it('emits a Common section before the domain sections', () => {
      // Common section should appear before Networking and Compute sections
      const commonIdx = source.indexOf('// Common');
      const networkingIdx = source.indexOf('// Networking');
      expect(commonIdx).toBeGreaterThan(-1);
      expect(commonIdx).toBeLessThan(networkingIdx);
    });

    it('emits NetworkZone as a named enum in the Common section', () => {
      expect(source).toContain('export enum NetworkZone {');
    });

    it('emits NetworkZone enum members', () => {
      expect(source).toContain("EU_CENTRAL = 'eu-central'");
      expect(source).toContain("US_EAST = 'us-east'");
    });

    it('does NOT inline NetworkZone as a literal union in the TestServer props interface', () => {
      // networkZone should reference the named enum, not an inline literal union
      const serverInterfaceMatch = source.match(
        /export interface TestServer \{([^}]+)\}/s,
      );
      expect(serverInterfaceMatch?.[1]).not.toContain("'eu-central'");
      expect(serverInterfaceMatch?.[1]).toContain('networkZone?: NetworkZone');
    });

    it('emits NetworkZone only once (not duplicated per resource)', () => {
      const occurrences = (source.match(/export enum NetworkZone/g) ?? [])
        .length;
      expect(occurrences).toBe(1);
    });
  });

  describe('enums', () => {
    it('emits the NetworkSubnetType enum', () => {
      expect(source).toContain('export enum NetworkSubnetType {');
    });

    it('emits enum members with SCREAMING_SNAKE names', () => {
      expect(source).toContain("CLOUD = 'cloud'");
      expect(source).toContain("SERVER = 'server'");
      expect(source).toContain("VSWITCH = 'vswitch'");
    });
  });

  describe('props interfaces', () => {
    it('emits the TestNetwork props interface', () => {
      expect(source).toContain('export interface TestNetwork {');
    });

    it('emits the TestServer props interface', () => {
      expect(source).toContain('export interface TestServer {');
    });

    it('does not emit readOnlyProperties in the props interface', () => {
      // networkId is readOnly — should not appear as a prop
      const networkInterfaceMatch = source.match(
        /export interface TestNetwork \{([^}]+)\}/s,
      );
      expect(networkInterfaceMatch?.[1]).not.toContain('networkId');
    });
  });

  describe('L1 classes', () => {
    it('emits the TstNetwork class', () => {
      expect(source).toContain(
        'export class TstNetwork extends ProviderResource {',
      );
    });

    it('emits the TstServer class', () => {
      expect(source).toContain(
        'export class TstServer extends ProviderResource {',
      );
    });

    it('emits RESOURCE_TYPE_NAME static member', () => {
      expect(source).toContain(
        "public static readonly RESOURCE_TYPE_NAME = 'Test::Networking::Network';",
      );
    });

    it('emits attr* members for readOnlyProperties', () => {
      expect(source).toContain('public readonly attrNetworkId: IResolvable;');
      expect(source).toContain('public readonly attrServerId: IResolvable;');
    });

    it('initialises attr* members in constructor', () => {
      expect(source).toContain(
        "this.attrNetworkId = this.getAtt('networkId');",
      );
      expect(source).toContain("this.attrServerId = this.getAtt('serverId');");
    });

    it('sets this.node.defaultChild = this in the constructor', () => {
      expect(source).toContain('this.node.defaultChild = this;');
    });

    it('emits public mutable members for writable props', () => {
      // name and ipRange are required in network.schema.json
      expect(source).toContain('public name: string;');
      expect(source).toContain('public ipRange: string;');
      // exposeRoutesToVswitch and labels are optional
      expect(source).toContain('public exposeRoutesToVswitch?: boolean;');
      expect(source).toContain('public labels?: Record<string, string>;');
    });

    it('assigns props to mutable members in the constructor', () => {
      expect(source).toContain('this.name = props.name;');
      expect(source).toContain('this.ipRange = props.ipRange;');
    });

    it('omits the = {} default when schema has required fields', () => {
      // network.schema.json has required: ["name", "ipRange"]
      expect(source).toContain(
        'constructor(scope: Construct, id: string, props: TestNetwork)',
      );
      // Should NOT have the = {} default for TstNetwork
      expect(source).not.toContain(
        'constructor(scope: Construct, id: string, props: TestNetwork = {})',
      );
    });

    it('emits super() call without properties', () => {
      // The super call must NOT pass properties — they are collected via renderProperties()
      expect(source).toContain('super(scope, id, {');
      expect(source).toContain('type: TstNetwork.RESOURCE_TYPE_NAME,');
      expect(source).not.toContain(
        'properties: props as unknown as Record<string, PropertyValue>,',
      );
    });

    it('emits renderProperties() override', () => {
      expect(source).toContain(
        'protected override renderProperties(): Record<string, PropertyValue> {',
      );
    });

    it('renderProperties() returns members as unknown cast', () => {
      expect(source).toContain(
        '} as unknown as Record<string, PropertyValue>;',
      );
    });

    it('renderProperties() includes all writable props', () => {
      expect(source).toContain('name: this.name,');
      expect(source).toContain('ipRange: this.ipRange,');
    });
  });
});
