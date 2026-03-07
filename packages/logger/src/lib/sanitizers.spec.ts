import { Sanitizers } from './sanitizers';

describe('Sanitizers', () => {
  describe('sanitizeHeaders', () => {
    it('should redact Authorization header', () => {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret-token',
      };

      const sanitized = Sanitizers.sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        'Content-Type': 'application/json',
        Authorization: '[REDACTED]',
      });
    });

    it('should redact X-Auth-Token header', () => {
      const headers = {
        'X-Auth-Token': 'my-secret-token',
        'User-Agent': 'cdkx/1.0',
      };

      const sanitized = Sanitizers.sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        'X-Auth-Token': '[REDACTED]',
        'User-Agent': 'cdkx/1.0',
      });
    });

    it('should redact API-Key header', () => {
      const headers = {
        'API-Key': 'my-api-key',
        Accept: 'application/json',
      };

      const sanitized = Sanitizers.sanitizeHeaders(headers);

      expect(sanitized).toEqual({
        'API-Key': '[REDACTED]',
        Accept: 'application/json',
      });
    });

    it('should be case-insensitive for header names', () => {
      const headers = {
        authorization: 'Bearer token',
        AUTHORIZATION: 'Bearer token2',
        'x-auth-token': 'token3',
      };

      const sanitized = Sanitizers.sanitizeHeaders(headers);

      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.AUTHORIZATION).toBe('[REDACTED]');
      expect(sanitized['x-auth-token']).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'cdkx/1.0',
      };

      const sanitized = Sanitizers.sanitizeHeaders(headers);

      expect(sanitized).toEqual(headers);
    });

    it('should handle array header values', () => {
      const headers = {
        'Set-Cookie': ['cookie1=value1', 'cookie2=value2'],
        Authorization: 'Bearer token',
      };

      const sanitized = Sanitizers.sanitizeHeaders(headers);

      expect(sanitized['Set-Cookie']).toEqual([
        'cookie1=value1',
        'cookie2=value2',
      ]);
      expect(sanitized.Authorization).toBe('[REDACTED]');
    });
  });

  describe('sanitizeBody', () => {
    it('should redact fields matching "token"', () => {
      const body = {
        name: 'my-resource',
        apiToken: 'secret-token',
        otherField: 'safe',
      };

      const sanitized = Sanitizers.sanitizeBody(body);

      expect(sanitized).toEqual({
        name: 'my-resource',
        apiToken: '[REDACTED]',
        otherField: 'safe',
      });
    });

    it('should redact fields matching "password"', () => {
      const body = {
        username: 'admin',
        password: 'super-secret',
        userPassword: 'another-secret',
      };

      const sanitized = Sanitizers.sanitizeBody(body);

      expect(sanitized).toEqual({
        username: 'admin',
        password: '[REDACTED]',
        userPassword: '[REDACTED]',
      });
    });

    it('should redact fields matching "secret"', () => {
      const body = {
        publicValue: 'ssh-rsa ...',
        clientSecret: 'oauth-secret',
        secret: 'top-secret',
      };

      const sanitized = Sanitizers.sanitizeBody(body);

      expect(sanitized).toEqual({
        publicValue: 'ssh-rsa ...',
        clientSecret: '[REDACTED]',
        secret: '[REDACTED]',
      });
    });

    it('should redact fields matching "key" (case-insensitive)', () => {
      const body = {
        name: 'resource',
        apiKey: 'my-key',
        sshKey: 'ssh-key',
        Key: 'another-key',
      };

      const sanitized = Sanitizers.sanitizeBody(body);

      expect(sanitized).toEqual({
        name: 'resource',
        apiKey: '[REDACTED]',
        sshKey: '[REDACTED]',
        Key: '[REDACTED]',
      });
    });

    it('should recursively sanitize nested objects', () => {
      const body = {
        server: {
          name: 'web-server',
          credentials: {
            apiToken: 'secret',
            username: 'admin',
          },
        },
      };

      const sanitized = Sanitizers.sanitizeBody(body);

      expect(sanitized).toEqual({
        server: {
          name: 'web-server',
          credentials: {
            apiToken: '[REDACTED]',
            username: 'admin',
          },
        },
      });
    });

    it('should sanitize arrays of objects', () => {
      const body = {
        servers: [
          { name: 'server1', apiToken: 'token1' },
          { name: 'server2', apiToken: 'token2' },
        ],
      };

      const sanitized = Sanitizers.sanitizeBody(body);

      expect(sanitized).toEqual({
        servers: [
          { name: 'server1', apiToken: '[REDACTED]' },
          { name: 'server2', apiToken: '[REDACTED]' },
        ],
      });
    });

    it('should handle null and undefined', () => {
      expect(Sanitizers.sanitizeBody(null)).toBeNull();
      expect(Sanitizers.sanitizeBody(undefined)).toBeUndefined();
    });

    it('should handle primitive values', () => {
      expect(Sanitizers.sanitizeBody('string')).toBe('string');
      expect(Sanitizers.sanitizeBody(123)).toBe(123);
      expect(Sanitizers.sanitizeBody(true)).toBe(true);
    });

    it('should preserve non-sensitive fields', () => {
      const body = {
        name: 'resource',
        type: 'server',
        location: 'nbg1',
        labels: { env: 'prod' },
      };

      const sanitized = Sanitizers.sanitizeBody(body);

      expect(sanitized).toEqual(body);
    });
  });
});
