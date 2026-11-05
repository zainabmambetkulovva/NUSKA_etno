import type { PickupLocation, SiteContent } from '@nuska/types';

import { KochkorMuyuz, OrnamentDivider } from '@/components/brand/ornament';
import { ClockIcon, PinIcon } from '@/components/ui/icons';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { serverApiSafe } from '@/lib/api/server';

const CONTACT_LABELS: Record<string, string> = {
  phone: '☎',
  email: '✉',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  address: '⌂',
};

function contactHref(key: string, value: string) {
  if (key === 'phone' || key === 'whatsapp')
    return key === 'phone'
      ? `tel:${value.replace(/[^\d+]/g, '')}`
      : `https://wa.me/${value.replace(/\D/g, '')}`;
  if (key === 'email') return `mailto:${value}`;
  if (key === 'instagram') return `https://instagram.com/${value.replace(/^@/, '')}`;
  if (key === 'telegram') return `https://t.me/${value.replace(/^@/, '')}`;
  return null;
}

/**
 * Pages whose text is managed in the admin panel (TZ §14). Until the
 * company fills a block, a neutral "coming soon" note is shown — no invented data.
 */
export async function ContentPage({
  locale,
  t,
  contentKey,
  title,
  fallbackBody,
  showPickup,
}: {
  locale: Locale;
  t: Dictionary;
  contentKey: string;
  title: string;
  fallbackBody?: string;
  showPickup?: boolean;
}) {
  const [content, pickup] = await Promise.all([
    serverApiSafe<SiteContent | null>(`/content/${contentKey}`, locale, null),
    showPickup
      ? serverApiSafe<PickupLocation[]>('/pickup-locations', locale, [])
      : Promise.resolve([]),
  ]);
  const body = content?.body || fallbackBody;
  const contacts = Object.entries(content?.data ?? {}).filter(
    ([, v]) => typeof v === 'string' && v
  ) as [string, string][];

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-10 space-y-4 text-center">
        <KochkorMuyuz className="mx-auto h-10 w-20 text-brand/60" animate />
        <h1 className="text-4xl font-semibold md:text-5xl">{content?.title || title}</h1>
      </div>
      {body ? (
        <div className="whitespace-pre-line text-lg leading-relaxed text-ink-muted">{body}</div>
      ) : (
        <p className="text-center text-ink-soft">{t.product.noInfo}</p>
      )}

      {contacts.length > 0 && (
        <ul className="mx-auto mt-10 grid max-w-xl gap-3">
          {contacts.map(([key, value]) => {
            const href = contactHref(key, value);
            return (
              <li key={key} className="card flex items-center gap-3 px-5 py-4">
                <span className="w-24 shrink-0 text-sm text-ink-soft">
                  {CONTACT_LABELS[key] ?? key}
                </span>
                {href ? (
                  <a
                    href={href}
                    className="font-medium text-brand hover:underline"
                    rel="noopener noreferrer"
                    target={href.startsWith('http') ? '_blank' : undefined}
                  >
                    {value}
                  </a>
                ) : (
                  <span>{value}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {showPickup && (
        <>
          <OrnamentDivider className="my-12" />
          {pickup.length === 0 ? (
            <p className="text-center text-ink-soft">{t.home.pickupEmpty}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pickup.map((point) => (
                <div key={point.id} className="card space-y-2 p-6">
                  <h2 className="flex items-center gap-2 font-serif text-xl text-brand">
                    <PinIcon /> {point.name}
                  </h2>
                  <p>{point.address}</p>
                  {point.description && (
                    <p className="text-sm text-ink-muted">{point.description}</p>
                  )}
                  {point.openingHours && (
                    <p className="flex items-center gap-2 text-sm text-ink-soft">
                      <ClockIcon width={16} height={16} /> {point.openingHours}
                    </p>
                  )}
                  {point.phone && (
                    <a href={`tel:${point.phone}`} className="block text-sm text-brand">
                      {point.phone}
                    </a>
                  )}
                  {point.latitude !== null && point.longitude !== null && (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=17/${point.latitude}/${point.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-sm text-brand hover:underline"
                    >
                      OpenStreetMap ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
