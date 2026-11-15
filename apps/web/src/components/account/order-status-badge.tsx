'use client';

import type { OrderStatus } from '@nuska/types';

import { Badge } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';

const TONES: Record<OrderStatus, 'green' | 'cream' | 'olive' | 'red' | 'gray'> = {
  PENDING: 'cream',
  CONFIRMED: 'olive',
  PREPARING: 'olive',
  READY_FOR_PICKUP: 'green',
  COMPLETED: 'gray',
  CANCELLED: 'red',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  return <Badge tone={TONES[status]}>{t.orderStatus[status]}</Badge>;
}
