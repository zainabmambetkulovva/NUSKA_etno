import type { ReactNode } from 'react';

import type { SiteContent } from '@nuska/types';
import Link from 'next/link';

import { LanguageSwitcher } from './language-switcher';
import { InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from './social-icons';

import { MountainSilhouettes, OrnamentBand, OrnamentCorner } from '@/components/brand/kyrgyz-decor';
import { Logo } from '@/components/brand/logo';
import { ChevronRightIcon, MailIcon, PhoneIcon, PinIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';

function Heading({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 font-sans text-base font-semibold text-cream-light">{children}</h2>;
}

const linkClass = 'text-sm text-cream-light/80 transition hover:text-honey-light';
const contactClass =
  'group flex items-center gap-3 text-sm text-cream-light/85 transition hover:text-honey-light';

/**
 * Footer of the design: deep green with mountain silhouettes and a band of
 * ram's horns, the gold medallion, navigation, contacts with the order links,
 * gold social icons and the language switch. Contacts and links come only
 * from the admin-managed `contacts` block.
 */
export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [contacts, returns] = await Promise.all([
    serverApiSafe<SiteContent | null>('/content/contacts', locale, null),
    serverApiSafe<SiteContent | null>('/content/page.returns', locale, null),
  ]);
  const value = (key: string) => {
    const v = contacts?.data?.[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  const url = (key: string) => {
    const v = value(key);
    return v && /^https?:\/\//.test(v) ? v : null;
  };
  const l = (path: string) => `/${locale}${path}`;

  const whatsapp = value('whatsapp');
  const telegram = value('telegram');
  const instagram = value('instagram');
  const youtube = value('youtube');
  const phone = value('phone');
  const email = value('email');
  const address = value('address');

  const nav = [
    { href: l(''), label: t.nav.home },
    { href: l('/catalog'), label: t.nav.catalog },
    { href: l('/gift-builder'), label: t.nav.giftSets },
    { href: l('/about'), label: t.nav.about },
    { href: l('/traditions'), label: t.nav.traditions },
    { href: l('/pickup'), label: t.nav.pickup },
    { href: l('#reviews'), label: t.nav.reviews },
    { href: l('/contacts'), label: t.nav.contacts },
  ];
  const orders = [
    url('wholesale') && { href: url('wholesale')!, label: t.footer.wholesale },
    url('retail') && { href: url('retail')!, label: t.footer.retail },
    telegram && { href: `https://t.me/${telegram.replace(/^@/, '')}`, label: t.footer.catalogTg },
  ].filter(Boolean) as { href: string; label: string }[];
  const socials = [
    instagram && {
      key: 'instagram',
      label: 'Instagram',
      href: `https://www.instagram.com/${instagram.replace(/^@/, '')}`,
      icon: <InstagramIcon />,
    },
    whatsapp && {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
      icon: <WhatsAppIcon />,
    },
    telegram && {
      key: 'telegram',
      label: 'Telegram',
      href: `https://t.me/${telegram.replace(/^@/, '')}`,
      icon: <TelegramIcon />,
    },
    youtube && {
      key: 'youtube',
      label: 'YouTube',
      href: youtube.startsWith('http')
        ? youtube
        : `https://youtube.com/@${youtube.replace(/^@/, '')}`,
      icon: <YouTubeIcon />,
    },
  ].filter(Boolean) as { key: string; label: string; href: string; icon: ReactNode }[];
  const hasContacts = Boolean(whatsapp || phone || email || address || orders.length);

  return (
    <footer className="relative mt-16 overflow-hidden bg-forest-dark text-cream-light">
      <div className="h-px bg-gradient-to-r from-transparent via-honey/60 to-transparent" />
      <MountainSilhouettes className="absolute inset-x-0 bottom-10 h-[220px] w-full opacity-90" />
      <OrnamentCorner className="absolute -right-4 -top-4 h-28 w-28 -scale-x-100 text-honey/35" />

      <div className="container relative grid gap-10 pb-10 pt-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1.3fr_auto] lg:gap-12">
        <div className="space-y-4">
          <Logo href={l('')} tone="gold" size="lg" />
          <p className="max-w-[16rem] text-sm leading-relaxed text-honey-light/85">
            {t.footer.slogan}
          </p>
        </div>

        <nav aria-label={t.footer.navigation} className="lg:border-l lg:border-honey/20 lg:pl-10">
          <Heading>{t.footer.navigation}</Heading>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="lg:border-l lg:border-honey/20 lg:pl-10">
          <Heading>{t.footer.contacts}</Heading>
          {hasContacts ? (
            <ul className="space-y-2.5">
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} className={contactClass}>
                    <PhoneIcon width={18} height={18} className="shrink-0 text-honey" />
                    {formatPhone(whatsapp)}
                  </a>
                </li>
              )}
              {phone && phone !== whatsapp && (
                <li>
                  <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className={contactClass}>
                    <PhoneIcon width={18} height={18} className="shrink-0 text-honey" />
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className={contactClass}>
                    <MailIcon width={18} height={18} className="shrink-0 text-honey" />
                    {email}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex items-center gap-3 text-sm text-cream-light/85">
                  <PinIcon width={18} height={18} className="shrink-0 text-honey" />
                  {address}
                </li>
              )}
              {orders.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={contactClass}
                  >
                    <ChevronRightIcon width={18} height={18} className="shrink-0 text-honey" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-cream-light/60">{t.footer.contactsSoon}</p>
          )}
          {socials.length > 0 && (
            <ul className="mt-5 flex gap-3" aria-label={t.footer.socialTitle}>
              {socials.map((s) => (
                <li key={s.key}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-honey/60 text-honey transition hover:-translate-y-0.5 hover:bg-honey hover:text-forest-dark [&_svg]:h-5 [&_svg]:w-5"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:border-l lg:border-honey/20 lg:pl-10">
          <Heading>{t.nav.language}</Heading>
          <LanguageSwitcher variant="dark" className="text-sm [&_a]:px-3.5 [&_a]:py-1.5" />
        </div>
      </div>

      <div className="relative">
        <OrnamentBand />
        <div className="bg-forest-dark/80">
          <div className="container flex flex-col items-center gap-3 py-5 text-xs text-cream-light/70 lg:flex-row lg:justify-between">
            <p>
              © {new Date().getFullYear()} NUSKA_etno. {t.footer.rights}
            </p>
            <nav
              aria-label={t.footer.info}
              className="flex flex-wrap justify-center gap-x-5 gap-y-1"
            >
              <Link href={l('/privacy')} className="hover:text-honey-light">
                {t.footer.privacy}
              </Link>
              <Link href={l('/terms')} className="hover:text-honey-light">
                {t.footer.terms}
              </Link>
              <Link href={l('/order-terms')} className="hover:text-honey-light">
                {t.footer.orderTerms}
              </Link>
              {returns && (
                <Link href={l('/returns')} className="hover:text-honey-light">
                  {t.footer.returns}
                </Link>
              )}
              <Link href={l('/faq')} className="hover:text-honey-light">
                {t.nav.faq}
              </Link>
            </nav>
            <p className="font-script text-lg text-honey-light">
              {t.home.withLove} <span className="text-ruby">♥</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** "996701111024" → "+996 701 111 024". */
function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, '');
  const m = digits.match(/^(996)(\d{3})(\d{3})(\d{3})$/);
  return m ? `+${m[1]} ${m[2]} ${m[3]} ${m[4]}` : raw;
}
