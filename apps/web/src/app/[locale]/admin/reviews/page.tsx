'use client';

import { useState } from 'react';

import type { AdminReview, Page, ReviewStatus } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle, Pager } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Stars } from '@/components/home/stars';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Badge, EmptyState } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { useToast } from '@/stores/toast';

const LIMIT = 20;

export default function AdminReviewsPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [status, setStatus] = useState<ReviewStatus | ''>('PENDING');
  const [offset, setOffset] = useState(0);
  const query = new URLSearchParams({
    limit: String(LIMIT),
    offset: String(offset),
    ...(status && { status }),
  });
  const list = useQuery({
    queryKey: ['admin', 'reviews', query.toString()],
    queryFn: () => api<Page<AdminReview>>(`/admin/reviews?${query}`),
  });
  const moderate = useMutation({
    mutationFn: ({ id, status: next }: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api(`/admin/reviews/${id}`, { method: 'PATCH', body: { status: next } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] }),
    onError: (e) => toast(errorMessage(e, t.errors), 'error'),
  });

  return (
    <div>
      <AdminTitle>{t.admin.reviews}</AdminTitle>
      <Select
        className="mb-4 max-w-[220px]"
        aria-label={t.admin.status}
        value={status}
        onChange={(e) => (setStatus(e.target.value as ReviewStatus | ''), setOffset(0))}
      >
        <option value="">{t.admin.all}</option>
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <option key={s} value={s}>
            {t.admin.reviewStatuses[s]}
          </option>
        ))}
      </Select>
      {list.isLoading ? (
        <OrnamentLoader label={t.common.loading} />
      ) : !list.data?.data.length ? (
        <EmptyState title={t.admin.noData} />
      ) : (
        <>
          <ul className="space-y-3">
            {list.data.data.map((r) => (
              <li key={r.id} className="card space-y-2 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{r.orderItem.productName}</span>
                  <Badge
                    tone={
                      r.status === 'APPROVED' ? 'green' : r.status === 'REJECTED' ? 'red' : 'cream'
                    }
                  >
                    {t.admin.reviewStatuses[r.status]}
                  </Badge>
                </div>
                <Stars value={r.rating} />
                {r.comment && <p className="text-ink">{r.comment}</p>}
                <div className="text-xs text-ink-soft">
                  {r.user.email} · {formatDate(r.createdAt, locale, true)}
                </div>
                <div className="flex gap-2 pt-1">
                  {r.status !== 'APPROVED' && (
                    <Button
                      size="sm"
                      onClick={() => moderate.mutate({ id: r.id, status: 'APPROVED' })}
                    >
                      {t.admin.approve}
                    </Button>
                  )}
                  {r.status !== 'REJECTED' && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => moderate.mutate({ id: r.id, status: 'REJECTED' })}
                    >
                      {t.admin.reject}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <Pager
            total={list.data.meta.total}
            limit={LIMIT}
            offset={offset}
            onChange={setOffset}
            labels={{ prev: t.common.prev, next: t.common.next }}
          />
        </>
      )}
    </div>
  );
}
