'use client';

import type { Order, Page } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { OrnamentLoader } from '@/components/brand/ornament';
import { ProductImage } from '@/components/product/product-image';
import { ButtonLink } from '@/components/ui/button';
import { ChevronRightIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format';

export default function OrdersPage() {
  const { t, locale } = useI18n();
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: () => api<Page<Order>>('/orders?limit=50'),
  });

  if (orders.isLoading) return <OrnamentLoader label={t.common.loading} />;
  if (!orders.data?.data.length)
    return (
      <EmptyState
        title={t.account.ordersEmpty}
        action={<ButtonLink href={`/${locale}/catalog`}>{t.cart.toCatalog}</ButtonLink>}
      />
    );

  return (
    <ul className="space-y-3">
      {orders.data.data.map((order) => (
        <li key={order.id}>
          <Link
            href={`/${locale}/account/orders/${order.id}`}
            className="card flex flex-wrap items-center gap-4 p-5 transition hover:shadow-card"
          >
            <div className="min-w-[140px]">
              <div className="font-semibold">
                {t.account.order} {formatOrderNumber(order.orderNumber)}
              </div>
              <div className="text-sm text-ink-soft">{formatDate(order.createdAt, locale)}</div>
            </div>
            <OrderStatusBadge status={order.status} method={order.deliveryMethod} />
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex shrink-0 -space-x-3">
                {order.items.slice(0, 3).map((i) => (
                  <ProductImage
                    key={i.id}
                    url={i.image?.url}
                    slug={i.productSlug}
                    alt={i.image?.alt}
                    name={i.name}
                    sizes="48px"
                    className="h-12 w-12 rounded-xl border-2 border-white"
                  />
                ))}
              </div>
              <div className="truncate text-sm text-ink-muted">
                {order.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
              </div>
            </div>
            <div className="font-semibold">{formatMoney(order.total, locale, t.common.som)}</div>
            <ChevronRightIcon className="text-ink-soft" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
