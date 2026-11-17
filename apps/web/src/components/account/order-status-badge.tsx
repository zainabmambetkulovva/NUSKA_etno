'use client';

import type { DeliveryMethod, OrderStatus } from '@nuska/types';

import { Badge } from '@/components/ui/misc';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { useI18n } from '@/i18n/i18n-provider';

const TONES: Record<OrderStatus, 'green' | 'cream' | 'olive' | 'red' | 'gray'> = {
  PENDING: 'cream',
  CONFIRMED: 'olive',
  PREPARING: 'olive',
  READY_FOR_PICKUP: 'green',
  COMPLETED: 'gray',
  CANCELLED: 'red',
};

/** Status name; delivered orders say «Передан в доставку» / «Доставлен». */
export function orderStatusLabel(t: Dictionary, status: OrderStatus, method?: DeliveryMethod) {
  if (method === 'DELIVERY' && status in t.orderStatusDelivery)
    return t.orderStatusDelivery[status as keyof Dictionary['orderStatusDelivery']];
  return t.orderStatus[status];
}

export function OrderStatusBadge({
  status,
  method,
}: {
  status: OrderStatus;
  method?: DeliveryMethod;
}) {
  const { t } = useI18n();
  return <Badge tone={TONES[status]}>{orderStatusLabel(t, status, method)}</Badge>;
}
