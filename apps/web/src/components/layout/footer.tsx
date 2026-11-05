import type { SiteContent } from '@nuska/types';
import Link from 'next/link';

import { Logo } from '@/components/brand/logo';
import { OrnamentDivider } from '@/components/brand/ornament';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';

/** Social links from the admin-managed `contacts` block (data: whatsapp, instagram, telegram). */
const SOCIALS: { key: string; label: string; href: (v: string) => string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', href: (v) => `https://wa.me/${v.replace(/\D/g, '')}` },
  {
    key: 'instagram',
    label: 'Instagram',
    href: (v) => `https://instagram.com/${v.replace(/^@/, '')}`,
  },
  { key: 'telegram', label: 'Telegram', href: (v) => `https://t.me/${v.replace(/^@/, '')}` },
];

export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const contacts = await serverApiSafe<SiteContent | null>('/content/contacts', locale, null);
  const socials = SOCIALS.flatMap((s) => {
    const value = contacts?.data?.[s.key];
    return typeof value === 'string' && value ? [{ ...s, url: s.href(value) }] : [];
  });
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
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-2">
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full border border-cream/30 px-3 py-1 text-xs text-cream hover:bg-cream hover:text-brand"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
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
