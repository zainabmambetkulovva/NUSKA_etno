import { createSign, createVerify } from 'node:crypto';

/**
 * Finik request signatures (RSA-SHA256, base64), built exactly like Finik's own
 * library `@mancho.devs/authorizer`:
 *
 *   <http method, lower case>
 *   <path, URL-decoded>
 *   host:<Host>&<x-api-* headers sorted by name, "name:value", joined by &>
 *   [<query: sorted "key=value" joined by &>]           only when there is a query
 *   <JSON body with its top-level keys sorted>           "" when there is no body
 *
 * The parts are joined by "\n". Our requests are signed with the shop's private
 * key; webhooks are verified with Finik's public key.
 */
export interface SignedRequest {
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown> | null;
  query?: Record<string, string | undefined>;
}

const header = (headers: SignedRequest['headers'], name: string) => {
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
  const value = entry?.[1];
  return Array.isArray(value) ? value[0] : value;
};

export function canonicalString({ method, path, headers, body, query }: SignedRequest): string {
  const host = header(headers, 'host');
  if (!host) throw new Error("Header 'Host' is required for a Finik signature");
  const apiHeaders = Object.keys(headers)
    .filter((key) => key.toLowerCase().startsWith('x-api-'))
    .sort()
    .map((key) => `${key.toLowerCase()}:${String(header(headers, key.toLowerCase()))}`);
  const parts = [method.toLowerCase(), decodeURI(path), [`host:${host}`, ...apiHeaders].join('&')];
  const queryKeys = Object.keys(query ?? {}).sort();
  if (queryKeys.length > 0)
    parts.push(
      queryKeys
        .map((key) => `${encodeURI(decodeURI(key))}=${encodeURI(decodeURI(query?.[key] ?? ''))}`)
        .join('&')
    );
  parts.push(
    body
      ? JSON.stringify(
          Object.fromEntries(Object.entries(body).sort(([a], [b]) => a.localeCompare(b)))
        )
      : ''
  );
  return parts.join('\n');
}

/** PEM keys often come from one-line environment variables with literal "\n". */
export const pem = (key: string) => key.replace(/\\n/g, '\n').trim();

export function signFinik(request: SignedRequest, privateKey: string): string {
  const signer = createSign('SHA256');
  signer.update(canonicalString(request));
  return signer.sign(pem(privateKey), 'base64');
}

/** Never throws: anything malformed is simply "not valid". */
export function verifyFinik(request: SignedRequest, signature: string, publicKey: string): boolean {
  try {
    const verifier = createVerify('SHA256');
    verifier.update(canonicalString(request));
    return verifier.verify(pem(publicKey), signature, 'base64');
  } catch {
    return false;
  }
}
