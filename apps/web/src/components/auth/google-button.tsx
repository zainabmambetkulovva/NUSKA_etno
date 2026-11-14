'use client';

import { useQuery } from '@tanstack/react-query';

import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';

/** "Continue with Google": shown only when Google sign-in is configured on the server. */
export function GoogleButton({ next }: { next: string }) {
  const { t, locale } = useI18n();
  const providers = useQuery({
    queryKey: ['auth-providers'],
    queryFn: () => api<{ google: boolean }>('/auth/providers'),
    staleTime: 10 * 60_000,
  });
  if (!providers.data?.google) return null;
  const href = `/api/auth/google?locale=${locale}&next=${encodeURIComponent(next)}`;
  return (
    <div className="space-y-4">
      <a
        href={href}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-cream-dark bg-white text-sm font-medium text-ink shadow-soft transition hover:border-brand"
      >
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
          <path
            fill="#EA4335"
            d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.4 17.7 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z"
          />
          <path
            fill="#FBBC05"
            d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.4 2.2-6.3 0-11.6-4-13.5-9.6l-7.8 6C6.6 42.6 14.6 48 24 48z"
          />
        </svg>
        {t.auth.google}
      </a>
      <div className="flex items-center gap-3 text-xs text-ink-soft">
        <span className="h-px flex-1 bg-cream-dark" />
        {t.auth.or}
        <span className="h-px flex-1 bg-cream-dark" />
      </div>
    </div>
  );
}
