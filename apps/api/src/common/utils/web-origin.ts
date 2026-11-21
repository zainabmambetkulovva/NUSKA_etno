import { ConfigService } from '@nestjs/config';

/**
 * The website's address from WEB_URL, reduced to scheme + host (+ port): a
 * path or trailing slash typed into WEB_URL (e.g. "https://site.kg/ky/") must
 * not end up in links, payment returns or OAuth callbacks.
 */
export function webOrigin(config: ConfigService): string {
  const raw = (config.get<string>('WEB_URL') ?? '').trim();
  try {
    return new URL(raw || 'http://localhost:3000').origin;
  } catch {
    return 'http://localhost:3000';
  }
}
