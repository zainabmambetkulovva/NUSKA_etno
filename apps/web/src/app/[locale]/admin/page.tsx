'use client';

import type { Dashboard } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { AdminTitle, Stat } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { formatDate, formatMoney, formatOrderNumber } from '@/lib/format';

export default function AdminDashboard() {
  const { t, locale } = useI18n();
  const q = useQuery({
    queryKey: ['admin', 'dashboard', locale],
    queryFn: () => api<Dashboard>('/admin/dashboard?days=30', { locale }),
  });
  if (q.isLoading) return <OrnamentLoader label={t.common.loading} />;
  if (!q.data) return <ErrorBox>{errorMessage(q.error, t.errors)}</ErrorBox>;
  const d = q.data;
  const money = (amount: number) => formatMoney(amount, locale, t.common.som);
  const maxRevenue = Math.max(1, ...d.salesByDay.map((s) => s.orders));

  return (
    <div className="space-y-8">
      <AdminTitle>{t.admin.dashboard}</AdminTitle>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label={t.admin.newOrders} value={d.orders.new} />
        <Stat label={t.admin.ordersTotal} value={d.orders.total} />
        <Stat
          label={t.admin.revenue}
          value={money(d.revenue.total)}
          hint={`${t.admin.revenuePeriod}: ${money(d.revenue.period.amount)}`}
        />
        <Stat
          label={t.admin.usersTotal}
          value={d.usersTotal}
          hint={`${t.admin.activeProducts}: ${d.activeProducts}`}
        />
      </div>

      <section className="card p-6">
        <h2 className="mb-4 font-serif text-xl">{t.admin.salesByDay}</h2>
        <div className="flex h-40 items-end gap-1" role="img" aria-label={t.admin.salesByDay}>
          {d.salesByDay.map((s) => (
            <div key={s.date} className="group relative flex-1">
              <div
                className="rounded-t bg-brand/80 transition group-hover:bg-brand"
                style={{
                  height: `${(s.orders / maxRevenue) * 150}px`,
                  minHeight: s.orders ? 4 : 1,
                }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink px-2 py-1 text-xs text-white group-hover:block">
                {s.date}: {s.orders} · {money(s.revenue)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-6">
          <h2 className="mb-4 font-serif text-xl">{t.admin.newOrders}</h2>
          {d.latestNewOrders.length === 0 ? (
            <p className="text-sm text-ink-soft">{t.admin.noData}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.latestNewOrders.map((o) => (
                <li key={o.id} className="flex justify-between gap-2">
                  <Link
                    href={`/${locale}/admin/orders/${o.id}`}
                    className="text-brand hover:underline"
                  >
                    {formatOrderNumber(o.orderNumber)} · {o.customerName}
                  </Link>
                  <span className="text-ink-soft">{formatDate(o.createdAt, locale)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-6">
          <h2 className="mb-4 font-serif text-xl">{t.admin.popularProducts}</h2>
          {d.popularProducts.length === 0 ? (
            <p className="text-sm text-ink-soft">{t.admin.noData}</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {d.popularProducts.map((p) => (
                <li key={p.productId} className="flex justify-between gap-2">
                  <span>{p.name}</span>
                  <span className="text-ink-soft">
                    {p.quantity} · {money(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="card p-6">
          <h2 className="mb-4 font-serif text-xl">{t.admin.lowStock}</h2>
          {d.lowStock.length === 0 ? (
            <p className="text-sm text-ink-soft">{t.admin.noData}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {d.lowStock.map((p) => (
                <li key={p.id} className="flex justify-between gap-2">
                  <Link
                    href={`/${locale}/admin/products/${p.id}`}
                    className="text-brand hover:underline"
                  >
                    {p.name}
                  </Link>
                  <span className="font-semibold text-danger">{p.stockQuantity}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
