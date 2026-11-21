import { randomUUID } from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { webOrigin } from '../../common/utils/web-origin';

import { signFinik, verifyFinik } from './finik-signature';

/**
 * Finik's keys that sign webhooks (Finik docs, «Справочник → публичные ключи»).
 * The production key verifies the real webhook published in Finik's docs (see
 * finik.spec.ts). FINIK_PUBLIC_KEY overrides them if Finik rotates its keys.
 */
const FINIK_PUBLIC_KEYS = {
  production: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuF/PUmhMPPidcMxhZBPb
BSGJoSphmCI+h6ru8fG8guAlcPMVlhs+ThTjw2LHABvciwtpj51ebJ4EqhlySPyT
hqSfXI6Jp5dPGJNDguxfocohaz98wvT+WAF86DEglZ8dEsfoumojFUy5sTOBdHEu
g94B4BbrJvjmBa1YIx9Azse4HFlWhzZoYPgyQpArhokeHOHIN2QFzJqeriANO+wV
aUMta2AhRVZHbfyJ36XPhGO6A5FYQWgjzkI65cxZs5LaNFmRx6pjnhjIeVKKgF99
4OoYCzhuR9QmWkPl7tL4Kd68qa/xHLz0Psnuhm0CStWOYUu3J7ZpzRK8GoEXRcr8
tQIDAQAB
-----END PUBLIC KEY-----`,
  beta: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwlrlKz/8gLWd1ARWGA/8
o3a3Qy8G+hPifyqiPosiTY6nCHovANMIJXk6DH4qAqqZeLu8pLGxudkPbv8dSyG7
F9PZEAryMPzjoB/9P/F6g0W46K/FHDtwTM3YIVvstbEbL19m8yddv/xCT9JPPJTb
LsSTVZq5zCqvKzpupwlGS3Q3oPyLAYe+ZUn4Bx2J1WQrBu3b08fNaR3E8pAkCK27
JqFnP0eFfa817VCtyVKcFHb5ij/D0eUP519Qr/pgn+gsoG63W4pPHN/pKwQUUiAy
uLSHqL5S2yu1dffyMcMVi9E/Q2HCTcez5OvOllgOtkNYHSv9pnrMRuws3u87+hNT
ZwIDAQAB
-----END PUBLIC KEY-----`,
} as const;

const HOSTS = { production: 'api.acquiring.averspay.kg', beta: 'beta.api.acquiring.averspay.kg' };
const PAYMENT_PATH = '/v1/payment';

export type FinikResult = 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';

export interface FinikWebhook {
  /** our payment id (sent as PaymentId when the payment was created) */
  paymentId: string | null;
  transactionId: string | null;
  /** Finik's event id, unique per webhook */
  eventId: string;
  status: FinikResult;
  /** in tyiyn; Finik sends whole som */
  amount: number | null;
  raw: Record<string, unknown>;
}

/**
 * Online payment through Finik (finik.kg, AversPay acquiring): the customer is
 * sent to Finik's payment page; Finik confirms the result with a signed
 * webhook. Configured with FINIK_API_KEY, FINIK_ACCOUNT_ID and
 * FINIK_PRIVATE_KEY (server only); FINIK_ENV=beta uses the test environment.
 */
