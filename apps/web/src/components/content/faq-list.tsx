'use client';

import { useMemo, useState } from 'react';

import type { FaqItem } from '@nuska/types';
import { AnimatePresence, motion } from 'framer-motion';

import { PlusIcon, SearchIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

/** FAQ accordion; with `interactive`, adds search and category filters (FAQ page). */
export function FaqList({
  items,
  interactive = false,
}: {
  items: FaqItem[];
  interactive?: boolean;
}) {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))], [items]);
  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return items.filter(
      (i) =>
        (!category || i.category === category) &&
        (!q ||
          i.question.toLocaleLowerCase().includes(q) ||
          i.answer.toLocaleLowerCase().includes(q))
    );
  }, [items, query, category]);

  return (
    <div className="space-y-6">
      {interactive && (
        <div className="space-y-4">
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft"
              width={18}
              height={18}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.faq.searchPlaceholder}
              aria-label={t.faq.searchPlaceholder}
              className="h-12 w-full rounded-full border border-cream-dark bg-white pl-11 pr-4 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group">
              {[null, ...categories].map((c) => (
                <button
                  key={c ?? 'all'}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm transition',
                    category === c
                      ? 'border-brand bg-brand text-cream-light'
                      : 'border-cream-dark bg-white text-ink-muted hover:border-brand hover:text-brand'
                  )}
                >
                  {c ? (t.faq.categories[c] ?? c) : t.faq.all}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-6 text-center text-ink-soft">{t.faq.empty}</p>
      ) : (
        <ul className="divide-y divide-cream-dark/60 overflow-hidden rounded-2xl border border-cream-dark/60 bg-milk">
          {visible.map((item) => {
            const open = openId === item.id;
            return (
              <li key={item.id}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    aria-controls={`faq-${item.id}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-serif text-lg transition hover:bg-cream-50"
                  >
                    {item.question}
                    <PlusIcon
                      className={cn(
                        'shrink-0 text-brand transition-transform duration-300',
                        open && 'rotate-45'
                      )}
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`faq-${item.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="whitespace-pre-line px-5 pb-5 text-ink-muted">{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
