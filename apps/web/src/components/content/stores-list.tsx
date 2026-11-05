import type { SiteContent } from '@nuska/types';

import { KochkorMuyuz } from '@/components/brand/ornament';
import type { Locale } from '@/i18n/config';
import { serverApiSafe } from '@/lib/api/server';

/** "Where to buy": shops that sell the company's products (content block `stores`, editable in the admin panel). */
export async function StoresList({ locale, className }: { locale: Locale; className?: string }) {
  const content = await serverApiSafe<SiteContent | null>('/content/stores', locale, null);
  const stores = Array.isArray(content?.data?.stores)
    ? (content!.data!.stores as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  if (!content || stores.length === 0) return null;

  return (
    <section className={className} aria-labelledby="stores-title">
      <div className="mb-5 flex items-center gap-3">
        <KochkorMuyuz className="h-6 w-12 shrink-0 text-brand/60" />
        <h2 id="stores-title" className="font-serif text-2xl font-semibold">
          {content.title}
        </h2>
      </div>
      {content.body && <p className="mb-4 text-ink-muted">{content.body}</p>}
      <ul className="flex flex-wrap gap-2">
        {stores.map((store) => (
          <li
            key={store}
            className="rounded-full border border-brand/20 bg-white px-4 py-1.5 text-sm text-brand-dark shadow-soft"
          >
            {store}
          </li>
        ))}
      </ul>
    </section>
  );
}
