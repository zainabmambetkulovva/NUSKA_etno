'use client';

import { useState } from 'react';

import type { AdminOrder, OrderStatus } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { AdminTitle } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format';
import { useToast } from '@/stores/toast';

export default function AdminOrderPage() {
  const { t, locale } = useI18n();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [comment, setComment] = useState('');
  const order = useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => api<AdminOrder>(`/admin/orders/${id}`),
  });
  const change = useMutation({
    mutationFn: (status: OrderStatus) =>
      api<AdminOrder>(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        body: { status, comment: comment || undefined },
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'order', id], data);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      setComment('');
      toast(t.common.saved);
    },
  });

  if (order.isLoading) return <OrnamentLoader label={t.common.loading} />;
  if (!order.data) return <ErrorBox>{errorMessage(order.error, t.errors)}</ErrorBox>;
  const o = order.data;
  const money = (amount: number) => formatMoney(amount, locale, t.common.som);

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/admin/orders`} className="text-sm text-brand hover:underline">
        ← {t.admin.orders}
      </Link>
      <AdminTitle action={<OrderStatusBadge status={o.status} />}>
        {t.account.order} {formatOrderNumber(o.orderNumber)}
      </AdminTitle>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card space-y-2 p-6 text-sm">
          <h2 className="mb-2 font-serif text-xl">{t.admin.customer}</h2>
          <p className="font-medium">{o.customer.name}</p>
          <p>
            <a href={`tel:${o.customer.phone}`} className="text-brand">
              {o.customer.phone}
            </a>
          </p>
          {o.customer.email && (
            <p>
              <a href={`mailto:${o.customer.email}`} className="text-brand">
                {o.customer.email}
              </a>
            </p>
          )}
          <p className="text-ink-soft">
            {t.admin.email}: {o.user.email}
          </p>
          <p className="pt-2">
            <span className="text-ink-soft">{t.account.pickup}:</span> {o.pickup.name},{' '}
            {o.pickup.address}
          </p>
          {o.pickup.time && (
            <p>
              <span className="text-ink-soft">{t.account.pickupTime}:</span>{' '}
              {formatDate(o.pickup.time, locale, true)}
            </p>
          )}
          {o.comment && <p className="rounded-lg bg-cream-50 p-3">{o.comment}</p>}
        </section>

        <section className="card space-y-4 p-6">
          <h2 className="font-serif text-xl">{t.admin.changeStatus}</h2>
          {o.allowedTransitions.length === 0 ? (
            <p className="text-sm text-ink-soft">{t.admin.noTransitions}</p>
          ) : (
            <>
              <Input
                placeholder={t.admin.statusComment}
                aria-label={t.admin.statusComment}
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                {o.allowedTransitions.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={status === 'CANCELLED' ? 'danger' : 'primary'}
                    loading={change.isPending && change.variables === status}
                    disabled={change.isPending}
                    onClick={() =>
                      (status !== 'CANCELLED' || window.confirm(t.account.cancelConfirm)) &&
                      change.mutate(status)
                    }
                  >
                    {t.orderStatus[status]}
                  </Button>
                ))}
              </div>
            </>
          )}
          {change.error && <ErrorBox>{errorMessage(change.error, t.errors)}</ErrorBox>}
          <ol className="space-y-2 border-l-2 border-brand/30 pl-4 text-sm">
            {o.statusHistory.map((h, i) => (
              <li key={i}>
                <span className="font-medium">{t.orderStatus[h.newStatus]}</span>
                <span className="text-ink-soft">
                  {' '}
                  · {formatDate(h.createdAt, locale, true)}
                  {h.changedBy ? ` · ${h.changedBy.email}` : ''}
                </span>
                {h.comment && <div className="text-ink-muted">{h.comment}</div>}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="card divide-y divide-cream-dark/50">
        {o.items.map((item) => (
          <div key={item.id} className="flex flex-wrap justify-between gap-3 p-4 text-sm">
            <span>
              <span className="font-medium">{item.name}</span>{' '}
              <span className="text-ink-soft">({item.sku})</span>
            </span>
            <span>
              {money(item.unitPrice.amount)} × {item.quantity} ={' '}
              <b>{money(item.totalPrice.amount)}</b>
            </span>
          </div>
        ))}
        <div className="flex justify-between p-4 text-lg">
          <span>{t.account.total}</span>
          <b className="text-brand-dark">{money(o.total.amount)}</b>
        </div>
      </section>
    </div>
  );
}
