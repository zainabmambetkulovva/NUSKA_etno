import type { NextRequest } from 'next/server';

/**
 * Same-origin proxy to the NestJS API. The browser only talks to the website,
 * so auth cookies are first-party and no CORS is needed. The proxy adds:
 * - X-Proxy-Secret: the API rejects requests without it (it is not public);
 * - X-Client-IP: the real visitor IP, so rate limiting works per customer.
 * Hosting platforms such as Vercel overwrite X-Forwarded-For with the
 * visitor's address, so the first entry is trustworthy there.
 */
export const dynamic = 'force-dynamic';

const API_URL = (process.env.API_INTERNAL_URL || 'http://localhost:4000').replace(/\/$/, '');
const PROXY_SECRET = process.env.API_PROXY_SECRET;
/** Slightly above the API's 4 MB image limit (multipart overhead); below Vercel's 4.5 MB body limit. */
const MAX_BODY_BYTES = 4.4 * 1024 * 1024;

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
  'x-proxy-secret',
  'x-client-ip',
]);

function clientIp(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || '127.0.0.1';
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const target = `${API_URL}/api/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  headers.set('x-client-ip', clientIp(request));
  if (PROXY_SECRET) headers.set('x-proxy-secret', PROXY_SECRET);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  if (hasBody && Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    return Response.json(
      { statusCode: 413, code: 'FILE_TOO_LARGE', message: 'Request body is too large' },
      { status: 413 }
    );
  }
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      redirect: 'manual',
      cache: 'no-store',
      // Required by Node's fetch to stream a request body (multipart uploads).
      ...(hasBody ? { duplex: 'half' } : {}),
    } as RequestInit);
  } catch {
    return Response.json(
      { statusCode: 502, code: 'NETWORK', message: 'API is unavailable' },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const name = key.toLowerCase();
    // fetch already decoded the body; cookies are copied one by one below.
    if (!HOP_BY_HOP.has(name) && name !== 'content-encoding' && name !== 'set-cookie')
      responseHeaders.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie())
    responseHeaders.append('set-cookie', cookie);

  return new Response(upstream.status === 204 || upstream.status === 304 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };
