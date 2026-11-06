'use client';

import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { CheckIcon } from '@/components/ui/icons';
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
      <div className="flex flex-col gap-2 sm:flex-row">
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
          className="h-12 flex-1 rounded-full border border-cream/30 bg-white/10 px-5 text-cream-light placeholder:text-cream/60 focus:border-cream focus:outline-none focus:ring-2 focus:ring-cream/30"
        />
        <Button type="submit" variant="secondary" size="lg" loading={subscribe.isPending}>
          {t.newsletter.submit}
        </Button>
      </div>
      <label className="flex items-start gap-3 text-sm text-cream/80">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-cream"
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
