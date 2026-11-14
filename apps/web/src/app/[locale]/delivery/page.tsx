import type { Metadata } from 'next';

import type { SiteContent } from '@nuska/types';
import Link from 'next/link';

import { BagIcon, ArrowRightIcon, PinIcon, TruckIcon } from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { resolveContacts } from '@/lib/contacts';
import { alternates, resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return {
    title: t.deliveryPage.title,
    description: t.deliveryPage.lead,
    alternates: alternates(locale, '/delivery'),
  };
}

/**
 * Delivery and payment: only what the company has confirmed — pickup, delivery
 * across Kyrgyzstan agreed in WhatsApp (no prices or dates yet) and cash on
 * receipt. Online card payment is named as coming, not offered.
 */
export default async function DeliveryPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const contacts = resolveContacts(
    await serverApiSafe<SiteContent | null>('/content/contacts', locale, null)
  );
  const page = t.deliveryPage;

  const cards = [
    {
      icon: <PinIcon width={26} height={26} />,
      title: page.pickupTitle,
      text: page.pickupText,
      link: { href: `/${locale}/pickup`, label: page.pickupLink, external: false },
    },
    {
      icon: <TruckIcon width={26} height={26} />,
      title: page.deliveryTitle,
      text: page.deliveryText,
      link: { href: contacts.whatsappUrl, label: page.deliveryLink, external: true },
    },
    {
      icon: <BagIcon width={26} height={26} />,
      title: page.paymentTitle,
      text: page.paymentText,
      note: page.paymentSoon,
    },
    {
      icon: <ArrowRightIcon width={26} height={26} className="rotate-180" />,
      title: page.returnsTitle,
      text: page.returnsText,
      link: { href: `/${locale}/returns`, label: page.returnsLink, external: false },
    },
  ];

  return (
    <div className="container py-12 lg:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-4xl text-nk-ink md:text-5xl">{page.title}</h1>
        <p className="mt-4 text-lg text-nk-muted">{page.lead}</p>
      </header>
      <ul className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
        {cards.map((card, i) => (
          <li key={card.title}>
            <Reveal delay={i * 0.06} className="h-full">
              <article className="flex h-full flex-col rounded-[1.75rem] border border-nk-beige bg-white/85 p-7 shadow-[0_20px_40px_-30px_rgba(80,60,30,0.6)]">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-nk-sage/70 text-nk-forest">
                  {card.icon}
                </span>
                <h2 className="mt-5 font-serif text-2xl text-nk-ink">{card.title}</h2>
                <p className="mt-2 flex-1 leading-relaxed text-nk-muted">{card.text}</p>
                {card.note && <p className="mt-3 text-sm text-nk-brown">{card.note}</p>}
                {card.link &&
                  (card.link.external ? (
                    <a
                      href={card.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-forest mt-6 self-start px-6 py-3 text-sm"
                    >
                      {card.link.label}
                    </a>
                  ) : (
                    <Link
                      href={card.link.href}
                      className="btn-forest mt-6 self-start px-6 py-3 text-sm"
                    >
                      {card.link.label}
                    </Link>
                  ))}
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