@Injectable()
export class FinikService {
  private readonly logger = new Logger(FinikService.name);
  private readonly apiKey?: string;
  private readonly accountId?: string;
  private readonly privateKey?: string;
  private readonly env: 'production' | 'beta';
  private readonly publicKey: string;
  private readonly merchantName: string;
  private readonly cardType: string;
  /** public address Finik calls (through the website proxy) */
  readonly webhookUrl: URL;
  /**
   * Test mode: every online payment charges FINIK_TEST_AMOUNT som instead of
   * the order total, so real payments can be tried many times; prices and
   * order totals stay real. While the shop is being tested it is ON by
   * default (1 som); FINIK_TEST_AMOUNT=0 switches it off for real sales.
   */
  readonly testAmount: number | null;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('FINIK_API_KEY') || undefined;
    this.accountId = config.get<string>('FINIK_ACCOUNT_ID') || undefined;
    this.privateKey = config.get<string>('FINIK_PRIVATE_KEY') || undefined;
    this.env =
      (config.get<string>('FINIK_ENV') ?? '').toLowerCase() === 'beta' ? 'beta' : 'production';
    this.publicKey = config.get<string>('FINIK_PUBLIC_KEY') || FINIK_PUBLIC_KEYS[this.env];
    this.merchantName = config.get<string>('FINIK_MERCHANT_NAME') || 'NUSKA_etno';
    this.cardType = config.get<string>('FINIK_CARD_TYPE') || 'FINIK_QR';
    const raw = (config.get<string>('FINIK_TEST_AMOUNT') ?? '').trim();
    const test = raw === '' ? 1 : Number(raw);
    this.testAmount = Number.isInteger(test) && test > 0 ? test * 100 : null;
    if (this.testAmount)
      this.logger.warn(`Finik TEST MODE: every online payment charges ${test} som`);
    const webUrl = webOrigin(config);
    this.webhookUrl = new URL(
      config.get<string>('FINIK_WEBHOOK_URL') || `${webUrl}/api/payments/finik/webhook`
    );
  }

  get configured() {
    return Boolean(this.apiKey && this.accountId && this.privateKey);
  }

  /** A new id for a payment attempt; Finik returns it in the webhook. */
  newPaymentId() {
    return randomUUID();
  }

  /**
   * Creates the payment and returns Finik's payment page. `amount` is in
   * tyiyn and must be whole som (Finik takes whole som).
   */
  async createPayment(input: {
    paymentId: string;
    amount: number;
    description: string;
    redirectUrl: string;
    locale: string;
  }): Promise<string> {
    if (!this.configured) throw new Error('Finik is not configured');
    if (input.amount <= 0 || input.amount % 100 !== 0)
      throw new Error('Finik accepts a positive whole number of som');
    const host = HOSTS[this.env];
    const body = {
      Amount: input.amount / 100,
      CardType: this.cardType,
      PaymentId: input.paymentId,
      RedirectUrl: input.redirectUrl,
      Lang: input.locale === 'ky' ? 'ky' : 'ru',
      Data: {
        accountId: this.accountId,
        description: input.description,
        webhookUrl: this.webhookUrl.toString(),
        name_en: this.merchantName,
      },
    };
    const timestamp = String(Date.now());
    const signature = signFinik(
      {
        method: 'POST',
        path: PAYMENT_PATH,
        headers: { Host: host, 'x-api-key': this.apiKey!, 'x-api-timestamp': timestamp },
        body,
      },
      this.privateKey!
    );
    const response = await fetch(`https://${host}${PAYMENT_PATH}`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'content-type': 'application/json',
        'x-api-key': this.apiKey!,
        'x-api-timestamp': timestamp,
        signature,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });
    // Finik answers 302 with the payment page in Location (or JSON with paymentUrl).
    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) return location;
    const text = await response.text();
    if (response.ok) {
      try {
        const url = (JSON.parse(text) as { paymentUrl?: string }).paymentUrl;
        if (url) return url;
      } catch {
        // not JSON: reported below
      }
    }
    this.logger.error(`Finik create payment failed: HTTP ${response.status} ${text.slice(0, 300)}`);
    throw new Error(`Finik create payment failed: HTTP ${response.status}`);
  }

  /**
   * Checks a webhook: Finik's signature over the public URL it called, and that
   * the money went to OUR account (Finik signs webhooks of all merchants with
   * one key). Returns null when the webhook must be rejected.
   */
  parseWebhook(
    body: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>
  ): FinikWebhook | null {
    const signatureHeader = headers['signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) return null;
    const signedHeaders: Record<string, string | string[] | undefined> = {
      Host: this.webhookUrl.host,
    };
    for (const [key, value] of Object.entries(headers))
      if (key.toLowerCase().startsWith('x-api-')) signedHeaders[key] = value;
    const valid = verifyFinik(
      { method: 'POST', path: this.webhookUrl.pathname, headers: signedHeaders, body },
      signature,
      this.publicKey
    );
    if (!valid) {
      this.logger.warn('Finik webhook: signature does not verify');
      return null;
    }
    const data = (body.data ?? {}) as Record<string, unknown>;
    if (String(data.accountId ?? '') !== this.accountId) {
      this.logger.warn(`Finik webhook for another account: ${String(data.accountId)}`);
      return null;
    }
    const fields = (body.fields ?? {}) as Record<string, unknown>;
    const raw = String(body.status ?? '').toLowerCase();
    const status: FinikResult = ['success', 'succeeded'].includes(raw)
      ? 'SUCCEEDED'
      : ['failed', 'failure', 'declined', 'canceled', 'cancelled'].includes(raw)
        ? 'FAILED'
        : 'UNKNOWN';
    const amount = Number(body.amount);
    const paymentId = (fields.paymentId ?? body.paymentId ?? null) as string | null;
    return {
      paymentId,
      transactionId: (body.transactionId as string | undefined) ?? null,
      eventId: String(body.id ?? `${body.transactionId ?? paymentId}_${raw}`),
      status,
      amount: Number.isFinite(amount) ? Math.round(amount * 100) : null,
      raw: body,
    };
  }
}
