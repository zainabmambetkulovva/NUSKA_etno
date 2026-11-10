import type { ReactNode } from 'react';

import type { SiteContent } from '@nuska/types';
import Link from 'next/link';

import { InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from './social-icons';

import { MountainLandscape, MountainSilhouettes } from '@/components/brand/kyrgyz-decor';
import { Logo, LogoMark } from '@/components/brand/logo';
import { ArrowRightIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';

/**
 * Footer of the brand brief: mountain landscape with cream waves on top, a
 * deep green area with three columns (logo and slogan · menu · socials)
 * divided by thin gold lines, and a bottom line with the copyright and the
 * motto. Social links come from the admin-managed `contacts` block.
 */
export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const contacts = await serverApiSafe<SiteContent | null>('/content/contacts', locale, null);
  const value = (key: string) => {
    const v = contacts?.data?.[key];
    return typeof v === 'string' && v.trim() ? v.trim() : null;
  };
  const l = (path: string) => `/${locale}${path}`;
  const instagram = value('instagram');
  const telegram = value('telegram');
  const whatsapp = value('whatsapp');
  const youtube = value('youtube');

  const menu = [
    { href: l(''), label: t.nav.home },
    { href: l('/about'), label: t.nav.about },
    { href: l('#prices'), label: t.nav.prices },
    { href: l('/contacts'), label: t.nav.contacts },
  ];
  const socials = [
    instagram && {
      label: 'Instagram',
      href: `https://www.instagram.com/${instagram.replace(/^@/, '')}`,
      icon: <InstagramIcon />,
    },
    telegram && {
      label: 'Telegram',
      href: telegram.startsWith('http') ? telegram : `https://t.me/${telegram.replace(/^@/, '')}`,
      icon: <TelegramIcon />,
    },
    whatsapp && {
      label: 'WhatsApp',
      href: `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
      icon: <WhatsAppIcon />,
    },
    youtube && {
      label: 'YouTube',
      href: youtube.startsWith('http')
        ? youtube
        : `https://youtube.com/@${youtube.replace(/^@/, '')}`,
      icon: <YouTubeIcon />,
    },
  ].filter(Boolean) as { label: string; href: string; icon: ReactNode }[];

  const heading = 'mb-5 font-serif text-xl text-[#F4E9B9]';
  const column = 'md:border-l md:border-[#D6AD62]/30 md:pl-10';

  return (
    <footer className="relative mt-16 overflow-hidden bg-[#243D2B] text-[#FAF8EF]">
      {/* landscape with cream fabric-like waves on top */}
      <div className="relative h-[clamp(150px,22vw,320px)]">
        <MountainLandscape className="absolute inset-0 h-full w-full" />
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-0 h-10 w-full sm:h-14"
          aria-hidden
        >
          <path d="M0 0 H1440 V30 C1180 70 940 10 700 38 C460 66 220 20 0 46 Z" fill="#E9DDBF" />
          <path d="M0 0 H1440 V14 C1200 48 960 0 720 22 C480 44 240 6 0 28 Z" fill="#F4E9B9" />
        </svg>
      </div>

      <div className="relative">
        <MountainSilhouettes className="absolute inset-x-0 bottom-0 h-40 w-full opacity-40" />
        <div className="container relative grid gap-10 py-12 md:grid-cols-3 md:gap-0">
          <div className="md:pr-10">
            <Logo href={l('')} tone="gold" size="lg" />
            <span
              className="mt-5 block h-px w-40 bg-gradient-to-r from-[#D6AD62] to-transparent"
              aria-hidden
            />
            <p className="mt-5 max-w-xs font-serif text-xl leading-snug text-[#F4E9B9]">
              «{t.footer.slogan}»
            </p>
          </div>

          <nav aria-label={t.footer.menu} className={column}>
            <h2 className={heading}>{t.footer.menu}</h2>
            <ul className="space-y-3">
              {menu.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-2 text-[15px] text-[#FAF8EF]/85 transition duration-300 hover:translate-x-1 hover:text-[#D6AD62]"
                  >
                    {item.label}
                    <ArrowRightIcon
                      width={14}
                      height={14}
                      className="-translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className={column}>
            <h2 className={heading}>{t.footer.socialTitle}</h2>
            <ul className="flex gap-3">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D6AD62]/70 text-[#D6AD62] opacity-90 transition duration-300 hover:scale-110 hover:opacity-100 hover:shadow-[0_0_24px_rgba(214,173,98,0.55)] [&_svg]:h-5 [&_svg]:w-5"
                  >
                    {s.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="container relative pb-8">
          <div className="flex items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D6AD62]/60" />
            <LogoMark className="h-6 w-6" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D6AD62]/60" />
          </div>
          <div className="mt-5 flex flex-col items-center gap-2 text-sm text-[#FAF8EF]/70 md:flex-row md:justify-between">
            <p>
              © {new Date().getFullYear()} NUSKA_etno. {t.footer.rights}
            </p>
            <p className="text-[#E9DDBF]">{t.footer.motto}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
