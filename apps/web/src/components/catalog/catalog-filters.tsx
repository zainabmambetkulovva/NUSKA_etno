'use client';

import { useTransition } from 'react';

import type { CategoryNode } from '@nuska/types';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Checkbox, Select } from '@/components/ui/field';
import { SearchIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

const SORTS = ['default', 'popular', 'price_asc', 'price_desc', 'newest', 'name'] as const;

/** Search, sort, stock filter and category list (TZ §16). State lives in the URL. */
export function CatalogFilters({
  categories,
  activeCategory,
}: {
  categories: CategoryNode[];
  activeCategory?: string;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    next.delete('page');
    const query = next.toString();
    startTransition(() =>
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    );
  };

  const hasFilters = Boolean(
    params.get('search') ||
    params.get('inStock') ||
    params.get('minPrice') ||
    params.get('maxPrice') ||
    (params.get('sort') && params.get('sort') !== 'default') ||
    activeCategory
  );

  const flat: { slug: string; name: string; depth: number }[] = [];
  const walk = (nodes: CategoryNode[], depth: number) =>
    nodes.forEach((n) => {
      flat.push({ slug: n.slug, name: n.name, depth });
      walk(n.children, depth + 1);
    });
  walk(categories, 0);

  return (
    <aside className={cn('space-y-6', pending && 'opacity-70')} aria-label={t.catalog.filters}>
      <form
        role="search"
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          update({ search: String(new FormData(event.currentTarget).get('search') ?? '').trim() });
        }}
      >
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
          width={18}
          height={18}
        />
        <input
          key={params.get('search') ?? ''}
          name="search"
          type="search"
          defaultValue={params.get('search') ?? ''}
          placeholder={t.catalog.searchPlaceholder}
          aria-label={t.common.search}
          className="field-input pl-9"
        />
      </form>

      <nav className="space-y-1">
        <Link
          href={`/${locale}/catalog${params.toString() ? `?${params.toString()}` : ''}`}
          className={cn(
            'block rounded-lg px-3 py-2 text-sm',
            !activeCategory ? 'bg-brand text-cream-light' : 'hover:bg-cream-50'
          )}
        >
          {t.catalog.allCategories}
        </Link>
        {flat.map((c) => (
          <Link
            key={c.slug}
            href={`/${locale}/catalog/${c.slug}${params.toString() ? `?${params.toString()}` : ''}`}
            aria-current={c.slug === activeCategory ? 'page' : undefined}
            className={cn(
              'block rounded-lg px-3 py-2 text-sm',
              c.slug === activeCategory ? 'bg-brand text-cream-light' : 'hover:bg-cream-50'
            )}
            style={{ paddingLeft: `${0.75 + c.depth}rem` }}
          >
            {c.name}
          </Link>
        ))}
      </nav>

      <div className="space-y-2">
        <label className="field-label" htmlFor="sort">
          {t.catalog.sort}
        </label>
        <Select
          id="sort"
          value={params.get('sort') ?? 'default'}
          onChange={(e) => update({ sort: e.target.value === 'default' ? null : e.target.value })}
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {t.catalog.sortOptions[s]}
            </option>
          ))}
        </Select>
      </div>

      <form
        className="space-y-2"
        key={`${params.get('minPrice')}-${params.get('maxPrice')}`}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const clean = (v: FormDataEntryValue | null) => {
            const n = Math.round(Number(v));
            return v && Number.isFinite(n) && n >= 0 ? String(n) : null;
          };
          update({ minPrice: clean(data.get('minPrice')), maxPrice: clean(data.get('maxPrice')) });
        }}
      >
        <span className="field-label">{t.catalog.price}</span>
        <div className="flex items-center gap-2">
          <input
            name="minPrice"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={params.get('minPrice') ?? ''}
            placeholder={t.catalog.priceFrom}
            aria-label={t.catalog.priceFrom}
            className="field-input min-w-0"
          />
          <span aria-hidden>—</span>
          <input
            name="maxPrice"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={params.get('maxPrice') ?? ''}
            placeholder={t.catalog.priceTo}
            aria-label={t.catalog.priceTo}
            className="field-input min-w-0"
          />
        </div>
        <button type="submit" className="text-sm font-medium text-brand hover:underline">
          {t.catalog.applyPrice}
        </button>
      </form>

      <Checkbox
        label={t.catalog.inStockOnly}
        checked={params.get('inStock') === 'true'}
        onChange={(e) => update({ inStock: e.target.checked ? 'true' : null })}
      />

      {hasFilters && (
        <Link
          href={`/${locale}/catalog`}
          className="inline-block text-sm font-medium text-brand hover:underline"
        >
          {t.catalog.clearFilters}
        </Link>
      )}
    </aside>
  );
}
