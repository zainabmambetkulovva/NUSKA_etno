import { ConfigService } from '@nestjs/config';

import { MailService } from './mail.service';

function service(env: Record<string, string>) {
  const mail = new MailService(new ConfigService(env));
  mail.onModuleInit();
  return mail;
}

describe('MailService', () => {
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('sends through Resend over HTTPS when RESEND_API_KEY is set', async () => {
    fetchMock.mockResolvedValue(new Response('{"id":"1"}', { status: 200 }));
    const mail = service({ RESEND_API_KEY: 're_test', MAIL_FROM: 'NUSKA_etno <hello@nuska.kg>' });
    const ok = await mail.send('a@example.com', { subject: 'Тема', text: 'Текст' });

    expect(ok).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    expect(JSON.parse(init.body)).toEqual({
      from: 'NUSKA_etno <hello@nuska.kg>',
      to: ['a@example.com'],
      subject: 'Тема',
      text: 'Текст',
    });
  });

  it('reports a refused or unreachable Resend without throwing', async () => {
    const mail = service({ RESEND_API_KEY: 're_test' });
    fetchMock.mockResolvedValueOnce(
      new Response('{"message":"domain not verified"}', { status: 403 })
    );
    await expect(mail.send('a@example.com', { subject: 's', text: 't' })).resolves.toBe(false);
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    await expect(mail.send('a@example.com', { subject: 's', text: 't' })).resolves.toBe(false);
  });

  it('without a provider only logs the message outside production', async () => {
    const mail = service({ NODE_ENV: 'development' });
    await expect(mail.send('a@example.com', { subject: 's', text: 't' })).resolves.toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
