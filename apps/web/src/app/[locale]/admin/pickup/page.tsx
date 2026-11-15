'use client';

import { useState } from 'react';

import type { AdminPickupLocation } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { Badge, ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useToast } from '@/stores/toast';

type Form = {
  name: string;
  address: string;
  description: string;
  phone: string;
  openingHours: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
  sortOrder: number;
};
const empty: Form = {
  name: '',
  address: '',
  description: '',
  phone: '',
  openingHours: '',
  latitude: '',
  longitude: '',
  isActive: true,
  sortOrder: 0,
};

export default function AdminPickupPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const list = useQuery({
    queryKey: ['admin', 'pickup'],
    queryFn: () => api<AdminPickupLocation[]>('/admin/pickup-locations'),
  });
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: form.name,
        address: form.address,
        description: form.description || null,
        phone: form.phone || null,
        openingHours: form.openingHours || null,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
      };
      return editing === 'new'
        ? api('/admin/pickup-locations', { method: 'POST', body })
        : api(`/admin/pickup-locations/${editing}`, { method: 'PATCH', body });
    },
    onSuccess: () => (
      toast(t.common.saved),
      setEditing(null),
      queryClient.invalidateQueries({ queryKey: ['admin', 'pickup'] })
    ),
  });
  const set = (key: keyof Form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div className="space-y-6">
      <AdminTitle
        action={
          <Button onClick={() => (setForm(empty), setEditing('new'))}>{t.admin.newPickup}</Button>
        }
      >
        {t.admin.pickup}
      </AdminTitle>
      {editing && (
        <form
          className="card grid gap-4 p-6 md:grid-cols-2"
          onSubmit={(e) => (e.preventDefault(), save.mutate())}
        >
          <Field label={t.admin.name}>
            {(id) => (
              <Input id={id} required maxLength={150} value={form.name} onChange={set('name')} />
            )}
          </Field>
          <Field label={t.admin.address}>
            {(id) => (
              <Input
                id={id}
                required
                maxLength={300}
                value={form.address}
                onChange={set('address')}
              />
            )}
          </Field>
          <Field label={t.admin.phone}>
            {(id) => <Input id={id} type="tel" value={form.phone} onChange={set('phone')} />}
          </Field>
          <Field label={t.admin.openingHours}>
            {(id) => (
              <Input
                id={id}
                maxLength={300}
                value={form.openingHours}
                onChange={set('openingHours')}
              />
            )}
          </Field>
          <Field label={t.admin.latitude}>
            {(id) => (
              <Input
                id={id}
                type="number"
                step="0.000001"
                min={-90}
                max={90}
                value={form.latitude}
                onChange={set('latitude')}
              />
            )}
          </Field>
          <Field label={t.admin.longitude}>
            {(id) => (
              <Input
                id={id}
                type="number"
                step="0.000001"
                min={-180}
                max={180}
                value={form.longitude}
                onChange={set('longitude')}
              />
            )}
          </Field>
          <Field label={t.admin.description} className="md:col-span-2">
            {(id) => (
              <Textarea
                id={id}
                maxLength={1000}
                value={form.description}
                onChange={set('description')}
              />
            )}
          </Field>
          <Checkbox
            label={t.admin.active}
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          {save.error && (
            <div className="md:col-span-2">
              <ErrorBox>{errorMessage(save.error, t.errors)}</ErrorBox>
            </div>
          )}
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" loading={save.isPending}>
              {t.common.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t.common.cancel}
            </Button>
          </div>
        </form>
      )}
      {list.isLoading ? (
        <OrnamentLoader label={t.common.loading} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.data?.map((p) => (
            <div key={p.id} className="card space-y-2 p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-lg">{p.name}</h2>
                <Badge tone={p.isActive ? 'green' : 'gray'}>
                  {p.isActive ? t.admin.active : t.admin.inactive}
                </Badge>
              </div>
              <p className="text-sm text-ink-muted">{p.address}</p>
              {p.openingHours && <p className="text-sm text-ink-soft">{p.openingHours}</p>}
              <button
                type="button"
                className="text-sm text-brand hover:underline"
                onClick={() => (
                  setForm({
                    name: p.name,
                    address: p.address,
                    description: p.description ?? '',
                    phone: p.phone ?? '',
                    openingHours: p.openingHours ?? '',
                    latitude: p.latitude?.toString() ?? '',
                    longitude: p.longitude?.toString() ?? '',
                    isActive: p.isActive,
                    sortOrder: p.sortOrder,
                  }),
                  setEditing(p.id)
                )}
              >
                {t.common.edit}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
