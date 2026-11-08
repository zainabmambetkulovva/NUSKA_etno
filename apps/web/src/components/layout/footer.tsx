import type { ReactNode } from 'react';

import type { SiteContent } from '@nuska/types';
import Image from 'next/image';
import Link from 'next/link';

import { CategoryIcon } from './category-icon';
import { InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from './social-icons';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { ChevronRightIcon, PinIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';
import { cn } from '@/lib/cn';

/** Small diamond used on the dividers (as on the design reference). */
function Diamond({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={cn('h-5 w-5 text-[#7E9460]', className)} aria-hidden>
      <path d="M10 1 L13 7 L19 10 L13 13 L10 19 L7 13 L1 10 L7 7 Z" fill="currentColor" />
      <path d="M10 6 L12 10 L10 14 L8 10 Z" fill="#FDF7E5" />
    </svg>
  );
}

/** Vertical divider with a diamond in the middle (desktop only). */
function Divider() {
  return (
    <div
      className="relative hidden w-px shrink-0 self-stretch lg:block"
      style={{ backgroundColor: 'rgba(126, 148, 96, 0.45)' }}
      aria-hidden
    >
      <Diamond className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#FDF7E5]" />
    </div>
  );
}

function Heading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="mb-6 flex items-center gap-3 font-sans text-xl font-semibold text-brand-dark">
      <span className="text-[#7E9460]">{icon}</span>
      {children}
    </h2>
  );
}

const linkClass = 'group flex items-center gap-4 text-[15px] text-ink transition hover:text-brand';
const iconClass = 'h-6 w-6 shrink-0 text-[#7E9460] transition group-hover:text-brand';

