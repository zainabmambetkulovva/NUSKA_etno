'use client';

import { Suspense } from 'react';

import type { Order } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { KochkorMuyuz, OrnamentLoader } from '@/components/brand/ornament';
import { ButtonLink } from '@/components/ui/button';
import { CheckIcon, PinIcon } from '@/components/ui/icons';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format';

const UUID = /^[0-9a-f-]{36}$/i;

/** "Order placed" page: summary of the order just created (data from the API). */
function Success() {
  const { t, locale } = useI18n();
  const id = useSearchParams().get('order') ?? '';
  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<Order>(`/orders/${id}`, { locale }),
    enabled: UUID.test(id),
  });

  if (!UUID.test(id) || order.isError)
    return (
      <div className="container max-w-2xl py-16">
        <ErrorBox>{t.common.error}</ErrorBox>
      </div>
    );
  if (!order.data) return <OrnamentLoader label={t.common.loading} className="py-24" />;
  const o = order.data;

  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 space-y-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-cream-light shadow-card">
          <CheckIcon width={32} height={32} />
        </span>
        <h1 className="text-3xl font-semibold md:text-4xl">{t.checkout.successTitle}</h1>
        <p className="text-ink-muted">{t.checkout.successText}</p>
      </div>
      <div className="card space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-soft">{t.checkout.orderNumber}</p>
            <p className="font-serif text-2xl font-semibold">{formatOrderNumber(o.orderNumber)}</p>
          </div>
          <OrderStatusBadge status={o.status} />
        </div>
        <ul className="divide-y divide-cream-dark/60">
          {o.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2 text-sm">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0">{formatMoney(item.totalPrice, locale, t.common.som)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-cream-dark/60 pt-3 font-semibold">
          <span>{t.checkout.total}</span>
          <span className="text-brand">{formatMoney(o.total, locale, t.common.som)}</span>
        </div>
        <div className="flex gap-3 rounded-xl bg-cream-50 p-4 text-sm">
          <PinIcon className="mt-0.5 shrink-0 text-brand" />
          <div>
            <p className="font-medium">{o.pickup.name}</p>
            <p className="text-ink-muted">{o.pickup.address}</p>
            {o.pickup.time && (
              <p className="text-ink-soft">{formatDate(o.pickup.time, locale, true)}</p>
            )}
          </div>
        </div>
        <p className="text-sm text-ink-soft">{t.checkout.paymentNote}</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={`/${locale}/account/orders/${o.id}`}>{t.checkout.viewOrder}</ButtonLink>
        <ButtonLink href={`/${locale}/catalog`} variant="outline">
          {t.checkout.continueShopping}
        </ButtonLink>
      </div>
      <KochkorMuyuz className="mx-auto mt-10 h-8 w-16 text-brand/30" animate />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <Success />
    </Suspense>
  );
}
