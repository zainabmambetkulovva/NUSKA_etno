import type { SiteContent } from '@nuska/types';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { Marquee } from '@/components/ui/marquee';
import type { Locale } from '@/i18n/config';
import { serverApiSafe } from '@/lib/api/server';
import { cn } from '@/lib/cn';

/** Diamond separator between store names. */
function Dot() {
  return (
    <svg viewBox="0 0 12 12" className="mx-6 h-3 w-3 shrink-0 text-gold" aria-hidden>
      <path d="M6 0 L12 6 L6 12 L0 6 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * "Where to buy": shops that sell the company's products (content block
 * `stores`, editable in the admin panel), shown as an endless ornamental ticker.
 */
export async function StoresList({ locale, className }: { locale: Locale; className?: string }) {
  const content = await serverApiSafe<SiteContent | null>('/content/stores', locale, null);
  const stores = Array.isArray(content?.data?.stores)
    ? (content!.data!.stores as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  if (!content || stores.length === 0) return null;
  const half = Math.ceil(stores.length / 2);

  const row = (names: string[]) =>
    names.flatMap((store) => [
      <span
        key={store}
        className="whitespace-nowrap font-serif text-xl text-brand-dark md:text-2xl"
      >
        {store}
      </span>,
      <Dot key={`${store}-dot`} />,
    ]);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl border border-gold/30 bg-milk py-8',
        className
      )}
      aria-labelledby="stores-title"
    >
      <div className="bg-ornament absolute inset-0 opacity-30" aria-hidden />
      <div className="relative mb-6 flex flex-col items-center gap-2 px-4 text-center">
        <KochkorMuyuz className="h-6 w-12 text-gold" />
        <h2 id="stores-title" className="font-serif text-2xl font-semibold md:text-3xl">
          {content.title}
        </h2>
        {content.body && <p className="max-w-2xl text-ink-muted">{content.body}</p>}
      </div>
      <div className="relative space-y-4">
        <Marquee items={row(stores.slice(0, half))} duration={45} />
        <Marquee items={row(stores.slice(half))} duration={50} reverse />
      </div>
      {/* Plain list for screen readers and search engines. */}
      <ul className="sr-only">
        {stores.map((store) => (
          <li key={store}>{store}</li>
        ))}
      </ul>
    </section>
  );
}
