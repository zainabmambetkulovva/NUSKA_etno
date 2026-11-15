'use client';

import { useState } from 'react';

import type { AdminProduct, Page, ProductStatus } from '@nuska/types';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { AdminTitle, Pager, Table, Td } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { ButtonLink } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/field';
import { Badge } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { formatMoney } from '@/lib/format';

const LIMIT = 25;

export default function AdminProductsPage() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus | ''>('');
  const [offset, setOffset] = useState(0);
  const query = new URLSearchParams({
    limit: String(LIMIT),
    offset: String(offset),
    ...(search && { search }),
    ...(status && { status }),
  });
  const list = useQuery({
    queryKey: ['admin', 'products', query.toString()],
    queryFn: () => api<Page<AdminProduct>>(`/admin/products?${query}`),
  });
  const name = (p: AdminProduct) =>
    p.translations.find((x) => x.locale === locale)?.name ?? p.translations[0]?.name ?? p.sku;

  return (
    <div>
      <AdminTitle
        action={
          <ButtonLink href={`/${locale}/admin/products/new`}>{t.admin.newProduct}</ButtonLink>
        }
      >
        {t.admin.products}
      </AdminTitle>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          type="search"
          placeholder={t.common.search}
          aria-label={t.common.search}
          value={search}
          onChange={(e) => (setSearch(e.target.value), setOffset(0))}
        />
        <Select
          className="max-w-[200px]"
          aria-label={t.admin.status}
          value={status}
          onChange={(e) => (setStatus(e.target.value as ProductStatus | ''), setOffset(0))}
        >
          <option value="">{t.admin.all}</option>
          {(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
            <option key={s} value={s}>
              {t.admin.statuses[s]}
            </option>
          ))}
        </Select>
      </div>
      {list.isLoading ? (
        <OrnamentLoader label={t.common.loading} />
      ) : (
        <>
          <Table head={[t.admin.name, t.admin.sku, t.admin.price, t.admin.stock, t.admin.status]}>
            {list.data?.data.map((p) => (
              <tr key={p.id} className="hover:bg-cream-50/60">
                <Td>
                  <Link
                    href={`/${locale}/admin/products/${p.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {name(p)}
                  </Link>
                </Td>
                <Td className="text-ink-muted">{p.sku}</Td>
                <Td>{formatMoney(p.priceAmount, locale, t.common.som)}</Td>
                <Td>
                  {p.trackInventory ? (
                    p.stockQuantity
                  ) : (
                    <span className="text-ink-soft">{t.admin.notTracked}</span>
                  )}
                </Td>
                <Td>
                  <Badge
                    tone={p.status === 'ACTIVE' ? 'green' : p.status === 'DRAFT' ? 'cream' : 'gray'}
                  >
                    {t.admin.statuses[p.status]}
                  </Badge>
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
