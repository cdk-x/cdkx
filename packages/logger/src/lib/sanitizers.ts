/**
 * Sensitive field patterns to redact from logs.
 */
const SENSITIVE_PATTERNS = {
  headers: new Set(['authorization', 'x-auth-token', 'api-key']),
  fields: /token|password|secret|key/i,
};

/**
 * Redaction placeholder for sensitive data.
 */
const REDACTED = '[REDACTED]';

/**
 * Sanitizes HTTP headers by redacting sensitive values.
 *
 * @param headers - Raw headers object
 * @returns Sanitized headers with sensitive values redacted
 */
export class Sanitizers {
  static sanitizeHeaders(
    headers: Record<string, string | string[] | undefined>,
  ): Record<string, string | string[] | undefined> {
    const sanitized: Record<string, string | string[] | undefined> = {};

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_PATTERNS.headers.has(lowerKey)) {
        sanitized[key] = REDACTED;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitizes request/response body by redacting fields matching sensitive patterns.
   *
   * @param body - Raw body (any JSON-serializable value)
   * @returns Sanitized body with sensitive fields redacted
   */
  static sanitizeBody(body: unknown): unknown {
    if (body === null || body === undefined) {
      return body;
    }

    if (Array.isArray(body)) {
      return body.map((item) => Sanitizers.sanitizeBody(item));
    }

    if (typeof body === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(body)) {
        if (SENSITIVE_PATTERNS.fields.test(key)) {
          sanitized[key] = REDACTED;
        } else {
          sanitized[key] = Sanitizers.sanitizeBody(value);
        }
      }
      return sanitized;
    }

    return body;
  }
}
