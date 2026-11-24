import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import type { SiteContent } from '@nuska/types';

import {
  InstagramIcon,
  TelegramIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from '@/components/layout/social-icons';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { cn } from '@/lib/cn';
import { resolveContacts } from '@/lib/contacts';
import { alternates, resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return { title: t.nav.contacts, alternates: alternates(locale, '/contacts') };
}

/**
 * Contacts: the company's text and its channels as cards (WhatsApp, Instagram,
 * Telegram, YouTube; the company works by delivery only, so there is no
 * street address). Data comes from
 * the admin `contacts` block; the company's own values are the fallback.
 */
export default async function ContactsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const content = await serverApiSafe<SiteContent | null>('/content/contacts', locale, null);
  const contacts = resolveContacts(content);
  const page = t.contactsPage;

  const cards: {
    icon: ReactNode;
    label: string;
    value: string;
    href: string | null;
    action: string;
  }[] = [
    {
      icon: <WhatsAppIcon />,
      label: 'WhatsApp',
      value: contacts.phone,
      href: contacts.whatsappUrl,
      action: page.write,
    },
    {
      icon: <InstagramIcon />,
      label: 'Instagram',
      value: `@${contacts.instagram}`,
      href: contacts.instagramUrl,
      action: page.open,
    },
    {
      icon: <TelegramIcon />,
      label: 'Telegram',
      value: contacts.telegramUrl.replace('https://t.me/', '@'),
      href: contacts.telegramUrl,
      action: page.write,
    },
    {
      icon: <YouTubeIcon />,
      label: 'YouTube',
      value: 'NUSKA etno',
      href: contacts.youtubeUrl,
      action: page.open,
    },
  ];

  return (
    <div className="container py-12 lg:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl text-nk-ink md:text-5xl">
          {content?.title || t.nav.contacts}
        </h1>
        <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-nk-muted">
          {content?.body || page.lead}
        </p>
      </header>

      {/* cards in rows of up to three, the last row centred */}
      <ul className="mx-auto mt-12 flex max-w-5xl flex-wrap justify-center gap-4">
        {cards.map((card, i) => (
          <li
            key={card.label}
            className={cn(
              'w-full min-w-0 sm:w-[calc(50%-0.5rem)]',
              cards.length === 4 ? 'lg:w-[calc(50%-0.5rem)]' : 'lg:w-[calc((100%-2rem)/3)]'
            )}
          >
            <Reveal delay={i * 0.05} className="h-full">
              <div className="card-hover flex h-full items-center gap-4 rounded-[1.5rem] border border-nk-beige bg-white/85 p-5 shadow-[0_18px_36px_-28px_rgba(80,60,30,0.6)]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-nk-sage/70 text-nk-forest [&_svg]:h-6 [&_svg]:w-6">
                  {card.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-nk-muted">{card.label}</p>
                  <p className="break-words text-[15px] font-medium leading-snug text-nk-ink">
                    {card.value}
                  </p>
                </div>
                {card.href && (
                  <a
                    href={card.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-full bg-nk-forest px-4 py-2 text-xs font-semibold text-white transition hover:bg-nk-deep"
                  >
                    {card.action}
                  </a>
                )}
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
