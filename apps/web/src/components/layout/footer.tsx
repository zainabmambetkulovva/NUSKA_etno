import type { ReactNode } from 'react';

import type { SiteContent } from '@nuska/types';
import Link from 'next/link';

import { BackToTop } from './back-to-top';

import { Logo } from '@/components/brand/logo';
import { KochkorMuyuz, OrnamentDivider } from '@/components/brand/ornament';
import { ChevronRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';

/** Social links from the admin-managed `contacts` block (only those the company filled in). */
const SOCIALS: { key: string; label: string; href: (v: string) => string }[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    href: (v) => `https://instagram.com/${v.replace(/^@/, '')}`,
  },
  { key: 'whatsapp', label: 'WhatsApp', href: (v) => `https://wa.me/${v.replace(/\D/g, '')}` },
  { key: 'telegram', label: 'Telegram', href: (v) => `https://t.me/${v.replace(/^@/, '')}` },
  {
    key: 'youtube',
    label: 'YouTube',
    href: (v) => (v.startsWith('http') ? v : `https://youtube.com/@${v.replace(/^@/, '')}`),
  },
];

type FooterLink = { href: string; label: string };

/** A column: plain list on desktop, collapsible block on phones. */
function Column({ title, children }: { title: string; children: ReactNode }) {
  const heading = 'font-sans text-sm font-semibold uppercase tracking-widest text-cream';
  return (
    <div>
      <details className="group border-b border-cream/15 py-3 md:hidden">
        <summary
          className={`flex cursor-pointer list-none items-center justify-between ${heading}`}
        >
          {title}
          <ChevronRightIcon
            width={16}
            height={16}
            className="rotate-90 transition-transform group-open:-rotate-90"
          />
        </summary>
        <div className="pt-3">{children}</div>
      </details>
      <div className="hidden md:block">
        <h2 className={`mb-4 ${heading}`}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Links({ links }: { links: FooterLink[] }) {
  return (
    <ul className="space-y-2 text-sm text-cream/80">
      {links.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            className="inline-block transition hover:translate-x-0.5 hover:text-white"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [contacts, returns] = await Promise.all([
    serverApiSafe<SiteContent | null>('/content/contacts', locale, null),
    serverApiSafe<SiteContent | null>('/content/page.returns', locale, null),
  ]);
  const value = (key: string) => {
    const v = contacts?.data?.[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  const socials = SOCIALS.flatMap((s) => {
    const v = value(s.key);
    return v ? [{ ...s, url: s.href(v) }] : [];
  });
  const contactRows = [
    { key: 'phone', label: t.footer.phone, href: (v: string) => `tel:${v.replace(/[^\d+]/g, '')}` },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: (v: string) => `https://wa.me/${v.replace(/\D/g, '')}`,
    },
    { key: 'email', label: t.footer.email, href: (v: string) => `mailto:${v}` },
    { key: 'address', label: t.footer.address },
    { key: 'hours', label: t.footer.hours },
  ].flatMap((row) => {
    const v = value(row.key);
    return v ? [{ ...row, value: v }] : [];
  });

  const l = (path: string) => `/${locale}${path}`;
  const navigation: FooterLink[] = [
    { href: l(''), label: t.nav.home },
    { href: l('/catalog'), label: t.nav.catalog },
    { href: l('/about'), label: t.nav.about },
    { href: l('/traditions'), label: t.nav.traditions },
    { href: l('/#reviews'), label: t.footer.reviews },
    { href: l('/contacts'), label: t.nav.contacts },
  ];
  const customers: FooterLink[] = [
    { href: l('/cart'), label: t.nav.cart },
    { href: l('/account/favorites'), label: t.nav.favorites },
    { href: l('/account'), label: t.nav.account },
    { href: l('/account/orders'), label: t.footer.orderHistory },
    { href: l('/pickup'), label: t.nav.pickup },
    { href: l('/faq'), label: t.nav.faq },
  ];
  const info: FooterLink[] = [
    { href: l('/terms'), label: t.footer.terms },
    { href: l('/privacy'), label: t.footer.privacy },
    { href: l('/order-terms'), label: t.footer.orderTerms },
    ...(returns ? [{ href: l('/returns'), label: t.footer.returns }] : []),
  ];

  return (
    <footer className="relative mt-16 overflow-hidden bg-brand text-cream-light">
      <OrnamentDivider className="-translate-y-1/2 text-cream [&_span]:to-cream/40" />
      <KochkorMuyuz className="pointer-events-none absolute -right-16 top-10 h-64 w-[32rem] text-cream/[0.06] motion-safe:animate-float" />
      <div className="container relative pb-8 pt-4">
        <div className="mb-10 flex flex-col gap-4 border-b border-cream/15 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Logo href={l('')} className="text-cream [&_span_span]:text-cream-dark" />
            <p className="font-serif text-2xl text-cream md:text-3xl">{t.footer.tagline}</p>
            <p className="max-w-md text-sm text-cream/75">{t.footer.about}</p>
          </div>
          <KochkorMuyuz className="hidden h-12 w-24 text-gold md:block" />
        </div>

        <div className="grid gap-x-8 md:grid-cols-3 md:gap-y-10 lg:grid-cols-5">
          <Column title={t.footer.navigation}>
            <Links links={navigation} />
          </Column>
          <Column title={t.footer.customers}>
            <Links links={customers} />
          </Column>
          <Column title={t.footer.info}>
            <Links links={info} />
          </Column>
          <Column title={t.footer.contacts}>
            {contactRows.length === 0 ? (
              <p className="text-sm text-cream/60">{t.footer.contactsSoon}</p>
            ) : (
              <dl className="space-y-2 text-sm">
                {contactRows.map((row) => (
                  <div key={row.key}>
                    <dt className="text-xs text-cream/55">{row.label}</dt>
                    <dd className="text-cream/90">
                      {row.href ? (
                        <a href={row.href(row.value)} className="hover:text-white">
                          {row.value}
                        </a>
                      ) : (
                        <span className="whitespace-pre-line">{row.value}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Column>
          <Column title={t.footer.socials}>
            {socials.length === 0 ? (
              <p className="text-sm text-cream/60">{t.footer.contactsSoon}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-full border border-cream/30 px-3 py-1.5 text-xs text-cream transition hover:-translate-y-0.5 hover:bg-cream hover:text-brand"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Column>
        </div>
      </div>
      <div className="relative border-t border-cream/15">
        <div className="container flex flex-col items-center gap-4 py-5 text-xs text-cream/60 md:flex-row md:justify-between">
          <span>
            © {new Date().getFullYear()} NUSKA_etno. {t.footer.rights}
          </span>
          <nav className="flex gap-4" aria-label={t.footer.info}>
            <Link href={l('/privacy')} className="hover:text-white">
              {t.footer.privacy}
            </Link>
            <Link href={l('/terms')} className="hover:text-white">
              {t.footer.terms}
            </Link>
          </nav>
          <BackToTop label={t.footer.backToTop} />
        </div>
      </div>
    </footer>
  );
}
