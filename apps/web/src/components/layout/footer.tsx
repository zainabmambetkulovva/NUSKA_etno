import type { SiteContent } from '@nuska/types';
import Link from 'next/link';

import { BackToTop } from './back-to-top';
import { InstagramIcon } from './social-icons';

import { Logo, LogoMark } from '@/components/brand/logo';
import { PhoneIcon, PinIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';

/** "996701111024" → "+996 701 111 024". */
function formatPhone(raw: string) {
  const m = raw.replace(/\D/g, '').match(/^(996)(\d{3})(\d{3})(\d{3})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : raw;
}

/**
 * Footer after the company's design: deep green with gold knot ornaments,
 * the logo and slogan, the menu, the contacts (phone, Instagram, place), a
 * gold divider, the copyright and a round "back to top" button.
 * Contacts come from the admin-managed `contacts` block.
 */
export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const contacts = await serverApiSafe<SiteContent | null>('/content/contacts', locale, null);
  const value = (key: string) => {
    const v = contacts?.data?.[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  const l = (path: string) => `/${locale}${path}`;
  const phone = value('whatsapp') ?? value('phone');
  const instagram = value('instagram')?.replace(/^@/, '');
  const address = value('address');

  const menu = [
    { href: l(''), label: t.nav.home },
    { href: l('/about'), label: t.nav.about },
    { href: l('/catalog'), label: t.nav.catalog },
    { href: l('#prices'), label: t.footer.prices },
    { href: l('/contacts'), label: t.nav.contacts },
  ];
  const heading = 'mb-4 font-sans text-lg font-semibold text-[#F6EBCF]';
  const row =
    'flex items-center gap-3 text-[15px] text-[#EADFC2]/90 transition hover:text-[#E7C77F]';

  return (
    <footer className="relative mt-16 overflow-hidden bg-[#1B2616] text-[#EADFC2]">
      {/* gold knot ornaments in the corners, as on the design */}
      <div
        className="pointer-events-none absolute -right-10 top-6 grid grid-cols-2 gap-1 opacity-25"
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <LogoMark key={i} className="h-24 w-24" />
        ))}
      </div>
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 grid grid-cols-2 gap-1 opacity-15"
        aria-hidden
      >
        {[0, 1, 2, 3].map((i) => (
          <LogoMark key={i} className="h-24 w-24" />
        ))}
      </div>

      <div className="container relative grid gap-10 pb-10 pt-14 md:grid-cols-[1.5fr_1fr_1.2fr]">
        <div>
          <Logo href={l('')} tone="light" size="lg" />
          <p className="mt-5 max-w-[17rem] text-lg leading-snug text-[#E7C77F]">
            «{t.footer.slogan}»
          </p>
        </div>

        <nav aria-label={t.footer.menu}>
          <h2 className={heading}>{t.footer.menu}</h2>
          <ul className="space-y-2.5">
            {menu.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[15px] text-[#EADFC2]/90 transition hover:text-[#E7C77F]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className={heading}>{t.footer.contacts}</h2>
          <ul className="space-y-3.5">
            {phone && (
              <li>
                <a
                  href={`https://wa.me/${phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={row}
                >
                  <PhoneIcon width={20} height={20} className="shrink-0 text-[#E2B96A]" />
                  {formatPhone(phone)}
                </a>
              </li>
            )}
            {instagram && (
              <li>
                <a
                  href={`https://www.instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${row} [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0 [&_svg]:text-[#E2B96A]`}
                >
                  <InstagramIcon />@{instagram}
                </a>
              </li>
            )}
            {address && (
              <li className="flex items-center gap-3 text-[15px] text-[#EADFC2]/90">
                <PinIcon width={20} height={20} className="shrink-0 text-[#E2B96A]" />
                {address}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="container relative pb-8">
        <div className="mx-auto flex max-w-2xl items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C9A45C]/70" />
          <LogoMark className="h-6 w-6" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C9A45C]/70" />
        </div>
        <p className="mt-5 text-center text-sm text-[#EADFC2]/70">
          © {new Date().getFullYear()} NUSKA_etno. {t.footer.rights}
        </p>
        <nav
          aria-label={t.footer.legal}
          className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-[#EADFC2]/50"
        >
          <Link href={l('/privacy')} className="hover:text-[#E7C77F]">
            {t.footer.privacy}
          </Link>
          <Link href={l('/terms')} className="hover:text-[#E7C77F]">
            {t.footer.terms}
          </Link>
          <Link href={l('/order-terms')} className="hover:text-[#E7C77F]">
            {t.footer.orderTerms}
          </Link>
        </nav>
        <BackToTop
          label={t.footer.backToTop}
          className="absolute bottom-24 right-4 md:bottom-8 md:right-24"
        />
      </div>
    </footer>
  );
}
