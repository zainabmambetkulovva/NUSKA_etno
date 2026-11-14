'use client';

import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { ArrowRightIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

/** Footer subscription: e-mail, consent checkbox, arrow button (double opt-in on the server). */
export function NewsletterForm() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [missingConsent, setMissingConsent] = useState(false);
  const subscribe = useMutation({
    mutationFn: () =>
      api('/newsletter/subscribe', { method: 'POST', body: { email, consent: true, locale } }),
  });

  if (subscribe.isSuccess)
    return (
      <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-[#F3EAD3]" role="status">
        {t.footer.newsletterSent}
      </p>
    );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!consent) return setMissingConsent(true);
        subscribe.mutate();
      }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 rounded-full bg-white/95 p-1.5 pl-5 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.6)]">
        <label htmlFor="footer-email" className="sr-only">
          {t.newsletter.email}
        </label>
        <input
          id="footer-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.newsletter.email}
          className="min-w-0 flex-1 bg-transparent text-sm text-nk-ink placeholder:text-nk-muted focus:outline-none"
        />
        <button
          type="submit"
          aria-label={t.newsletter.submit}
          disabled={subscribe.isPending}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#E2C68C] to-nk-gold text-nk-night transition hover:scale-105 disabled:opacity-60"
        >
          <ArrowRightIcon width={20} height={20} />
        </button>
      </div>
      <label className="flex items-start gap-2 text-xs leading-snug text-[#EADFC2]/75">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked);
            setMissingConsent(false);
          }}
          className="mt-0.5 h-4 w-4 shrink-0 accent-nk-gold"
        />
        {t.newsletter.consent}
      </label>
      {missingConsent && <p className="text-xs text-[#F2B8A8]">{t.newsletter.consentRequired}</p>}
      {subscribe.error && (
        <p className="text-xs text-[#F2B8A8]">{errorMessage(subscribe.error, t.errors)}</p>
      )}
    </form>
  );
}
