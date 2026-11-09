'use client';

import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { ArrowRightIcon, CheckIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Newsletter subscription with explicit consent (double opt-in on the server). */
export function NewsletterForm() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscribe = useMutation({
    mutationFn: () =>
      api('/newsletter/subscribe', { method: 'POST', body: { email, consent, locale } }),
    onError: (e) => setError(errorMessage(e, t.errors)),
  });

  if (subscribe.isSuccess) {
    return (
      <p className="flex items-center gap-3 rounded-xl bg-white/10 p-4 text-cream" role="status">
        <CheckIcon className="shrink-0" /> {t.newsletter.done}
      </p>
    );
  }

  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!EMAIL.test(email.trim())) return setError(t.validation.email);
        if (!consent) return setError(t.newsletter.consentRequired);
        setError(null);
        subscribe.mutate();
      }}
    >
      <div className="flex flex-col gap-2 rounded-[1.6rem] sm:flex-row sm:gap-0 sm:rounded-full sm:bg-white sm:p-1">
        <label className="sr-only" htmlFor="newsletter-email">
          {t.newsletter.email}
        </label>
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.newsletter.email}
          aria-invalid={Boolean(error) || undefined}
          className="h-12 min-w-0 flex-1 rounded-full bg-white px-5 text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-honey/60 sm:h-11"
        />
        <button type="submit" className="btn-gold" disabled={subscribe.isPending}>
          {t.newsletter.submit}
          <ArrowRightIcon width={16} height={16} />
        </button>
      </div>
      <label className="flex items-start gap-3 text-xs text-cream-light/75">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-honey"
        />
        {t.newsletter.consent}
      </label>
      {error && (
        <p className="text-sm text-cream" role="alert">
          <KochkorMuyuz className="mr-1 inline h-3 w-6 text-gold" /> {error}
        </p>
      )}
    </form>
  );
}
