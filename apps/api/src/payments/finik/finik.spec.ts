import { ConfigService } from '@nestjs/config';

import { canonicalString, signFinik, verifyFinik } from './finik-signature';
import {
  FINIK_DOCS_WEBHOOK,
  FINIK_LIBRARY_VECTOR,
  FINIK_TEST_PRIVATE_KEY,
  FINIK_TEST_PUBLIC_KEY,
} from './finik.fixtures';
import { FinikService } from './finik.service';

describe('Finik signature', () => {
  it("builds the same string and signature as Finik's own library", () => {
    const { request, canonical, signature } = FINIK_LIBRARY_VECTOR;
    expect(canonicalString(request)).toBe(canonical);
    expect(signFinik(request, FINIK_TEST_PRIVATE_KEY)).toBe(signature);
    expect(verifyFinik(request, signature, FINIK_TEST_PUBLIC_KEY)).toBe(true);
  });

  it('accepts a private key written on one line with \\n', () => {
    const request = { method: 'POST', path: '/x', headers: { Host: 'h' }, body: { a: 1 } };
    const oneLine = FINIK_TEST_PRIVATE_KEY.replace(/\n/g, '\\n');
    expect(verifyFinik(request, signFinik(request, oneLine), FINIK_TEST_PUBLIC_KEY)).toBe(true);
  });

  it("verifies the real webhook from Finik's docs with Finik's production key", () => {
    const finik = new FinikService(
      new ConfigService({
        FINIK_API_KEY: 'k',
        FINIK_ACCOUNT_ID: FINIK_DOCS_WEBHOOK.body.data.accountId,
        FINIK_PRIVATE_KEY: FINIK_TEST_PRIVATE_KEY,
        FINIK_WEBHOOK_URL: `https://huntpro.kg${FINIK_DOCS_WEBHOOK.path}`,
      })
    );
    const headers = { ...FINIK_DOCS_WEBHOOK.headers, signature: FINIK_DOCS_WEBHOOK.signature };
    const event = finik.parseWebhook(FINIK_DOCS_WEBHOOK.body, headers);
    expect(event).toMatchObject({
      status: 'SUCCEEDED',
      paymentId: '141fc797-0366-480e-8ba7-2982632b2b2c',
      amount: 100, // 1 som in tyiyn
    });
    // a changed amount or another merchant's account is refused
    expect(finik.parseWebhook({ ...FINIK_DOCS_WEBHOOK.body, amount: 1000 }, headers)).toBeNull();
    const other = new FinikService(
      new ConfigService({
        FINIK_API_KEY: 'k',
        FINIK_ACCOUNT_ID: 'our-account',
        FINIK_PRIVATE_KEY: FINIK_TEST_PRIVATE_KEY,
        FINIK_WEBHOOK_URL: `https://huntpro.kg${FINIK_DOCS_WEBHOOK.path}`,
      })
    );
    expect(other.parseWebhook(FINIK_DOCS_WEBHOOK.body, headers)).toBeNull();
  });
});
