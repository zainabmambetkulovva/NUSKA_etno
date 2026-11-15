'use client';

import type { Notification, Page } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { BellIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const key = ['notifications'];
  const list = useQuery({
    queryKey: key,
    queryFn: () => api<Page<Notification> & { unreadCount: number }>('/notifications?limit=50'),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });
  const readAll = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'POST' }),
    onSuccess: refresh,
  });
  const read = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: refresh,
  });

  if (list.isLoading) return <OrnamentLoader label={t.common.loading} />;
  if (!list.data?.data.length) return <EmptyState title={t.account.notificationsEmpty} />;

  return (
    <div className="space-y-4">
      {list.data.unreadCount > 0 && (
        <Button size="sm" variant="ghost" onClick={() => readAll.mutate()}>
          {t.account.markAllRead}
        </Button>
      )}
      <ul className="space-y-3">
        {list.data.data.map((n) => (
          <li
            key={n.id}
            className={cn('card flex gap-4 p-5', !n.isRead && 'border-brand/40 bg-brand-50/40')}
          >
            <BellIcon className={n.isRead ? 'text-ink-soft' : 'text-brand'} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="font-medium">{n.title}</div>
              <p className="text-sm text-ink-muted">{n.message}</p>
              <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
                <span>{formatDate(n.createdAt, locale, true)}</span>
                {n.relatedOrder && (
                  <Link
                    href={`/${locale}/account/orders/${n.relatedOrder.id}`}
                    className="text-brand hover:underline"
                  >
                    {t.account.details}
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    type="button"
                    className="text-brand hover:underline"
                    onClick={() => read.mutate(n.id)}
                  >
                    ✓
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
