import type { NextRequest } from 'next/server';
import { Agent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from 'undici';

/**
 * Same-origin proxy to the NestJS API. The browser only talks to the website,
 * so auth cookies are first-party and no CORS is needed. The proxy adds:
 * - X-Proxy-Secret: the API rejects requests without it (it is not public);
 * - X-Client-IP: the real visitor IP, so rate limiting works per customer.
 * Hosting platforms such as Vercel overwrite X-Forwarded-For with the
 * visitor's address, so the first entry is trustworthy there.
 */
export const dynamic = 'force-dynamic';
/** The API host on a free plan needs up to a minute to wake up; wait for it. */
export const maxDuration = 60;

const API_URL = (process.env.API_INTERNAL_URL || 'http://localhost:4000').replace(/\/$/, '');
const PROXY_SECRET = process.env.API_PROXY_SECRET;
/** Slightly above the API's 4 MB image limit (multipart overhead); below Vercel's 4.5 MB body limit. */
const MAX_BODY_BYTES = 4.4 * 1024 * 1024;

/**
 * Connections to the API are reused only for 2 s. The API host's load balancer
 * closes idle connections without telling the client; a request sent on such a
 * connection fails with "other side closed". That hit the Google callback: the
 * visitor spends 10–30 s choosing an account, and the connection opened by the
 * start of the sign-in was dead by then.
 */
const agent = new Agent({ keepAliveTimeout: 2_000, keepAliveMaxTimeout: 2_000 });
/** Pauses before trying a request again after a network error. */
const RETRY_DELAYS = [150, 600];
/** Longer pauses while the API host is starting (about 45 s in all). */
const WAKE_DELAYS = [1_000, 2_000, 4_000, 8_000, 12_000, 18_000];

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

function unavailable() {
  return Response.json(
    { statusCode: 502, code: 'NETWORK', message: 'API is unavailable' },
    { status: 502 }
  );
}

/** "fetch failed (ECONNRESET: other side closed)" — the cause tells what happened. */
function describe(error: unknown) {
  const cause = (error as { cause?: { code?: string; message?: string } }).cause;
  return `${(error as Error).message}${cause ? ` (${cause.code ?? ''}: ${cause.message ?? ''})` : ''}`;
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
  // Uploads are streamed; other bodies (JSON forms) are small and read first, so the
  // request can be sent again if the connection drops.
  const streamed =
    hasBody && (request.headers.get('content-type') ?? '').startsWith('multipart/form-data');
  const body = hasBody && !streamed ? await request.arrayBuffer() : undefined;
  const send = () =>
    undiciFetch(target, {
      method: request.method,
      headers,
      body: streamed ? (request.body as UndiciRequestInit['body']) : body,
      redirect: 'manual',
      dispatcher: agent,
      // Required to stream a request body (multipart uploads).
      ...(streamed ? { duplex: 'half' } : {}),
    });

  // The API host may be asleep (free plan) and need up to a minute to start.
  // - A connection error means the request never reached the API, so any request
  //   (sign-in too) is sent again: first quickly, then with longer pauses (~45 s).
  // - 502/503 come from the host's router while the API is starting: the request
  //   was not processed, so it is sent again too. 504 may come after the API did
  //   the work, so only read requests (which change nothing) repeat on it.
  const delays = [...RETRY_DELAYS, ...WAKE_DELAYS];
  const where = `[api proxy] ${request.method} /${path.join('/')}`;
  const starting = (status: number) =>
    status === 502 || status === 503 || (!hasBody && status === 504);
  let upstream: Awaited<ReturnType<typeof send>> | undefined;
  for (let attempt = 0; ; attempt++) {
    try {
      upstream = await send();
      if (!starting(upstream.status) || streamed || attempt >= delays.length) break;
      await upstream.body?.cancel();
    } catch (error) {
      if (streamed || attempt >= delays.length) {
        console.error(`${where}: ${describe(error)}`);
        return unavailable();
      }
      if (attempt === 0) console.warn(`${where}: ${describe(error)}; retrying`);
    }
    await new Promise((resolve) => setTimeout(resolve, delays[attempt]));
  }
  if (starting(upstream.status)) return unavailable();

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const name = key.toLowerCase();
    // fetch already decoded the body; cookies are copied one by one below.
    if (!HOP_BY_HOP.has(name) && name !== 'content-encoding' && name !== 'set-cookie')
      responseHeaders.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie())
    responseHeaders.append('set-cookie', cookie);

  const responseBody = upstream.status === 204 || upstream.status === 304 ? null : upstream.body;
  return new Response(responseBody as BodyInit | null, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export { proxy as DELETE, proxy as GET, proxy as PATCH, proxy as POST, proxy as PUT };
