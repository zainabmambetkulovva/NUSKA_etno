'use client';

import { useEffect, useRef, useState } from 'react';

import type { Page, ProductCard } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { SearchIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { formatMoney } from '@/lib/format';

const HISTORY_KEY = 'nuska.search-history';

function readHistory(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((v) => typeof v === 'string').slice(0, 6) : [];
  } catch {
    return [];
  }
}

function saveHistory(list: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 6)));
  } catch {
    // Storage may be unavailable (private mode): history is optional.
  }
}

/** Search field with live suggestions from the catalog and recent queries (kept in this browser). */
export function SearchBox({ initial = '' }: { initial?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [debounced, setDebounced] = useState(initial);
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setHistory(readHistory()), []);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value.trim()), 250);
    return () => clearTimeout(id);
  }, [value]);
  useEffect(() => {
    if (!initial) return;
    const next = [initial, ...readHistory().filter((h) => h !== initial)];
    saveHistory(next);
    setHistory(next.slice(0, 6));
  }, [initial]);

  const suggestions = useQuery({
    queryKey: ['search-suggest', locale, debounced],
    queryFn: () =>
      api<Page<ProductCard>>(`/products?search=${encodeURIComponent(debounced)}&limit=5`, {
        locale,
      }),
    enabled: debounced.length >= 2 && debounced !== initial,
    staleTime: 60_000,
  });

  const submit = (q: string) => {
    setFocused(false);
    router.push(q ? `/${locale}/search?q=${encodeURIComponent(q)}` : `/${locale}/search`);
  };
  const showPanel =
    focused && ((suggestions.data?.data.length ?? 0) > 0 || (!value && history.length > 0));

  return (
    <div
      ref={box}
      className="relative"
      onBlur={(e) => {
        if (!box.current?.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value.trim());
        }}
      >
        <SearchIcon
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
          width={20}
          height={20}
        />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder={t.search.placeholder}
          aria-label={t.search.title}
          autoComplete="off"
          maxLength={100}
          className="h-14 w-full rounded-full border border-cream-dark bg-white pl-12 pr-5 text-lg shadow-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </form>
      {showPanel && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-cream-dark/60 bg-milk shadow-lift">
          {value ? (
            <ul aria-label={t.search.suggestions}>
              {suggestions.data?.data.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/${locale}/product/${p.slug}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-cream-50"
                  >
                    <span>{p.name}</span>
                    <span className="text-sm text-brand">
                      {formatMoney(p.price, locale, t.common.som)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-ink-soft">
                {t.search.recent}
                <button
                  type="button"
                  className="normal-case tracking-normal text-brand hover:underline"
                  onClick={() => {
                    saveHistory([]);
                    setHistory([]);
                  }}
                >
                  {t.search.clearRecent}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      setValue(h);
                      submit(h);
                    }}
                    className="rounded-full border border-cream-dark px-3 py-1 text-sm hover:border-brand hover:text-brand"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
