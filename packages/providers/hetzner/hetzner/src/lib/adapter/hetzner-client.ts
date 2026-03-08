import * as https from 'node:https';
import * as http from 'node:http';
import type { Logger } from '@cdkx-io/logger';
import { Sanitizers } from '@cdkx-io/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HetznerClientOptions {
  /** Hetzner Cloud API token. */
  readonly apiToken: string;
  /** Base URL for the API. Defaults to 'https://api.hetzner.cloud/v1'. */
  readonly baseUrl?: string;
  /** Optional logger for HTTP request/response logging. */
  readonly logger?: Logger;
}

/** Shape of an error response from the Hetzner Cloud API. */
interface HetznerErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

// ─── HetznerClient ────────────────────────────────────────────────────────────

/**
 * Minimal HTTP client for the Hetzner Cloud API.
 *
 * Uses Node.js built-in `node:https` — no external dependencies.
 * All methods throw a descriptive `Error` on non-2xx responses, including
 * the Hetzner API error message when available.
 *
 * @example
 * ```ts
 * const client = new HetznerClient({ apiToken: process.env.HCLOUD_TOKEN! });
 * const network = await client.post<{ network: { id: number } }>('/networks', {
 *   name: 'my-net',
 *   ip_range: '10.0.0.0/16',
 * });
 * ```
 */
export class HetznerClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private logger?: Logger;

  constructor(options: HetznerClientOptions) {
    this.apiToken = options.apiToken;
    this.baseUrl = options.baseUrl ?? 'https://api.hetzner.cloud/v1';
    this.logger = options.logger;
  }

  /** Set a logger instance for HTTP request/response logging. */
  public setLogger(logger: Logger): void {
    this.logger = logger;
  }

  /** Perform a GET request and return the parsed JSON body. */
  public get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path, undefined);
  }

  /** Perform a POST request with a JSON body and return the parsed response. */
  public post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  /** Perform a PUT request with a JSON body and return the parsed response. */
  public put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * Perform a DELETE request.
   * Resolves with `undefined` on 2xx (including 204 No Content).
   */
  public delete(path: string): Promise<void> {
    return this.request<void>('DELETE', path, undefined);
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private request<T>(method: string, path: string, body: unknown): Promise<T> {
    const startTime = Date.now();

    // Log outgoing request
    this.logger?.debug('provider.http.request', {
      method,
      path,
      headers: Sanitizers.sanitizeHeaders({
        Authorization: `Bearer ${this.apiToken}`,
      }),
      body: Sanitizers.sanitizeBody(body as Record<string, unknown>),
    });

    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;

      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port !== '' ? Number(url.port) : 443,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(bodyStr !== undefined
            ? { 'Content-Length': Buffer.byteLength(bodyStr) }
            : {}),
        },
      };

      const protocol = url.protocol === 'http:' ? http : https;

      const req = protocol.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          const status = res.statusCode ?? 0;
          const durationMs = Date.now() - startTime;

          if (status >= 200 && status < 300) {
            if (raw.length === 0) {
              // Log successful empty response
              this.logger?.info('provider.http.response', {
                method,
                path,
                statusCode: status,
                durationMs,
              });
              resolve(undefined as unknown as T);
              return;
            }
            try {
              const parsed = JSON.parse(raw) as T;
              // Log successful response
              this.logger?.info('provider.http.response', {
                method,
                path,
                statusCode: status,
                durationMs,
                body: Sanitizers.sanitizeBody(
                  parsed as Record<string, unknown>,
                ),
              });
              resolve(parsed);
            } catch {
              reject(
                new Error(
                  `Hetzner API: failed to parse response body (status ${status}): ${raw}`,
                ),
              );
            }
            return;
          }

          // Non-2xx: extract error message from Hetzner error shape
          let apiMessage = raw;
          try {
            const parsed = JSON.parse(raw) as HetznerErrorResponse;
            if (parsed.error?.message !== undefined) {
              apiMessage = `${parsed.error.code ?? 'error'}: ${parsed.error.message}`;
            }
          } catch {
            // raw string fallback
          }

          const errorMessage = `Hetzner API error ${status} ${method} ${path}: ${apiMessage}`;

          // Log error response
          this.logger?.error(
            'provider.http.error',
            {
              method,
              path,
              statusCode: status,
              durationMs,
            },
            new Error(errorMessage),
          );

          reject(new Error(errorMessage));
        });
      });

      req.on('error', (err: Error) => {
        const durationMs = Date.now() - startTime;

        // Log network error
        this.logger?.error(
          'provider.http.error',
          {
            method,
            path,
            durationMs,
          },
          err,
        );

        reject(err);
      });

      if (bodyStr !== undefined) {
        req.write(bodyStr);
      }
      req.end();
    });
  }
}
