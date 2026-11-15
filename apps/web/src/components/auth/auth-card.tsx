import type { ReactNode } from 'react';

import { KochkorMuyuz } from '@/components/brand/ornament';

export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container flex justify-center py-12 md:py-20">
      <div className="card w-full max-w-md space-y-6 p-8">
        <div className="space-y-3 text-center">
          <KochkorMuyuz className="mx-auto h-8 w-16 text-brand/60" />
          <h1 className="text-3xl font-semibold">{title}</h1>
        </div>
        {children}
        {footer && (
          <div className="border-t border-cream-dark/60 pt-4 text-center text-sm text-ink-muted">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/** Only same-site paths for the given locale are accepted as redirect targets (no open redirects). */
export function safeNext(next: string | null, locale: string, fallback: string) {
  if (next && next.startsWith(`/${locale}/`) && !next.startsWith('//') && !next.includes('\\'))
    return next;
  return fallback;
}
