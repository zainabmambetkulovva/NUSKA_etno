'use client';

import { useState } from 'react';

import type { AdminUser, Page } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle, Pager, Table, Td } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Input } from '@/components/ui/field';
import { Badge } from '@/components/ui/misc';
import { useMe } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { useToast } from '@/stores/toast';

const LIMIT = 25;

export default function AdminUsersPage() {
  const { t, locale } = useI18n();
  const me = useMe();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const query = new URLSearchParams({
    limit: String(LIMIT),
    offset: String(offset),
    ...(search && { search }),
  });
  const list = useQuery({
    queryKey: ['admin', 'users', query.toString()],
    queryFn: () => api<Page<AdminUser>>(`/admin/users?${query}`),
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { role?: string; isActive?: boolean } }) =>
      api(`/admin/users/${id}`, { method: 'PATCH', body }),
    onSuccess: () => (
      toast(t.common.saved),
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    ),
    onError: (e) => toast(errorMessage(e, t.errors), 'error'),
  });

  return (
    <div>
      <AdminTitle>{t.admin.users}</AdminTitle>
      <Input
        className="mb-4 max-w-xs"
        type="search"
        placeholder={t.common.search}
        aria-label={t.common.search}
        value={search}
        onChange={(e) => (setSearch(e.target.value), setOffset(0))}
      />
      {list.isLoading ? (
        <OrnamentLoader label={t.common.loading} />
      ) : (
        <>
          <Table
            head={[
              t.admin.name,
              t.admin.email,
              t.admin.phone,
              t.admin.orders,
              t.admin.role,
              t.admin.status,
              t.admin.actions,
            ]}
          >
            {list.data?.data.map((u) => {
              const self = u.id === me.data?.id;
              return (
                <tr key={u.id}>
                  <Td className="font-medium">
                    {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                    <div className="text-xs text-ink-soft">{formatDate(u.createdAt, locale)}</div>
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>{u.phone ?? '—'}</Td>
                  <Td>{u.ordersCount ?? 0}</Td>
                  <Td>
                    <Badge tone={u.role === 'ADMIN' ? 'olive' : 'cream'}>
                      {t.admin.roles[u.role]}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={u.isActive ? 'green' : 'red'}>
                      {u.isActive ? t.admin.active : t.admin.inactive}
                    </Badge>
                  </Td>
                  <Td className="space-x-3 whitespace-nowrap">
                    {!self && (
                      <>
                        <button
                          type="button"
                          className="text-brand hover:underline"
                          onClick={() =>
                            window.confirm(`${u.isActive ? t.admin.block : t.admin.unblock}?`) &&
                            update.mutate({ id: u.id, body: { isActive: !u.isActive } })
                          }
                        >
                          {u.isActive ? t.admin.block : t.admin.unblock}
                        </button>
                        <button
                          type="button"
                          className="text-olive hover:underline"
                          onClick={() =>
                            window.confirm(
                              `${u.role === 'ADMIN' ? t.admin.makeUser : t.admin.makeAdmin}?`
                            ) &&
                            update.mutate({
                              id: u.id,
                              body: { role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' },
                            })
                          }
                        >
                          {u.role === 'ADMIN' ? t.admin.makeUser : t.admin.makeAdmin}
                        </button>
                      </>
                    )}
                  </Td>
                </tr>
              );
            })}
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
