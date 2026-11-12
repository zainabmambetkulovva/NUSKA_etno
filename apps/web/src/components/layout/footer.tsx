import type { SiteContent } from '@nuska/types';
import Link from 'next/link';

import { InstagramIcon, WhatsAppIcon, YouTubeIcon } from './social-icons';

import { Logo, LogoMark } from '@/components/brand/logo';
import { PhoneIcon, PinIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';
import { resolveContacts } from '@/lib/contacts';

/**
 * Footer: deep green with a fine gold line and a faint knot ornament. Left the
 * logo, the slogan and round social buttons; in the middle the menu; on the right
 * the contacts (WhatsApp, Instagram, YouTube, place) as small cards. Contacts come
 * from the admin-managed `contacts` block, with the company's own values as fallback.
 * The "scroll to top" button is a fixed button above the AI button (see layout).
 */
export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const content = await serverApiSafe<SiteContent | null>('/content/contacts', locale, null);
  const contacts = resolveContacts(content);
  const l = (path: string) => `/${locale}${path}`;

  const menu = [
    { href: l(''), label: t.nav.home },
    { href: l('/about'), label: t.nav.about },
    { href: l('/catalog'), label: t.nav.catalog },
    { href: l('#prices'), label: t.footer.prices },
    { href: l('/contacts'), label: t.nav.contacts },
  ];
  const socials = [
    { href: contacts.instagramUrl, label: 'Instagram', icon: <InstagramIcon /> },
    { href: contacts.whatsappUrl, label: 'WhatsApp', icon: <WhatsAppIcon /> },
    { href: contacts.youtubeUrl, label: 'YouTube', icon: <YouTubeIcon /> },
  ];
  const rows = [
    { href: contacts.whatsappUrl, label: 'WhatsApp', value: contacts.phone, icon: <PhoneIcon /> },
    {
      href: contacts.instagramUrl,
      label: 'Instagram',
      value: `@${contacts.instagram}`,
      icon: <InstagramIcon />,
    },
    { href: contacts.youtubeUrl, label: 'YouTube', value: 'NUSKA etno', icon: <YouTubeIcon /> },
    { href: null, label: t.footer.place, value: contacts.address, icon: <PinIcon /> },
  ];
  const heading = 'mb-5 font-serif text-xl text-[#F6EBCF]';
  const tile =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C9A45C]/30 bg-white/5 text-[#E2B96A] transition duration-300 [&_svg]:h-5 [&_svg]:w-5';

  return (
    <footer className="relative mt-16 overflow-hidden bg-[#16210F] text-[#EADFC2]">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A45C] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 -top-10 h-80 w-80 rotate-12 opacity-[0.07]"
        aria-hidden
      >
        <LogoMark className="h-full w-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(74,110,58,0.35),transparent_55%)]"
        aria-hidden
      />

      <div className="container relative grid gap-10 pb-10 pt-14 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_1.3fr] lg:gap-14">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo href={l('')} tone="light" size="lg" />
          <p className="mt-5 max-w-[19rem] font-serif text-xl leading-snug text-[#E7C77F]">
            «{t.footer.slogan}»
          </p>
          <p className="mb-3 mt-7 text-xs font-medium uppercase tracking-[0.25em] text-[#EADFC2]/60">
            {t.footer.follow}
          </p>
          <ul className="flex gap-3">
            {socials.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  className={`${tile} h-12 w-12 rounded-full hover:-translate-y-1 hover:border-[#E7C77F] hover:bg-[#E7C77F] hover:text-[#27391F] hover:shadow-[0_10px_24px_-8px_rgba(231,199,127,0.8)]`}
                >
                  {item.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label={t.footer.menu}>
          <h2 className={heading}>{t.footer.menu}</h2>
          <ul className="space-y-3">
            {menu.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group inline-flex items-center gap-2 text-[15px] text-[#EADFC2]/90 transition hover:text-[#E7C77F]"
                >
                  <span
                    className="h-px w-3 bg-[#C9A45C]/60 transition-all duration-300 group-hover:w-6 group-hover:bg-[#E7C77F]"
                    aria-hidden
                  />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={heading}>{t.footer.contacts}</h2>
          <ul className="space-y-3">
            {rows.map((row) => {
              const body = (
                <>
                  <span className={`${tile} ${row.href ? 'group-hover:bg-[#E7C77F]/15' : ''}`}>
                    {row.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-[#EADFC2]/55">{row.label}</span>
                    <span className="block truncate text-[15px] text-[#F6EBCF]">{row.value}</span>
                  </span>
                </>
              );
              return (
                <li key={row.label}>
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 transition hover:translate-x-1"
                    >
                      {body}
                    </a>
                  ) : (
                    <div className="flex items-center gap-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="container relative pb-32">
        <div className="mx-auto flex max-w-2xl items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A45C]/70" />
          <LogoMark className="h-6 w-6" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A45C]/70" />
        </div>
        <div className="mt-5 flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:text-left">
          <p className="text-sm text-[#EADFC2]/70">
            © {new Date().getFullYear()} NUSKA_etno. {t.footer.rights}
          </p>
          <nav
            aria-label={t.footer.legal}
            className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-[#EADFC2]/55"
          >
            <Link href={l('/privacy')} className="transition hover:text-[#E7C77F]">
              {t.footer.privacy}
            </Link>
            <Link href={l('/terms')} className="transition hover:text-[#E7C77F]">
              {t.footer.terms}
            </Link>
            <Link href={l('/order-terms')} className="transition hover:text-[#E7C77F]">
              {t.footer.orderTerms}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
