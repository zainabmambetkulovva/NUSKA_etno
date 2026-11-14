'use client';

import { useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { switchLocalePath } from './language-switcher';

import { ChevronDownIcon } from '@/components/ui/icons';
import { useMe } from '@/hooks/use-auth';
import { locales, localeNames, localeShort } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/cn';

/** "KG ⌄" pill of the mockup header: opens a small menu with both languages. */
export function LanguageMenu({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !box.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={box} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.nav.language}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-nk-ink/10 bg-white/70 px-4 text-sm font-semibold text-nk-ink shadow-sm backdrop-blur transition hover:border-nk-gold"
      >
        {localeShort[locale]}
        <ChevronDownIcon
          width={14}
          height={14}
          className={cn('transition', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-nk-beige bg-white p-1.5 shadow-lift motion-safe:animate-fade-up"
        >
          {locales.map((l) => (
            <Link
              key={l}
              role="menuitem"
              href={`${switchLocalePath(pathname, l)}${search ? `?${search}` : ''}`}
              hrefLang={l}
              lang={l}
              aria-current={l === locale ? 'true' : undefined}
              onClick={() => {
                if (me.data && me.data.locale !== l)
                  void api('/users/me', { method: 'PATCH', body: { locale: l } }).catch(
                    () => undefined
                  );
              }}
              className={cn(
                'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition',
                l === locale
                  ? 'bg-nk-sage/60 font-semibold text-nk-forest'
                  : 'text-nk-ink hover:bg-nk-cream'
              )}
            >
              {localeNames[l]}
              <span className="text-xs text-nk-muted">{localeShort[l]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
