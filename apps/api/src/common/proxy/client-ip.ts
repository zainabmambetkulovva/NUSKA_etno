import { timingSafeEqual } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Real client IP (from the trusted frontend proxy, or the socket / trust-proxy chain). */
      clientIp?: string;
      /** Server-to-server call from the website (SSR) with the proxy secret and no visitor IP. */
      fromTrustedServer?: boolean;
    }
  }
}

export const PROXY_SECRET_HEADER = 'x-proxy-secret';
export const CLIENT_IP_HEADER = 'x-client-ip';

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * When PROXY_SECRET is set, the API is reachable only through the Next.js
 * proxy (apps/web/src/app/api/[...path]/route.ts), which adds the secret and
 * the real client IP. Direct requests are refused, so the client IP used for
 * rate limiting cannot be spoofed. /api/health stays open for the platform's
 * health checks.
 */
export function clientIpMiddleware(proxySecret: string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (proxySecret) {
      const provided = req.header(PROXY_SECRET_HEADER) ?? '';
      if (!safeEqual(provided, proxySecret)) {
        if (req.path === '/api/health') return next();
        res
          .status(403)
          .json({ statusCode: 403, code: 'DIRECT_ACCESS_FORBIDDEN', message: 'Use the website' });
        return;
      }
      const forwarded = req.header(CLIENT_IP_HEADER)?.split(',')[0]?.trim();
      if (forwarded) req.clientIp = forwarded.slice(0, 64);
      else req.fromTrustedServer = true;
    }
    req.clientIp ??= req.ip;
    next();
  };
}
