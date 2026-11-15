'use client';

import { useState } from 'react';

import type { AdminNewsletterSubscriber, NewsletterStatus, Page } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle, Pager, Table, Td } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { buttonClass } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { Badge } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { formatDate } from '@/lib/format';

const LIMIT = 50;
const TONES: Record<NewsletterStatus, 'green' | 'cream' | 'gray'> = {
  ACTIVE: 'green',
  PENDING: 'cream',
  UNSUBSCRIBED: 'gray',
};

export default function AdminNewsletterPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<NewsletterStatus | ''>('');
  const [offset, setOffset] = useState(0);
  const list = useQuery({
    queryKey: ['admin', 'newsletter', status, offset],
    queryFn: () =>
      api<Page<AdminNewsletterSubscriber>>(
        `/admin/newsletter?limit=${LIMIT}&offset=${offset}${status ? `&status=${status}` : ''}`
      ),
  });
  const unsubscribe = useMutation({
    mutationFn: (id: string) => api(`/admin/newsletter/${id}/unsubscribe`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'newsletter'] }),
  });

  return (
    <div className="space-y-6">
      <AdminTitle
        action={
          <a href="/api/admin/newsletter/export" download className={buttonClass('outline', 'sm')}>
            {t.admin.exportCsv}
          </a>
        }
      >
        {t.admin.newsletter}
      </AdminTitle>
      <Select
        aria-label={t.admin.status}
        className="max-w-xs"
        value={status}
        onChange={(e) => (setStatus(e.target.value as NewsletterStatus | ''), setOffset(0))}
      >
        <option value="">{t.admin.all}</option>
        {(Object.keys(TONES) as NewsletterStatus[]).map((s) => (
          <option key={s} value={s}>
            {t.admin.subscriberStatuses[s]}
          </option>
        ))}
      </Select>
      {list.isLoading || !list.data ? (
        <OrnamentLoader label={t.common.loading} />
      ) : (
        <>
          <Table head={[t.admin.email, t.admin.language, t.admin.status, t.admin.consentAt, '']}>
            {list.data.data.map((s) => (
              <tr key={s.id}>
                <Td>{s.email}</Td>
                <Td className="uppercase">{s.locale}</Td>
                <Td>
                  <Badge tone={TONES[s.status]}>{t.admin.subscriberStatuses[s.status]}</Badge>
                </Td>
                <Td>{formatDate(s.consentAt, locale, true)}</Td>
                <Td>
                  {s.status !== 'UNSUBSCRIBED' && (
                    <button
                      type="button"
                      className="text-sm text-danger hover:underline"
                      onClick={() => unsubscribe.mutate(s.id)}
                    >
                      {t.admin.unsubscribe}
                    </button>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
          {list.data.data.length === 0 && <p className="text-ink-soft">{t.admin.noData}</p>}
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
