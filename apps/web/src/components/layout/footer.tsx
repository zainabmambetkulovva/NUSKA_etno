import type { CategoryNode, SiteContent } from '@nuska/types';
import Link from 'next/link';

import { NewsletterForm } from './newsletter-form';
import { InstagramIcon, TelegramIcon, WhatsAppIcon, YouTubeIcon } from './social-icons';

import { Logo, LogoMark } from '@/components/brand/logo';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';
import { resolveContacts } from '@/lib/contacts';

/** Line drawing of a yurt in gold (bottom right of the mockup footer). */
function YurtLine({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" fill="none" className={className} aria-hidden>
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 96h128" />
        <path d="M28 96V62c18-6 34-9 52-9s34 3 52 9v34" />
        <path d="M28 62c10-22 30-38 52-44 22 6 42 22 52 44" />
        <path d="M66 22c4-3 9-4 14-4s10 1 14 4" />
        <path d="M44 56 62 24M116 56 98 24M80 18v35" opacity=".7" />
        <path d="M68 96V72c0-4 5-7 12-7s12 3 12 7v24" />
        <path d="M28 76c34 6 70 6 104 0" opacity=".7" />
        <path d="M34 84l6-6 6 6 6-6 6 6M102 84l6-6 6 6 6-6 6 6" opacity=".6" />
      </g>
    </svg>
  );
}

/**
 * Dark forest-green footer of the mockup: a mountain ridge on top; the logo,
 * tagline and social buttons; Catalog (real categories) · Company · Help;
 * the newsletter; legal links at the bottom. Contacts come from the admin
 * `contacts` block with the company's own values as fallback. The "back to
 * top" button is a fixed button above the AI button (see layout).
 */
export async function Footer({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [content, categories] = await Promise.all([
    serverApiSafe<SiteContent | null>('/content/contacts', locale, null),
    serverApiSafe<CategoryNode[]>('/categories', locale, []),
  ]);
  const contacts = resolveContacts(content);
  const l = (path: string) => `/${locale}${path}`;

  const socials = [
    { href: contacts.instagramUrl, label: 'Instagram', icon: <InstagramIcon /> },
    { href: contacts.youtubeUrl, label: 'YouTube', icon: <YouTubeIcon /> },
    { href: contacts.whatsappUrl, label: 'WhatsApp', icon: <WhatsAppIcon /> },
    { href: contacts.telegramUrl, label: 'Telegram', icon: <TelegramIcon /> },
  ];
  const columns = [
    {
      title: t.footer.catalog,
      links: [
        { href: l('/catalog'), label: t.nav.allProducts },
        ...categories.map((c) => ({ href: l(`/catalog/${c.slug}`), label: c.name })),
      ],
    },
    {
      title: t.footer.company,
      links: [
        { href: l('/about'), label: t.nav.brand },
        { href: l('#brand'), label: t.footer.values },
        { href: l('/traditions'), label: t.nav.traditions },
        { href: l('/reviews'), label: t.nav.reviews },
      ],
    },
    {
      title: t.footer.help,
      links: [
        { href: l('/delivery'), label: t.nav.delivery },
        { href: l('/returns'), label: t.footer.returnsShort },
        { href: l('/faq'), label: t.nav.faq },
        { href: l('/contacts'), label: t.nav.contacts },
      ],
    },
  ];

  return (
    <footer className="relative mt-24 bg-nk-night text-[#EADFC2]">
      {/* mountain ridge rising from the cream page into the green footer */}
      <svg
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        className="absolute inset-x-0 -top-[59px] h-[60px] w-full text-nk-night"
        aria-hidden
      >
        <path
          d="M0 90V62l120-26 90 18 130-40 110 34 90-14 140 30 120-36 100 22 140-44 110 30 120-20 150 34V90Z"
          fill="currentColor"
        />
        <path
          d="M0 62l120-26 90 18 130-40 110 34 90-14 140 30 120-36 100 22 140-44 110 30 120-20 150 34"
          stroke="#C7A66A"
          strokeOpacity=".55"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden bg-[radial-gradient(ellipse_at_10%_0%,rgba(83,122,74,0.35),transparent_55%)]"
        aria-hidden
      />
      <YurtLine className="pointer-events-none absolute bottom-16 right-6 hidden h-28 w-40 text-nk-gold/45 lg:block" />

      <div className="container relative grid gap-10 pb-10 pt-14 md:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1.45fr] lg:gap-8">
        <div className="md:col-span-2 lg:col-span-1">
          <Logo href={l('')} tone="gold" />
          <p className="mt-4 font-serif text-lg text-[#F3EAD3]">{t.footer.tagline}</p>
          <ul className="mt-6 flex gap-2.5" aria-label={t.footer.follow}>
            {socials.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  title={item.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-nk-gold/35 text-[#E9D3A3] transition duration-300 hover:-translate-y-1 hover:border-nk-gold hover:bg-nk-gold hover:text-nk-night [&_svg]:h-[18px] [&_svg]:w-[18px]"
                >
                  {item.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-4 font-sans text-base font-semibold text-white">{column.title}</h2>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#EADFC2]/85 transition hover:text-nk-gold"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="md:col-span-2 lg:col-span-1">
          <h2 className="mb-4 font-sans text-base font-semibold text-white">
            {t.newsletter.title}
          </h2>
          <NewsletterForm />
        </div>
      </div>

      <div className="container relative pb-28">
        <div className="flex items-center gap-4" aria-hidden>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-nk-gold/50" />
          <LogoMark className="h-5 w-5" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-nk-gold/50" />
        </div>
        <div className="mt-5 flex flex-col items-center gap-3 text-center text-xs text-[#EADFC2]/65 md:flex-row md:justify-between md:text-left">
          <p>
            © {new Date().getFullYear()} NUSKA_etno. {t.footer.rights}
          </p>
          <nav
            aria-label={t.footer.legal}
            className="flex flex-wrap justify-center gap-x-5 gap-y-1"
          >
            <Link
              href={l('/privacy')}
              className="underline-offset-4 transition hover:text-nk-gold hover:underline"
            >
              {t.footer.privacy}
            </Link>
            <Link
              href={l('/terms')}
              className="underline-offset-4 transition hover:text-nk-gold hover:underline"
            >
              {t.footer.terms}
            </Link>
            <Link
              href={l('/order-terms')}
              className="underline-offset-4 transition hover:text-nk-gold hover:underline"
            >
              {t.footer.orderTerms}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
