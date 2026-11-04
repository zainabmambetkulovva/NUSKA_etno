import { createHash, randomBytes } from 'node:crypto';

/** Cryptographically random opaque token (256 bits, base64url). */
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

/** Tokens are stored only as SHA-256 hashes. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
