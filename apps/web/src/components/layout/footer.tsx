import Link from 'next/link';

import { Logo } from '@/components/brand/logo';
import { OrnamentDivider } from '@/components/brand/ornament';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';

export function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const shop = [
    { href: `/${locale}/catalog`, label: t.nav.catalog },
    { href: `/${locale}/cart`, label: t.nav.cart },
    { href: `/${locale}/account`, label: t.nav.account },
  ];
  const info = [
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/pickup`, label: t.nav.pickup },
    { href: `/${locale}/contacts`, label: t.nav.contacts },
  ];
  return (
    <footer className="mt-16 bg-brand text-cream-light">
      <OrnamentDivider className="-translate-y-1/2 text-cream [&_span]:to-cream/40" />
      <div className="container grid gap-10 pb-10 pt-2 md:grid-cols-3">
        <div className="space-y-3">
          <Logo href={`/${locale}`} className="text-cream [&_span_span]:text-cream-dark" />
          <p className="max-w-xs text-sm text-cream/80">{t.footer.tagline}</p>
        </div>
        <nav aria-label={t.footer.shop}>
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-widest text-cream">
            {t.footer.shop}
          </h2>
          <ul className="space-y-2 text-sm text-cream/80">
            {shop.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={t.footer.info}>
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-widest text-cream">
            {t.footer.info}
          </h2>
          <ul className="space-y-2 text-sm text-cream/80">
            {info.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-cream/15 py-5 text-center text-xs text-cream/60">
        © {new Date().getFullYear()} NUSKA_etno. {t.footer.rights}
      </div>
    </footer>
  );
}
