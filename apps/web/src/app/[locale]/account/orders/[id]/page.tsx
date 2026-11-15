'use client';

import { useState } from 'react';

import type { Order, OrderItem } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { OrnamentLoader } from '@/components/brand/ornament';
import { ProductImage } from '@/components/product/product-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { StarIcon } from '@/components/ui/icons';
import { Badge, ErrorBox } from '@/components/ui/misc';
import { cartKey } from '@/hooks/use-cart';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format';
import { useToast } from '@/stores/toast';

function ReviewForm({ item, orderId }: { item: OrderItem; orderId: string }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const send = useMutation({
    mutationFn: () =>
      api('/reviews', {
        method: 'POST',
        body: { orderItemId: item.id, rating, comment: comment || undefined },
      }),
    onSuccess: () => {
      toast(t.account.reviewSent);
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });

  if (item.review) {
    const label = {
      PENDING: t.account.reviewPending,
      APPROVED: t.account.reviewPublished,
      REJECTED: t.account.reviewRejected,
    }[item.review.status];
    return (
      <Badge
        tone={
          item.review.status === 'APPROVED'
            ? 'green'
            : item.review.status === 'REJECTED'
              ? 'red'
              : 'cream'
        }
      >
        {label}
      </Badge>
    );
  }
  if (!item.productId) return null;
  if (!open)
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {t.account.leaveReview}
      </Button>
    );

  return (
    <form
      className="mt-3 w-full space-y-3 rounded-xl bg-cream-50 p-4"
      onSubmit={(e) => (e.preventDefault(), send.mutate())}
    >
      <div className="flex items-center gap-1" role="radiogroup" aria-label={t.account.rating}>
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={rating === value}
            aria-label={String(value)}
            onClick={() => setRating(value)}
            className="text-[#D9A441]"
          >
            <StarIcon filled={value <= rating} width={24} height={24} />
          </button>
        ))}
      </div>
      <Textarea
        aria-label={t.account.comment}
        placeholder={t.account.comment}
        maxLength={2000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {send.error && <ErrorBox>{errorMessage(send.error, t.errors)}</ErrorBox>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={send.isPending}>
          {t.account.sendReview}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          {t.common.cancel}
        </Button>
      </div>
    </form>
  );
}

export default function OrderPage() {
  const { t, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const order = useQuery({ queryKey: ['order', id], queryFn: () => api<Order>(`/orders/${id}`) });

  const cancel = useMutation({
    mutationFn: () => api<Order>(`/orders/${id}/cancel`, { method: 'POST', body: {} }),
    onSuccess: (data) => {
      queryClient.setQueryData(['order', id], data);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => toast(errorMessage(error, t.errors), 'error'),
  });
  const repeat = useMutation({
    mutationFn: () => api(`/orders/${id}/repeat`, { method: 'POST', locale }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKey(locale) });
      toast(t.account.repeated);
      router.push(`/${locale}/cart`);
    },
    onError: (error) => toast(errorMessage(error, t.errors), 'error'),
  });

  if (order.isLoading) return <OrnamentLoader label={t.common.loading} />;
  if (!order.data) return <ErrorBox>{errorMessage(order.error, t.errors)}</ErrorBox>;
  const o = order.data;

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/account/orders`} className="text-sm text-brand hover:underline">
        ← {t.account.orders}
      </Link>
      <div className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">
            {t.account.order} {formatOrderNumber(o.orderNumber)}
          </h2>
          <OrderStatusBadge status={o.status} />
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink-soft">{t.account.date}</dt>
            <dd>{formatDate(o.createdAt, locale, true)}</dd>
          </div>
          <div>
            <dt className="text-ink-soft">{t.account.pickup}</dt>
            <dd>
              {o.pickup.name}, {o.pickup.address}
            </dd>
          </div>
          {o.pickup.time && (
            <div>
              <dt className="text-ink-soft">{t.account.pickupTime}</dt>
              <dd>{formatDate(o.pickup.time, locale, true)}</dd>
            </div>
          )}
          <div>
            <dt className="text-ink-soft">{t.checkout.phone}</dt>
            <dd>{o.customer.phone}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {o.canCancel && (
            <Button
              variant="danger"
              size="sm"
              loading={cancel.isPending}
              onClick={() => window.confirm(t.account.cancelConfirm) && cancel.mutate()}
            >
              {t.account.cancelOrder}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            loading={repeat.isPending}
            onClick={() => repeat.mutate()}
          >
            {t.account.repeatOrder}
          </Button>
        </div>
      </div>

      <section className="card divide-y divide-cream-dark/60">
        {o.items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-4 p-4">
            <ProductImage
              url={item.image?.url}
              alt={item.image?.alt}
              name={item.name}
              sizes="64px"
              className="h-16 w-16 shrink-0 rounded-lg"
            />
            <div className="min-w-0 flex-1">
              {item.productSlug ? (
                <Link
                  href={`/${locale}/product/${item.productSlug}`}
                  className="font-medium hover:text-brand"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="font-medium">{item.name}</span>
              )}
              <div className="text-sm text-ink-soft">
                {formatMoney(item.unitPrice, locale, t.common.som)} × {item.quantity}
              </div>
            </div>
            <div className="font-semibold">
              {formatMoney(item.totalPrice, locale, t.common.som)}
            </div>
            {o.status === 'COMPLETED' && (
              <div className="w-full sm:w-auto">
                <ReviewForm item={item} orderId={o.id} />
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-between p-4 text-lg">
          <span>{t.account.total}</span>
          <span className="font-semibold text-brand-dark">
            {formatMoney(o.total, locale, t.common.som)}
          </span>
        </div>
      </section>

      <section className="card p-6">
        <h3 className="mb-4 font-serif text-xl">{t.account.history}</h3>
        <ol className="space-y-3 border-l-2 border-brand/30 pl-5">
          {o.statusHistory.map((h, i) => (
            <li key={i} className="relative">
              <span
                className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-brand"
                aria-hidden
              />
              <div className="font-medium">{t.orderStatus[h.newStatus]}</div>
              <div className="text-sm text-ink-soft">
                {formatDate(h.createdAt, locale, true)}
                {h.comment ? ` — ${h.comment}` : ''}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
