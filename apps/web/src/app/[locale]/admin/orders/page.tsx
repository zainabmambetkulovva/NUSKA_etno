'use client';

import { useState } from 'react';

import type { AdminOrderListItem, OrderStatus, Page } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { OrderStatusBadge } from '@/components/account/order-status-badge';
import { AdminTitle, Pager, Table, Td } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Input, Select } from '@/components/ui/field';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format';

const LIMIT = 25;
const STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'COMPLETED',
  'CANCELLED',
];

export default function AdminOrdersPage() {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [offset, setOffset] = useState(0);
  const query = new URLSearchParams({
    limit: String(LIMIT),
    offset: String(offset),
    ...(status && { status }),
    ...(search && { search }),
    ...(from && { from: new Date(from).toISOString() }),
    ...(to && { to: new Date(`${to}T23:59:59`).toISOString() }),
  });
  const list = useQuery({
    queryKey: ['admin', 'orders', query.toString()],
    queryFn: () => api<Page<AdminOrderListItem>>(`/admin/orders?${query}`),
    refetchInterval: 60_000,
  });
  const reset = () => setOffset(0);

  return (
    <div>
      <AdminTitle>{t.admin.orders}</AdminTitle>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          type="search"
          placeholder={t.common.search}
          aria-label={t.common.search}
          value={search}
          onChange={(e) => (setSearch(e.target.value), reset())}
        />
        <Select
          className="max-w-[220px]"
          aria-label={t.admin.status}
          value={status}
          onChange={(e) => (setStatus(e.target.value as OrderStatus | ''), reset())}
        >
          <option value="">{t.admin.all}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t.orderStatus[s]}
            </option>
          ))}
        </Select>
        <Input
          className="max-w-[170px]"
          type="date"
          aria-label={t.admin.from}
          value={from}
          onChange={(e) => (setFrom(e.target.value), reset())}
        />
        <Input
          className="max-w-[170px]"
          type="date"
          aria-label={t.admin.to}
          value={to}
          onChange={(e) => (setTo(e.target.value), reset())}
        />
      </div>
      {list.isLoading ? (
        <OrnamentLoader label={t.common.loading} />
      ) : (
        <>
          <Table
            head={[
              t.account.order,
              t.account.date,
              t.admin.customer,
              t.admin.count,
              t.account.total,
              t.account.status,
            ]}
          >
            {list.data?.data.map((o) => (
              <tr key={o.id} className="hover:bg-cream-50/60">
                <Td>
                  <Link
                    href={`/${locale}/admin/orders/${o.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {formatOrderNumber(o.orderNumber)}
                  </Link>
                </Td>
                <Td className="whitespace-nowrap text-ink-muted">
                  {formatDate(o.createdAt, locale, true)}
                </Td>
                <Td>
                  {o.customerName}
                  <div className="text-xs text-ink-soft">{o.customerPhone}</div>
                </Td>
                <Td>{o._count.items}</Td>
                <Td className="whitespace-nowrap">
                  {formatMoney(o.totalAmount, locale, t.common.som)}
                </Td>
                <Td>
                  <OrderStatusBadge status={o.status} />
                </Td>
              </tr>
            ))}
          </Table>
          {list.data && (
            <Pager
              total={list.data.meta.total}
              limit={LIMIT}
              offset={offset}
              onChange={setOffset}
              labels={{ prev: t.common.prev, next: t.common.next }}
            />
          )}
        </>
      )}
    </div>
  );
}
