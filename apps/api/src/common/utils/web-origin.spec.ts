import { ConfigService } from '@nestjs/config';

import { webOrigin } from './web-origin';

describe('webOrigin', () => {
  const of = (WEB_URL?: string) =>
    webOrigin(new ConfigService(WEB_URL === undefined ? {} : { WEB_URL }));
  it('keeps only scheme and host of WEB_URL', () => {
    expect(of('https://nuska.kg')).toBe('https://nuska.kg');
    expect(of('https://nuska.kg/')).toBe('https://nuska.kg');
    expect(of('https://nuska.kg/ky/')).toBe('https://nuska.kg');
    expect(of(' https://x.vercel.app/ky/catalog ')).toBe('https://x.vercel.app');
    expect(of('http://localhost:3001')).toBe('http://localhost:3001');
  });
  it('falls back to localhost', () => {
    expect(of()).toBe('http://localhost:3000');
    expect(of('not a url')).toBe('http://localhost:3000');
  });
});
