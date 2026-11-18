'use client';

import type { ReactNode } from 'react';

import Image from 'next/image';

import { LogoMark } from '@/components/brand/logo';
import { KochkorMuyuz } from '@/components/brand/ornament';
import { CheckIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';

/**
 * Sign-in / sign-up frame: on large screens a picture panel (mountains, the
 * brand and what the account gives) beside the form card; on phones the card.
 */
export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="container py-10 md:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-nk-beige bg-white shadow-[0_40px_80px_-50px_rgba(60,40,15,0.65)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <aside className="relative hidden min-h-[36rem] overflow-hidden lg:block" aria-hidden>
          <Image
            src="/images/home/cta.png"
            alt=""
            fill
            priority
            unoptimized
            className="scale-105 object-cover object-[40%_55%] motion-safe:animate-[auth-pan_22s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(26,46,32,0.15)_0%,rgba(26,46,32,0.55)_45%,rgba(22,38,27,0.92)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-9 text-[#F6EBCF]">
            <LogoMark className="h-10 w-10 motion-safe:animate-[spin_24s_linear_infinite]" />
            <p className="mt-4 font-serif text-3xl leading-tight">{t.auth.panelTitle}</p>
            <p className="mt-2 text-sm text-[#F6EBCF]/80">{t.auth.panelText}</p>
            <ul className="mt-6 space-y-2.5">
              {t.auth.perks.map((perk, i) => (
                <li
                  key={perk}
                  className="flex items-center gap-3 text-[15px] motion-safe:animate-fade-up"
                  style={{ animationDelay: `${0.2 + i * 0.12}s` }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-nk-gold/90 text-nk-night">
                    <CheckIcon width={15} height={15} />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        <div className="space-y-6 p-7 sm:p-10 motion-safe:animate-fade-up">
          <div className="space-y-3 text-center">
            <KochkorMuyuz className="mx-auto h-8 w-16 text-brand/60" animate />
            <h1 className="font-serif text-3xl font-semibold text-nk-ink">{title}</h1>
          </div>
          {children}
          {footer && (
            <div className="border-t border-cream-dark/60 pt-4 text-center text-sm text-ink-muted">
              {footer}
            </div>
          )}
        </div>
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