/**
 * Footer after the design reference: cream background with the yurt and the
 * horse in the mountains, ornament corners, the brand, menu and contacts
 * columns separated by ornamental dividers, social icons in green circles.
 * Contacts and links come only from the admin-managed `contacts` block.
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

  const menu = [
    { href: l(''), label: t.nav.home, icon: <LeafIcon /> },
    {
      href: l('/catalog'),
      label: t.nav.catalog,
      icon: <CategoryIcon slug="bag" className={iconClass} />,
    },
    {
      href: l('/gift-builder'),
      label: t.nav.giftSets,
      icon: <CategoryIcon slug="gift" className={iconClass} />,
    },
    { href: l('/pickup'), label: t.nav.pickup, icon: <PinIcon className={iconClass} /> },
    {
      href: l('/traditions'),
      label: t.nav.traditions,
      icon: (
        <span className="flex w-6 shrink-0 justify-center">
          <KochkorMuyuz className="h-4 w-7 text-[#7E9460]" />
        </span>
      ),
    },
    { href: l('/about'), label: t.nav.about, icon: <InfoIcon /> },
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
    telegram && {
      key: 'telegram',
      label: 'Telegram',
      href: `https://t.me/${telegram.replace(/^@/, '')}`,
      icon: <TelegramIcon />,
    },
    whatsapp && {
      key: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
      icon: <WhatsAppIcon />,
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

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-[#7E9460]/30 bg-[#FDF7E5] text-ink">
      {/* Ornament corners */}
      <Image
        src="/images/footer/corner-left.webp"
        alt=""
        width={235}
        height={225}
        className="pointer-events-none absolute left-0 top-0 w-28 md:w-44"
      />
      <Image
        src="/images/footer/corner-right.webp"
        alt=""
        width={225}
        height={215}
        className="pointer-events-none absolute right-0 top-0 w-28 md:w-44"
      />
      {/* Yurt and horse in the mountains */}
      <Image
        src="/images/footer/yurt.webp"
        alt=""
        width={640}
        height={250}
        className="pointer-events-none absolute bottom-[72px] left-0 w-[85%] max-w-[640px] opacity-90 [mask-image:linear-gradient(to_right,#000_70%,transparent),linear-gradient(to_top,#000_75%,transparent)] [mask-composite:intersect] md:w-[40%] lg:w-[33%]"
      />
      <Image
        src="/images/footer/horse.webp"
        alt=""
        width={508}
        height={375}
        className="pointer-events-none absolute bottom-[72px] right-0 hidden w-[27%] max-w-[508px] [mask-image:linear-gradient(to_left,#000_75%,transparent),linear-gradient(to_top,#000_70%,transparent)] [mask-composite:intersect] lg:block"
      />

      <div className="container relative pb-40 pt-16 md:pb-56 lg:pb-24 lg:pr-[26%]">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-10">
          {/* Brand */}
          <div className="flex flex-col items-center text-center lg:w-[34%] lg:pt-2">
            <Image
              src="/images/footer/leaf.webp"
              alt=""
              width={155}
              height={100}
              className="w-24"
            />
            <Link
              href={l('')}
              className="font-serif text-5xl font-medium tracking-tight text-brand-dark md:text-6xl"
            >
              NUSKA_etno
            </Link>
            <p className="mt-3 flex items-center gap-3 text-sm font-medium text-brand-dark">
              <span className="h-px w-6 bg-brand-dark/60" aria-hidden />
              {t.footer.slogan}
              <span className="h-px w-6 bg-brand-dark/60" aria-hidden />
            </p>
          </div>

          <Divider />

          {/* Menu */}
          <nav aria-label={t.footer.menu} className="lg:min-w-[200px]">
            <Heading icon={<FlowerIcon />}>{t.footer.menu}</Heading>
            <ul className="space-y-4">
              {menu.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Divider />

          {/* Contacts */}
          <div className="lg:min-w-[260px]">
            <Heading icon={<PinIcon className="h-7 w-7" />}>{t.footer.contacts}</Heading>
            <ul className="space-y-4">
              {address && (
                <li className="flex items-center gap-4 text-[15px]">
                  <PinIcon className={iconClass} />
                  {address}
                </li>
              )}
              {whatsapp && (
                <li>
                  <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} className={linkClass}>
                    <WhatsAppIcon className={iconClass} />
                    {whatsapp.replace(/^(\+996)(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3 $4')}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className={linkClass}>
                    <PhoneIcon />
                    {phone}
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className={linkClass}>
                    <MailIcon />
                    {email}
                  </a>
                </li>
              )}
              {orders.map((o) => (
                <li key={o.href}>
                  <a href={o.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    <ChevronRightIcon className={iconClass} />
                    {o.label}
                  </a>
                </li>
              ))}
              {!address && !whatsapp && !phone && !email && orders.length === 0 && (
                <li className="text-sm text-ink-soft">{t.footer.contactsSoon}</li>
              )}
            </ul>
            {socials.length > 0 && (
              <ul className="mt-7 flex gap-3" aria-label={t.footer.socialTitle}>
                {socials.map((s) => (
                  <li key={s.key}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7E9460] text-[#FDF7E5] shadow-soft transition hover:-translate-y-0.5 hover:bg-brand"
                    >
                      {s.icon}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Bottom line: ornament — copyright — ornament */}
      <div className="relative border-t border-[#7E9460]/40 bg-[#FDF7E5]">
        <div className="container flex flex-col items-center gap-3 py-5 text-sm text-ink-muted md:flex-row md:gap-4">
          <span className="hidden h-px flex-1 bg-[#7E9460]/40 md:block" aria-hidden />
          <Diamond className="hidden md:block" />
          <span className="text-center">
            © {new Date().getFullYear()} NUSKA_etno. {t.footer.rights}
          </span>
          <Diamond className="hidden md:block" />
          <span className="hidden h-px flex-1 bg-[#7E9460]/40 md:block" aria-hidden />
        </div>
        <nav
          className="container flex flex-wrap justify-center gap-x-5 gap-y-1 pb-5 text-xs text-ink-soft"
          aria-label={t.footer.info}
        >
          <Link href={l('/privacy')} className="hover:text-brand">
            {t.footer.privacy}
          </Link>
          <Link href={l('/terms')} className="hover:text-brand">
            {t.footer.terms}
          </Link>
          <Link href={l('/order-terms')} className="hover:text-brand">
            {t.footer.orderTerms}
          </Link>
          {returns && (
            <Link href={l('/returns')} className="hover:text-brand">
              {t.footer.returns}
            </Link>
          )}
          <Link href={l('/faq')} className="hover:text-brand">
            {t.nav.faq}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
      <path
        d="M12 21c-1-4-1-8 2-12 2-2.5 5-4 8-4-.2 4-1.6 7.2-4 9.3-1.8 1.6-4 2.6-6 2.7Z"
        opacity=".55"
      />
      <path d="M12 21c0-3.5-1.2-7-4.5-9.5C5.6 10 3.6 9.4 2 9.5c.4 3.3 1.8 6 4 7.8 1.7 1.4 3.8 2.2 6 2.4V21Z" />
    </svg>
  );
}
function InfoIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={iconClass}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" strokeLinecap="round" />
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className={iconClass} fill="currentColor" aria-hidden>
      <path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className={iconClass}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </svg>
  );
}
function FlowerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      aria-hidden
    >
      <path d="M12 3c2 2 2 4 0 6-2-2-2-4 0-6ZM12 21c2-2 2-4 0-6-2 2-2 4 0 6ZM3 12c2-2 4-2 6 0-2 2-4 2-6 0ZM21 12c-2-2-4-2-6 0 2 2 4 2 6 0Z" />
      <path d="M12 10.5 13.5 12 12 13.5 10.5 12Z" fill="currentColor" />
    </svg>
  );
}
