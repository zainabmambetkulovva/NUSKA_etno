'use client';

import { useEffect, useMemo, useState } from 'react';

import type { Cart, GiftSetQuote, Page, ProductCard, SavedGiftSet } from '@nuska/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { GiftBox } from './gift-box';

import { KochkorMuyuz, OrnamentLoader } from '@/components/brand/ornament';
import { ProductImage } from '@/components/product/product-image';
import { QuantityStepper } from '@/components/product/quantity-stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import { ErrorBox } from '@/components/ui/misc';
import { useMe } from '@/hooks/use-auth';
import { cartKey } from '@/hooks/use-cart';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';
import { useGiftSet, type GiftDraftItem } from '@/stores/gift-set';
import { useGuestCart } from '@/stores/guest-cart';
import { useToast } from '@/stores/toast';

/**
 * "Build your own Kyrgyz dastorkon" (TZ section 08). The draft keeps only
 * product ids and quantities; names, prices and the total always come from
 * the server (`POST /gift-sets/quote`).
 */
export function GiftBuilder() {
  const { t, locale } = useI18n();
  const me = useMe();
  const signedIn = Boolean(me.data);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const guestCart = useGuestCart();
  const draft = useGiftSet();
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState('');
  useEffect(() => setHydrated(true), []);
  const items = hydrated ? draft.items : [];

  const products = useQuery({
    queryKey: ['gift-products', locale],
    queryFn: () => api<Page<ProductCard>>('/products?limit=100', { locale }),
    staleTime: 60_000,
  });
  const quote = useQuery({
    queryKey: ['gift-quote', locale, items],
    queryFn: () =>
      api<GiftSetQuote>('/gift-sets/quote', { method: 'POST', locale, body: { items } }),
    enabled: items.length > 0,
    placeholderData: keepPreviousData,
  });
  const savedSets = useQuery({
    queryKey: ['gift-sets', locale],
    queryFn: () => api<SavedGiftSet[]>('/gift-sets', { locale }),
    enabled: signedIn,
  });

  const lines = items.length > 0 ? (quote.data?.items ?? []) : [];
  const quantityOf = (id: string) => items.find((i) => i.productId === id)?.quantity ?? 0;
  const boxItems = useMemo(
    () => lines.map((l) => ({ sku: l.product.sku, quantity: l.quantity })),
    [lines]
  );
  const names = useMemo(
    () =>
      lines.flatMap((l) => Array.from({ length: Math.min(l.quantity, 3) }, () => l.product.name)),
    [lines]
  );

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!quote.data) return { skipped: [] as unknown[] };
      if (!signedIn) {
        for (const line of quote.data.items) guestCart.add(line.product, line.quantity);
        return { skipped: [] as unknown[] };
      }
      const result = await api<{ cart: Cart; skipped: unknown[] }>('/cart/merge', {
        method: 'POST',
        locale,
        body: { items },
      });
      queryClient.setQueryData(cartKey(locale), result.cart);
      return result;
    },
    onSuccess: (result) =>
      result.skipped.length > 0 ? toast(t.gift.skipped, 'error') : toast(t.gift.added),
  });

  const save = useMutation({
    mutationFn: async () => {
      const setName = name.trim() || t.gift.defaultName;
      if (!signedIn) return draft.saveLocal(setName);
      await api('/gift-sets', { method: 'POST', locale, body: { name: setName, items } });
      await queryClient.invalidateQueries({ queryKey: ['gift-sets'] });
    },
    onSuccess: () => (toast(t.gift.saved), setName('')),
  });
  const removeSaved = useMutation({
    mutationFn: (id: string) => api(`/gift-sets/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gift-sets'] }),
  });

  const load = (set: GiftDraftItem[]) => {
    draft.load(set);
    toast(t.gift.loaded);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saved: {
    id: string;
    name: string;
    items: GiftDraftItem[];
    total?: string;
    local: boolean;
  }[] = signedIn
    ? (savedSets.data ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        items: s.items.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        total: formatMoney(s.total, locale, t.common.som),
        local: false,
      }))
    : hydrated
      ? draft.saved.map((s) => ({ ...s, local: true }))
      : [];

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_440px]">
      {/* Product picker */}
      <section aria-labelledby="gift-choose">
        <h2 id="gift-choose" className="mb-5 font-serif text-2xl">
          {t.gift.choose}
        </h2>
        {products.isLoading ? (
          <OrnamentLoader label={t.common.loading} />
        ) : products.isError ? (
          <ErrorBox>{t.common.error}</ErrorBox>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.data?.data.map((p) => {
              const q = quantityOf(p.id);
              return (
                <li
                  key={p.id}
                  className={`card flex flex-col overflow-hidden transition ${q > 0 ? 'ring-2 ring-brand' : ''}`}
                >
                  <div className="relative aspect-[4/3] bg-cream-light">
                    <ProductImage
                      url={p.image?.url}
                      alt={p.image?.alt}
                      name={p.name}
                      sizes="300px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h3 className="font-serif text-lg leading-snug">{p.name}</h3>
                    <p className="text-brand">{formatMoney(p.price, locale, t.common.som)}</p>
                    <div className="mt-auto pt-2">
                      {!p.inStock ? (
                        <span className="text-sm text-ink-soft">{t.product.outOfStock}</span>
                      ) : q === 0 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => draft.set(p.id, 1)}
                          aria-label={`${t.gift.add}: ${p.name}`}
                        >
                          <PlusIcon width={16} height={16} /> {t.gift.add}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <QuantityStepper
                            value={q}
                            max={p.availableQuantity ?? 99}
                            onChange={(v) => draft.set(p.id, v)}
                            label={`${t.product.quantity}: ${p.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => draft.set(p.id, 0)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-cream-50 hover:text-danger"
                            aria-label={`${t.common.delete}: ${p.name}`}
                          >
                            <TrashIcon width={18} height={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Box and summary */}
      <aside className="space-y-5 lg:sticky lg:top-20 lg:h-fit" aria-labelledby="gift-set">
        <GiftBox items={boxItems} names={names} label={t.gift.sceneLabel} />
        <div className="card space-y-4 p-5">
          <div className="flex items-center justify-between">
            <h2 id="gift-set" className="font-serif text-2xl">
              {t.gift.yourSet}
            </h2>
            {items.length > 0 && (
              <button
                type="button"
                className="text-sm text-ink-soft hover:text-danger"
                onClick={draft.clear}
              >
                {t.gift.clear}
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-ink-soft">{t.gift.empty}</p>
          ) : (
            <>
              <ul className="divide-y divide-cream-dark/60 text-sm" aria-live="polite">
                {lines.map((l) => (
                  <li key={l.product.id} className="flex items-center justify-between gap-3 py-2">
                    <span>
                      {l.product.name} × {l.quantity}
                      {l.issue && (
                        <span className="block text-xs text-danger">{t.gift.notEnough}</span>
                      )}
                    </span>
                    <span className="shrink-0">
                      {formatMoney(l.lineTotal, locale, t.common.som)}
                    </span>
                  </li>
                ))}
              </ul>
              {quote.data && quote.data.unavailable.length > 0 && (
                <ErrorBox>{t.gift.unavailable}</ErrorBox>
              )}
              <div className="flex items-baseline justify-between border-t border-cream-dark/60 pt-3">
                <span className="font-medium">
                  {t.gift.total} · {quote.data?.itemsCount ?? 0} {t.gift.pcs}
                </span>
                <span className="font-serif text-2xl text-brand" data-testid="gift-total">
                  {quote.data ? formatMoney(quote.data.total, locale, t.common.som) : '…'}
                </span>
              </div>
              <Button
                className="w-full"
                size="lg"
                loading={addToCart.isPending}
                disabled={!quote.data || quote.isFetching || quote.data.items.length === 0}
                onClick={() => addToCart.mutate()}
              >
                {t.gift.addToCart}
              </Button>
              {addToCart.error && <ErrorBox>{errorMessage(addToCart.error, t.errors)}</ErrorBox>}
              <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), save.mutate())}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  placeholder={t.gift.defaultName}
                  aria-label={t.gift.name}
                />
                <Button type="submit" variant="outline" loading={save.isPending}>
                  {t.gift.save}
                </Button>
              </form>
              {save.error && <ErrorBox>{errorMessage(save.error, t.errors)}</ErrorBox>}
              {!signedIn && <p className="text-xs text-ink-soft">{t.gift.guestHint}</p>}
            </>
          )}
        </div>

        {saved.length > 0 && (
          <div className="card space-y-3 p-5">
            <h2 className="flex items-center gap-2 font-serif text-xl">
              <KochkorMuyuz className="h-4 w-8 text-gold" /> {t.gift.savedSets}
            </h2>
            <ul className="space-y-2">
              {saved.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-cream-50 px-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.name}</span>
                    {s.total && <span className="text-ink-soft">{s.total}</span>}
                  </span>
                  <span className="flex shrink-0 gap-3">
                    <button
                      type="button"
                      className="text-brand hover:underline"
                      onClick={() => load(s.items)}
                    >
                      {t.gift.load}
                    </button>
                    <button
                      type="button"
                      className="text-ink-soft hover:text-danger"
                      onClick={() => (s.local ? draft.removeLocal(s.id) : removeSaved.mutate(s.id))}
                      aria-label={`${t.common.delete}: ${s.name}`}
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!signedIn && (
          <p className="text-center text-sm">
            <Link
              href={`/${locale}/login?next=/${locale}/gift-builder`}
              className="text-brand hover:underline"
            >
              {t.nav.login}
            </Link>
          </p>
        )}
      </aside>
    </div>
  );
}
