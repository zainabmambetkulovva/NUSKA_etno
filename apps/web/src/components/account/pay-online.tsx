'use client';

import type { Order } from '@nuska/types';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';

/**
 * Payment state of an online (Finik) order: «Оплачено», or «Ожидает оплаты»
 * with a button that opens a fresh Finik payment page.
 */
export function PayOnline({ order, className }: { order: Order; className?: string }) {
  const { t, locale } = useI18n();
  const pay = useMutation({
    mutationFn: () =>
      api<{ paymentUrl: string }>(`/orders/${order.id}/pay`, { method: 'POST', locale }),
    onSuccess: ({ paymentUrl }) => window.location.assign(paymentUrl),
  });
  if (order.paymentMethod !== 'ONLINE') return null;
  const paid = order.payments.some((p) => p.status === 'PAID');
  const closed = order.status === 'CANCELLED' || order.status === 'COMPLETED';
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 text-sm',
        paid ? 'bg-brand-50 text-brand-dark' : 'bg-cream-50',
        className
      )}
    >
      <span className="font-medium">{paid ? t.checkout.paid : t.checkout.awaitingPayment}</span>
      {!paid && !closed && (
        <Button size="sm" loading={pay.isPending} onClick={() => pay.mutate()}>
          {t.checkout.payNow}
        </Button>
      )}
      {pay.error && (
        <div className="w-full">
          <ErrorBox>{errorMessage(pay.error, t.errors)}</ErrorBox>
        </div>
      )}
    </div>
  );
}
