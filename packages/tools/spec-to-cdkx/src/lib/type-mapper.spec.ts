import { TypeMapper } from './type-mapper.js';

describe('TypeMapper', () => {
  describe('toCamelCase()', () => {
    it('converts snake_case to camelCase', () => {
      expect(TypeMapper.toCamelCase('snake_case')).toBe('snakeCase');
      expect(TypeMapper.toCamelCase('ip_range')).toBe('ipRange');
    });

    it('converts kebab-case to camelCase', () => {
      expect(TypeMapper.toCamelCase('floating-ip')).toBe('floatingIp');
    });

    it('leaves camelCase unchanged', () => {
      expect(TypeMapper.toCamelCase('alreadyCamel')).toBe('alreadyCamel');
    });
  });

  describe('toPascalCase()', () => {
    it('capitalises the first letter', () => {
      expect(TypeMapper.toPascalCase('network')).toBe('Network');
      expect(TypeMapper.toPascalCase('networkId')).toBe('NetworkId');
    });

    it('returns empty string unchanged', () => {
      expect(TypeMapper.toPascalCase('')).toBe('');
    });
  });

  describe('toAttrMemberName()', () => {
    it('capitalises the first letter for attr prefix usage', () => {
      expect(TypeMapper.toAttrMemberName('networkId')).toBe('NetworkId');
      expect(TypeMapper.toAttrMemberName('serverId')).toBe('ServerId');
      expect(TypeMapper.toAttrMemberName('id')).toBe('Id');
    });
  });

  describe('isCrossRefId()', () => {
    it('returns true for names ending in Id', () => {
      expect(TypeMapper.isCrossRefId('networkId')).toBe(true);
      expect(TypeMapper.isCrossRefId('serverId')).toBe(true);
      expect(TypeMapper.isCrossRefId('loadBalancerId')).toBe(true);
    });

    it('returns true for names ending in _id', () => {
      expect(TypeMapper.isCrossRefId('network_id')).toBe(true);
      expect(TypeMapper.isCrossRefId('server_id')).toBe(true);
    });

    it('returns false for bare "id"', () => {
      expect(TypeMapper.isCrossRefId('id')).toBe(false);
    });

    it('returns false for plain integer props that are not cross-refs', () => {
      expect(TypeMapper.isCrossRefId('port')).toBe(false);
      expect(TypeMapper.isCrossRefId('interval')).toBe(false);
      expect(TypeMapper.isCrossRefId('retries')).toBe(false);
      expect(TypeMapper.isCrossRefId('count')).toBe(false);
    });
  });

  describe('mapType()', () => {
    const ctx = { resourceName: 'Network' };

    it('maps string type', () => {
      expect(TypeMapper.mapType({ type: 'string' }, ctx, 'name')).toBe(
        'string',
      );
    });

    it('maps integer type to number', () => {
      expect(TypeMapper.mapType({ type: 'integer' }, ctx, 'count')).toBe(
        'number',
      );
    });

    it('maps integer cross-ref ID to number | IResolvable', () => {
      expect(TypeMapper.mapType({ type: 'integer' }, ctx, 'networkId')).toBe(
        'number | IResolvable',
      );
      expect(TypeMapper.mapType({ type: 'integer' }, ctx, 'serverId')).toBe(
        'number | IResolvable',
      );
    });

    it('maps bare "id" integer prop to plain number (not a cross-ref)', () => {
      expect(TypeMapper.mapType({ type: 'integer' }, ctx, 'id')).toBe('number');
    });

    it('maps boolean type', () => {
      expect(TypeMapper.mapType({ type: 'boolean' }, ctx, 'enabled')).toBe(
        'boolean',
      );
    });

    it('appends | null when nullable is true', () => {
      expect(
        TypeMapper.mapType({ type: 'string', nullable: true }, ctx, 'name'),
      ).toBe('string | null');
    });

    it('maps integer array to (number | IResolvable)[]', () => {
      expect(
        TypeMapper.mapType(
          { type: 'array', items: { type: 'integer' } },
          ctx,
          'ids',
        ),
      ).toBe('(number | IResolvable)[]');
    });

    it('maps string array to (string | IResolvable)[]', () => {
      expect(
        TypeMapper.mapType(
          { type: 'array', items: { type: 'string' } },
          ctx,
          'tags',
        ),
      ).toBe('(string | IResolvable)[]');
    });

    it('maps array with $ref items', () => {
      expect(
        TypeMapper.mapType(
          { type: 'array', items: { $ref: '#/definitions/FirewallRule' } },
          ctx,
          'rules',
        ),
      ).toBe('FirewallRule[]');
    });

    it('maps same-file $ref', () => {
      expect(
        TypeMapper.mapType(
          { $ref: '#/definitions/NetworkSubnetType' },
          ctx,
          'type',
        ),
      ).toBe('NetworkSubnetType');
    });

    it('maps additionalProperties: { type: string } to Record<string, string>', () => {
      expect(
        TypeMapper.mapType(
          {
            type: 'object',
            additionalProperties: { type: 'string' },
          },
          ctx,
          'labels',
        ),
      ).toBe('Record<string, string>');
    });

    it('maps inline object with properties to named nested interface', () => {
      expect(
        TypeMapper.mapType(
          {
            type: 'object',
            properties: { foo: { type: 'string' } },
          },
          ctx,
          'publicNet',
        ),
      ).toBe('NetworkPublicNet');
    });

    it('returns unknown for unrecognised schema', () => {
      expect(TypeMapper.mapType({}, ctx, 'x')).toBe('unknown');
    });
  });
});
