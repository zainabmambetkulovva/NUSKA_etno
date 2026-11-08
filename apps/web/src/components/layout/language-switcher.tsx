'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { useMe } from '@/hooks/use-auth';
import { locales, localeNames, localeShort, type Locale } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/cn';

export function switchLocalePath(pathname: string, locale: Locale) {
  const parts = pathname.split('/');
  parts[1] = locale;
  return parts.join('/') || `/${locale}`;
}

/** KG / RU switch (TZ §5.2). The choice is kept in a cookie and, for signed-in users, in the profile. */
export function LanguageSwitcher({
  className,
  variant = 'pill',
}: {
  className?: string;
  /** "plain": text-only KG RU, as in the header. */
  variant?: 'pill' | 'plain';
}) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const me = useMe();

  return (
    <div
      className={cn(
        variant === 'pill'
          ? 'inline-flex rounded-full border border-cream-dark bg-white p-0.5 text-xs font-semibold'
          : 'inline-flex gap-1 text-sm font-semibold',
        className
      )}
      role="group"
      aria-label={t.nav.language}
    >
      {locales.map((l) => (
        <Link
          key={l}
          href={`${switchLocalePath(pathname, l)}${search ? `?${search}` : ''}`}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? 'true' : undefined}
          title={localeNames[l]}
          onClick={() => {
            if (me.data && me.data.locale !== l)
              void api('/users/me', { method: 'PATCH', body: { locale: l } }).catch(
                () => undefined
              );
          }}
          className={cn(
            'rounded-full px-2.5 py-1 transition',
            variant === 'pill'
              ? l === locale
                ? 'bg-brand text-cream-light'
                : 'text-ink-muted hover:text-brand'
              : l === locale
                ? 'text-ink'
                : 'text-ink-soft hover:text-brand'
          )}
        >
          {localeShort[l]}
        </Link>
      ))}
    </div>
  );
}
