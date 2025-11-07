import os from 'os';

/**
 * PUBLIC_INTERFACE
 * applySecurity
 * Apply minimal security-related HTTP headers similar to Helmet defaults,
 * without adding external dependencies.
 *
 * The headers help mitigate common web vulnerabilities:
 * - X-DNS-Prefetch-Control: disable DNS prefetching
 * - X-Frame-Options: prevent clickjacking
 * - X-Content-Type-Options: prevent MIME type sniffing
 * - Referrer-Policy: reduce referrer leakage
 * - Permissions-Policy: restrict powerful features (empty by default)
 * - Strict-Transport-Security: only when X-Forwarded-Proto indicates HTTPS
 */
export function applySecurity(app) {
  app.use((req, res, next) => {
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    // Set HSTS only when behind HTTPS
    const xfProto = (req.headers['x-forwarded-proto'] || '').toString().toLowerCase();
    if (xfProto.includes('https') || req.secure) {
      // 6 months, include subdomains, preload opt-in
      res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains; preload');
    }

    next();
  });
}

/**
 * PUBLIC_INTERFACE
 * applyRequestLogger
 * Apply a minimal request logger similar to morgan's 'combined' but lightweight.
 * Logs a single line per completed request in JSON for easy ingestion.
 *
 * The log line contains:
 * - level, type
 * - method, path, status
 * - responseTime (ms)
 * - contentLength (if available)
 * - userAgent, remoteAddress, host, pid
 */
export function applyRequestLogger(app) {
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    // Hook into finish/close to log when response completes
    const done = () => {
      try {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;

        const length = res.getHeader('content-length');
        const remoteAddress =
          req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ||
          req.socket?.remoteAddress ||
          undefined;

        const line = {
          level: 'info',
          type: 'http_access',
          method: req.method,
          path: req.originalUrl || req.url,
          status: res.statusCode,
          responseTime: Math.round(durationMs),
          contentLength: length ? Number(length) : undefined,
          userAgent: req.headers['user-agent'],
          remoteAddress,
          host: req.headers.host,
          pid: process.pid,
        };

        // Avoid undefined fields in output
        Object.keys(line).forEach((k) => line[k] === undefined && delete line[k]);

        console.log(JSON.stringify(line));
      } catch (e) {
        // Swallow logger errors to avoid breaking the response cycle
        // eslint-disable-next-line no-console
        console.error(
          JSON.stringify({
            level: 'error',
            type: 'logger_error',
            message: e?.message || 'Logger failure',
          })
        );
      }
    };

    res.on('finish', done);
    res.on('close', done);
    next();
  });
}

/**
 * PUBLIC_INTERFACE
 * registerSecurityAndLogging
 * Convenience helper to register both logging and security headers in the
 * correct order:
 * 1) Request logger (so we log even early failures)
 * 2) Security headers
 */
export function registerSecurityAndLogging(app) {
  applyRequestLogger(app);
  applySecurity(app);
}

export default {
  applySecurity,
  applyRequestLogger,
  registerSecurityAndLogging,
};
