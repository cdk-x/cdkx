import * as https from 'node:https';
import * as http from 'node:http';
import { EventEmitter } from 'node:events';
import { HetznerClient } from './hetzner-client';

// ─── Minimal fake http.ClientRequest / IncomingMessage ───────────────────────

function makeResponse(statusCode: number, body: string): http.IncomingMessage {
  const res = new EventEmitter() as http.IncomingMessage;
  res.statusCode = statusCode;
  process.nextTick(() => {
    res.emit('data', Buffer.from(body));
    res.emit('end');
  });
  return res;
}

function makeRequest(onWrite?: (chunk: string) => void): http.ClientRequest {
  const req = new EventEmitter() as http.ClientRequest;
  (req as unknown as Record<string, unknown>)['write'] = (chunk: string) => {
    if (onWrite) onWrite(chunk);
  };
  (req as unknown as Record<string, unknown>)['end'] = () => undefined;
  return req;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HetznerClient', () => {
  let requestSpy: jest.SpyInstance;

  afterEach(() => {
    requestSpy?.mockRestore();
  });

  function mockHttps(
    statusCode: number,
    responseBody: unknown,
    captureWritten?: (s: string) => void,
  ) {
    const responseStr =
      typeof responseBody === 'string'
        ? responseBody
        : JSON.stringify(responseBody);

    requestSpy = jest
      .spyOn(https, 'request')
      .mockImplementation((_opts, cb) => {
        const res = makeResponse(statusCode, responseStr);
        if (cb) (cb as (r: http.IncomingMessage) => void)(res);
        return makeRequest(captureWritten);
      });
  }

  // ─── GET ──────────────────────────────────────────────────────────────────

  describe('get()', () => {
    it('sends GET with Authorization header and returns parsed JSON', async () => {
      mockHttps(200, { network: { id: 123 } });

      const client = new HetznerClient({ apiToken: 'my-token' });
      const result = await client.get<{ network: { id: number } }>(
        '/networks/123',
      );

      expect(result).toEqual({ network: { id: 123 } });

      const callOpts = (
        requestSpy.mock.calls[0] as [https.RequestOptions, unknown]
      )[0];
      expect(callOpts.headers).toMatchObject({
        Authorization: 'Bearer my-token',
      });
      expect(callOpts.method).toBe('GET');
    });

    it('throws a descriptive error on 404', async () => {
      mockHttps(404, {
        error: { code: 'not_found', message: 'Resource not found' },
      });

      const client = new HetznerClient({ apiToken: 'tok' });
      await expect(client.get('/networks/999')).rejects.toThrow(
        'Hetzner API error 404 GET /networks/999: not_found: Resource not found',
      );
    });

    it('throws on 401 Unauthorized', async () => {
      mockHttps(401, {
        error: { code: 'unauthorized', message: 'Invalid token' },
      });
      const client = new HetznerClient({ apiToken: 'bad' });
      await expect(client.get('/networks')).rejects.toThrow(
        'Hetzner API error 401',
      );
    });
  });

  // ─── POST ─────────────────────────────────────────────────────────────────

  describe('post()', () => {
    it('sends POST with JSON body and returns parsed response', async () => {
      mockHttps(201, { network: { id: 42, name: 'my-net' } });

      const client = new HetznerClient({ apiToken: 'tok' });
      const result = await client.post<{
        network: { id: number; name: string };
      }>('/networks', { name: 'my-net', ip_range: '10.0.0.0/16' });

      expect(result).toEqual({ network: { id: 42, name: 'my-net' } });
      expect(requestSpy.mock.calls[0][0].method).toBe('POST');
    });

    it('throws on 422 Unprocessable with Hetzner error message', async () => {
      mockHttps(422, {
        error: { code: 'invalid_input', message: 'ip_range is required' },
      });

      const client = new HetznerClient({ apiToken: 'tok' });
      await expect(
        client.post('/networks', { name: 'no-range' }),
      ).rejects.toThrow(
        'Hetzner API error 422 POST /networks: invalid_input: ip_range is required',
      );
    });

    it('falls back to raw body when error response is not valid JSON', async () => {
      mockHttps(500, 'Internal Server Error');

      const client = new HetznerClient({ apiToken: 'tok' });
      await expect(client.post('/networks', {})).rejects.toThrow(
        'Hetzner API error 500 POST /networks: Internal Server Error',
      );
    });
  });

  // ─── PUT ──────────────────────────────────────────────────────────────────

  describe('put()', () => {
    it('sends PUT and returns parsed response', async () => {
      mockHttps(200, { network: { id: 1, name: 'updated' } });

      const client = new HetznerClient({ apiToken: 'tok' });
      const result = await client.put<{
        network: { id: number; name: string };
      }>('/networks/1', { name: 'updated' });

      expect(result).toEqual({ network: { id: 1, name: 'updated' } });
      expect(requestSpy.mock.calls[0][0].method).toBe('PUT');
    });
  });

  // ─── DELETE ───────────────────────────────────────────────────────────────

  describe('delete()', () => {
    it('resolves with undefined on 204 No Content', async () => {
      mockHttps(204, '');

      const client = new HetznerClient({ apiToken: 'tok' });
      const result = await client.delete('/networks/1');

      expect(result).toBeUndefined();
      expect(requestSpy.mock.calls[0][0].method).toBe('DELETE');
    });

    it('throws on 404 when deleting a non-existent resource', async () => {
      mockHttps(404, {
        error: { code: 'not_found', message: 'Network not found' },
      });

      const client = new HetznerClient({ apiToken: 'tok' });
      await expect(client.delete('/networks/999')).rejects.toThrow(
        'Hetzner API error 404 DELETE /networks/999',
      );
    });
  });

  // ─── Base URL ─────────────────────────────────────────────────────────────

  describe('baseUrl option', () => {
    it('uses the default base URL when not specified', async () => {
      mockHttps(200, {});
      const client = new HetznerClient({ apiToken: 'tok' });
      await client.get('/test');

      const callOpts = (
        requestSpy.mock.calls[0] as [https.RequestOptions, unknown]
      )[0];
      expect(callOpts.hostname).toBe('api.hetzner.cloud');
    });

    it('uses a custom base URL when specified', async () => {
      // Use https for a custom URL (same spy covers it)
      mockHttps(200, {});
      const client = new HetznerClient({
        apiToken: 'tok',
        baseUrl: 'https://custom.example.com/v2',
      });
      await client.get('/test');

      const callOpts = (
        requestSpy.mock.calls[0] as [https.RequestOptions, unknown]
      )[0];
      expect(callOpts.hostname).toBe('custom.example.com');
      expect(callOpts.path).toBe('/v2/test');
    });
  });

  // ─── Network error ────────────────────────────────────────────────────────

  describe('network errors', () => {
    it('rejects when the underlying socket emits an error', async () => {
      requestSpy = jest
        .spyOn(https, 'request')
        .mockImplementation((_opts, _cb) => {
          const req = makeRequest();
          process.nextTick(() => req.emit('error', new Error('ECONNREFUSED')));
          return req;
        });

      const client = new HetznerClient({ apiToken: 'tok' });
      await expect(client.get('/networks')).rejects.toThrow('ECONNREFUSED');
    });
  });
});
