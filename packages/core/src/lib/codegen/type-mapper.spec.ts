import { TypeMapper } from './type-mapper.js';
import type { OpenAPISchema } from './types.js';

describe('TypeMapper', () => {
  // -------------------------------------------------------------------------
  // toCamelCase
  // -------------------------------------------------------------------------
  describe('toCamelCase', () => {
    it('converts snake_case to camelCase', () => {
      expect(TypeMapper.toCamelCase('ip_range')).toBe('ipRange');
      expect(TypeMapper.toCamelCase('expose_routes_to_vswitch')).toBe(
        'exposeRoutesToVswitch',
      );
      expect(TypeMapper.toCamelCase('network_zone')).toBe('networkZone');
    });

    it('leaves already-camelCase strings unchanged', () => {
      expect(TypeMapper.toCamelCase('name')).toBe('name');
      expect(TypeMapper.toCamelCase('ipRange')).toBe('ipRange');
    });
  });

  // -------------------------------------------------------------------------
  // toPascalCase
  // -------------------------------------------------------------------------
  describe('toPascalCase', () => {
    it('converts snake_case to PascalCase', () => {
      expect(TypeMapper.toPascalCase('network_zone')).toBe('NetworkZone');
      expect(TypeMapper.toPascalCase('server')).toBe('Server');
    });

    it('converts camelCase to PascalCase', () => {
      expect(TypeMapper.toPascalCase('ipRange')).toBe('IpRange');
    });
  });

  // -------------------------------------------------------------------------
  // toScreamingSnake
  // -------------------------------------------------------------------------
  describe('toScreamingSnake', () => {
    it('converts lowercase values', () => {
      expect(TypeMapper.toScreamingSnake('uploaded')).toBe('UPLOADED');
      expect(TypeMapper.toScreamingSnake('managed')).toBe('MANAGED');
    });

    it('converts hyphenated values', () => {
      expect(TypeMapper.toScreamingSnake('eu-central')).toBe('EU_CENTRAL');
      expect(TypeMapper.toScreamingSnake('us-east')).toBe('US_EAST');
    });

    it('converts short values', () => {
      expect(TypeMapper.toScreamingSnake('ipv4')).toBe('IPV4');
      expect(TypeMapper.toScreamingSnake('in')).toBe('IN');
    });
  });

  // -------------------------------------------------------------------------
  // toEnumName
  // -------------------------------------------------------------------------
  describe('toEnumName', () => {
    it('prefixes generic prop names with the resource name', () => {
      expect(TypeMapper.toEnumName('type', 'Certificate')).toBe(
        'CertificateType',
      );
      expect(TypeMapper.toEnumName('type', 'PrimaryIp')).toBe('PrimaryIpType');
      expect(TypeMapper.toEnumName('mode', 'PrimaryIp')).toBe('PrimaryIpMode');
    });

    it('returns standalone name for well-known standalone enums', () => {
      expect(TypeMapper.toEnumName('network_zone', 'Subnet')).toBe(
        'NetworkZone',
      );
    });

    it('produces composite name for descriptive props', () => {
      expect(TypeMapper.toEnumName('direction', 'Firewall')).toBe(
        'FirewallDirection',
      );
      expect(TypeMapper.toEnumName('protocol', 'Firewall')).toBe(
        'FirewallProtocol',
      );
    });
  });

  // -------------------------------------------------------------------------
  // toNestedInterfaceName
  // -------------------------------------------------------------------------
  describe('toNestedInterfaceName', () => {
    it('singularises plural prop names', () => {
      expect(TypeMapper.toNestedInterfaceName('rules', 'Firewall')).toBe(
        'FirewallRule',
      );
    });

    it('uses compound names for multi-word props', () => {
      expect(TypeMapper.toNestedInterfaceName('public_net', 'Server')).toBe(
        'ServerPublicNet',
      );
    });
  });

  // -------------------------------------------------------------------------
  // isCrossRef
  // -------------------------------------------------------------------------
  describe('isCrossRef', () => {
    it('returns true for props ending in _id', () => {
      expect(TypeMapper.isCrossRef('network_id')).toBe(true);
      expect(TypeMapper.isCrossRef('vswitch_id')).toBe(true);
      expect(TypeMapper.isCrossRef('server_id')).toBe(true);
    });

    it('returns true for props ending in Id (camelCase)', () => {
      expect(TypeMapper.isCrossRef('networkId')).toBe(true);
      expect(TypeMapper.isCrossRef('placementGroupId')).toBe(true);
    });

    it('returns false for the bare id field', () => {
      expect(TypeMapper.isCrossRef('id')).toBe(false);
    });

    it('returns false for non-id props', () => {
      expect(TypeMapper.isCrossRef('name')).toBe(false);
      expect(TypeMapper.isCrossRef('ip_range')).toBe(false);
      expect(TypeMapper.isCrossRef('labels')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // isIdArrayProp
  // -------------------------------------------------------------------------
  describe('isIdArrayProp', () => {
    it('returns true for known ID array props', () => {
      expect(TypeMapper.isIdArrayProp('ssh_keys')).toBe(true);
      expect(TypeMapper.isIdArrayProp('networks')).toBe(true);
      expect(TypeMapper.isIdArrayProp('volumes')).toBe(true);
      expect(TypeMapper.isIdArrayProp('firewalls')).toBe(true);
    });

    it('returns false for non-ID array props', () => {
      expect(TypeMapper.isIdArrayProp('domain_names')).toBe(false);
      expect(TypeMapper.isIdArrayProp('rules')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // map — primitives
  // -------------------------------------------------------------------------
  describe('map — primitives', () => {
    const ctx = { propName: 'name', resourceName: 'Network' };

    it('maps string', () => {
      const schema: OpenAPISchema = { type: 'string' };
      expect(TypeMapper.map(schema, ctx)).toBe('string');
    });

    it('maps integer to number', () => {
      const schema: OpenAPISchema = { type: 'integer', format: 'int64' };
      expect(TypeMapper.map(schema, { ...ctx, propName: 'count' })).toBe(
        'number',
      );
    });

    it('maps boolean', () => {
      const schema: OpenAPISchema = { type: 'boolean' };
      expect(TypeMapper.map(schema, ctx)).toBe('boolean');
    });

    it('maps nullable string to string | null', () => {
      const schema: OpenAPISchema = { type: 'string', nullable: true };
      expect(TypeMapper.map(schema, ctx)).toBe('string | null');
    });
  });

  // -------------------------------------------------------------------------
  // map — cross-references
  // -------------------------------------------------------------------------
  describe('map — cross-references', () => {
    it('maps _id props to string | number | IResolvable', () => {
      const schema: OpenAPISchema = { type: 'integer', format: 'int64' };
      expect(
        TypeMapper.map(schema, {
          propName: 'network_id',
          resourceName: 'Subnet',
        }),
      ).toBe('string | number | IResolvable');
    });

    it('maps camelCase Id props to string | number | IResolvable', () => {
      const schema: OpenAPISchema = { type: 'integer', format: 'int64' };
      expect(
        TypeMapper.map(schema, {
          propName: 'placementGroupId',
          resourceName: 'Server',
        }),
      ).toBe('string | number | IResolvable');
    });
  });

  // -------------------------------------------------------------------------
  // map — enums
  // -------------------------------------------------------------------------
  describe('map — enums', () => {
    it('maps inline enum to derived enum name', () => {
      const schema: OpenAPISchema = {
        type: 'string',
        enum: ['uploaded', 'managed'],
      };
      expect(
        TypeMapper.map(schema, {
          propName: 'type',
          resourceName: 'Certificate',
        }),
      ).toBe('CertificateType');
    });
  });

  // -------------------------------------------------------------------------
  // map — arrays
  // -------------------------------------------------------------------------
  describe('map — arrays', () => {
    it('maps string array', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: { type: 'string' },
      };
      expect(
        TypeMapper.map(schema, {
          propName: 'domain_names',
          resourceName: 'Certificate',
        }),
      ).toBe('string[]');
    });

    it('maps known ID array props to Array<number | IResolvable>', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: { type: 'integer', format: 'int64' },
      };
      expect(
        TypeMapper.map(schema, {
          propName: 'ssh_keys',
          resourceName: 'Server',
        }),
      ).toBe('Array<number | IResolvable>');
    });

    it('maps array of objects to named interface array', () => {
      const schema: OpenAPISchema = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            direction: { type: 'string', enum: ['in', 'out'] },
            protocol: { type: 'string', enum: ['tcp', 'udp'] },
          },
        },
      };
      expect(
        TypeMapper.map(schema, { propName: 'rules', resourceName: 'Firewall' }),
      ).toBe('FirewallRule[]');
    });
  });

  // -------------------------------------------------------------------------
  // map — objects
  // -------------------------------------------------------------------------
  describe('map — objects', () => {
    it('maps Record<string, string> for additionalProperties string', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        additionalProperties: { type: 'string' },
      };
      expect(
        TypeMapper.map(schema, { propName: 'labels', resourceName: 'Network' }),
      ).toBe('Record<string, string>');
    });

    it('maps Record<string, unknown> for non-string additionalProperties', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        additionalProperties: { type: 'object' },
      };
      expect(
        TypeMapper.map(schema, { propName: 'data', resourceName: 'Network' }),
      ).toBe('Record<string, unknown>');
    });

    it('maps inline object with properties to nested interface name', () => {
      const schema: OpenAPISchema = {
        type: 'object',
        properties: {
          enable_ipv4: { type: 'boolean' },
          enable_ipv6: { type: 'boolean' },
        },
      };
      expect(
        TypeMapper.map(schema, {
          propName: 'public_net',
          resourceName: 'Server',
        }),
      ).toBe('ServerPublicNet');
    });
  });
});
