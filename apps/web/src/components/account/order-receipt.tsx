'use client';

import type { Order } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';

import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { PayOnline } from '@/components/account/pay-online';
import { KochkorMuyuz, OrnamentLoader } from '@/components/brand/ornament';
import { Button, ButtonLink } from '@/components/ui/button';
import { CheckIcon, PinIcon } from '@/components/ui/icons';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format';

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/** The order id inside a value that a payment page may have appended to. */
export function orderIdFrom(value: string | null | undefined) {
  return value?.match(UUID)?.[0] ?? null;
}

/**
 * The order just placed or paid, as a receipt: items, total, delivery and,
 * for an online payment, the paid amount, date and payment number with a
 * print button. While Finik's confirmation has not arrived yet the order is
 * re-read every 3 s (up to 2 minutes).
 */
export function OrderReceipt({ id }: { id: string | null }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const order = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<Order>(`/orders/${id}`, { locale }),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const o = query.state.data;
      const waiting = o?.paymentMethod === 'ONLINE' && !o.payments.some((p) => p.status === 'PAID');
      return waiting && query.state.dataUpdateCount < 40 ? 3000 : false;
    },
  });

  if (order.error instanceof ApiError && order.error.status === 401)
    return (
      <div className="container max-w-md space-y-4 py-16 text-center">
        <p className="text-ink-muted">{t.checkout.signInToSee}</p>
        <ButtonLink href={`/${locale}/login?next=${encodeURIComponent(pathname)}`}>
          {t.nav.login}
        </ButtonLink>
      </div>
    );
  if (!id || order.isError)
    return (
      <div className="container max-w-2xl py-16">
        <ErrorBox>{t.common.error}</ErrorBox>
      </div>
    );
  if (!order.data) return <OrnamentLoader label={t.common.loading} className="py-24" />;
  const o = order.data;
  const paid = o.payments.find((p) => p.status === 'PAID');
  const waiting = o.paymentMethod === 'ONLINE' && !paid;
  // the reason Finik refused, kept by the checkout page (test mode only)
  let reason: string | null = null;
  try {
    reason = window.sessionStorage.getItem(`nuska-pay-error-${o.id}`);
  } catch {
    reason = null;
  }
  // from checkout (not Finik's return page) with the payment still open: it did not start
  const unpaid = waiting && pathname.includes('/checkout/success');
  return (
    <div className="container max-w-2xl py-12">
      <div className="mb-8 space-y-4 text-center">
        <span
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full text-cream-light shadow-card',
            unpaid ? 'bg-[#C98A1F]' : 'bg-brand'
          )}
        >
          {unpaid ? (
            <span className="text-3xl font-bold">!</span>
          ) : (
            <CheckIcon width={32} height={32} />
          )}
        </span>
        <h1 className="text-3xl font-semibold md:text-4xl">
          {unpaid ? t.checkout.unpaidTitle : t.checkout.successTitle}
        </h1>
        <p className="text-ink-muted">{unpaid ? t.checkout.unpaidText : t.checkout.successText}</p>
        {unpaid && reason && (
          <p className="mx-auto max-w-md rounded-xl bg-[#FFF4D6] px-3 py-2 text-xs text-nk-brown">
            {t.checkout.payReason}: {reason}
          </p>
        )}
      </div>
      <div className="card space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-ink-soft">{t.checkout.orderNumber}</p>
            <p className="font-serif text-2xl font-semibold">{formatOrderNumber(o.orderNumber)}</p>
          </div>
          <OrderStatusBadge status={o.status} method={o.deliveryMethod} />
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
          {o.delivery ? (
            <div>
              <p className="font-medium">{t.checkout.deliveryTo}</p>
              <p className="text-ink-muted">
                {o.delivery.city}, {o.delivery.address}
              </p>
              {o.delivery.time && (
                <p className="text-ink-muted">
                  {t.checkout.deliveryTime}: {o.delivery.time}
                </p>
              )}
              <p className="text-ink-soft">{t.checkout.deliveryNote}</p>
            </div>
          ) : o.pickup ? (
            <div>
              <p className="font-medium">{o.pickup.name}</p>
              <p className="text-ink-muted">{o.pickup.address}</p>
              {o.pickup.time && (
                <p className="text-ink-soft">{formatDate(o.pickup.time, locale, true)}</p>
              )}
            </div>
          ) : null}
        </div>
        {paid && (
          <section className="receipt rounded-xl border border-dashed border-nk-gold/70 bg-[#FFFCF4] p-4 text-sm">
            <h2 className="mb-2 flex items-center gap-2 font-serif text-lg text-nk-ink">
              <CheckIcon width={18} height={18} className="text-brand" /> {t.checkout.receiptTitle}
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-ink-soft">{t.checkout.receiptPaid}</dt>
              <dd className="font-semibold">{formatMoney(paid.amount, locale, t.common.som)}</dd>
              {paid.paidAt && (
                <>
                  <dt className="text-ink-soft">{t.checkout.receiptDate}</dt>
                  <dd>{formatDate(paid.paidAt, locale, true)}</dd>
                </>
              )}
              <dt className="text-ink-soft">{t.checkout.receiptMethod}</dt>
              <dd>{t.checkout.receiptMethodOnline}</dd>
              <dt className="text-ink-soft">{t.checkout.receiptPayment}</dt>
              <dd className="break-all font-mono text-xs">{paid.id}</dd>
            </dl>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 print:hidden"
              onClick={() => window.print()}
            >
              {t.checkout.receiptPrint}
            </Button>
          </section>
        )}
        {waiting && order.isFetching && (
          <p className="text-sm text-ink-muted" role="status">
            {t.checkout.confirmingPayment}
          </p>
        )}
        <PayOnline order={o} />
        <p className="text-sm text-ink-soft">{t.checkout.paymentNote}</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
        <ButtonLink href={`/${locale}/account/orders/${o.id}`}>{t.checkout.viewOrder}</ButtonLink>
        <ButtonLink href={`/${locale}/catalog`} variant="outline">
          {t.checkout.continueShopping}
        </ButtonLink>
      </div>
      <KochkorMuyuz className="mx-auto mt-10 h-8 w-16 text-brand/30" animate />
    </div>
  );
}
