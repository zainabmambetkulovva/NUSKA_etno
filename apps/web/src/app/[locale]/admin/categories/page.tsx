'use client';

import { useState } from 'react';

import type { AdminCategory, Locale } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle, Table, Td } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Badge, ErrorBox } from '@/components/ui/misc';
import { locales, localeNames } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useToast } from '@/stores/toast';

interface FormState {
  slug: string;
  parentId: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  translations: Record<Locale, { name: string; description: string }>;
}

const emptyForm = (): FormState => ({
  slug: '',
  parentId: '',
  imageUrl: '',
  sortOrder: 0,
  isActive: true,
  translations: { ky: { name: '', description: '' }, ru: { name: '', description: '' } },
});

function fromCategory(c: AdminCategory): FormState {
  const tr = (l: Locale) => c.translations.find((x) => x.locale === l);
  return {
    slug: c.slug,
    parentId: c.parentId ?? '',
    imageUrl: c.imageUrl ?? '',
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    translations: {
      ky: { name: tr('ky')?.name ?? '', description: tr('ky')?.description ?? '' },
      ru: { name: tr('ru')?.name ?? '', description: tr('ru')?.description ?? '' },
    },
  };
}

export default function AdminCategoriesPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const list = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api<AdminCategory[]>('/admin/categories'),
  });
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        slug: form.slug,
        parentId: form.parentId || null,
        imageUrl: form.imageUrl || null,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        translations: locales
          .filter((l) => form.translations[l].name.trim())
          .map((l) => ({
            locale: l,
            name: form.translations[l].name.trim(),
            description: form.translations[l].description.trim() || null,
          })),
      };
      return editing === 'new'
        ? api('/admin/categories', { method: 'POST', body })
        : api(`/admin/categories/${editing}`, { method: 'PATCH', body });
    },
    onSuccess: () => (toast(t.common.saved), setEditing(null), refresh()),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/categories/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
    onError: (e) => toast(errorMessage(e, t.errors), 'error'),
  });

  const name = (c: AdminCategory) =>
    c.translations.find((x) => x.locale === locale)?.name ?? c.slug;
  const setTr = (l: Locale, field: 'name' | 'description', value: string) =>
    setForm((f) => ({
      ...f,
      translations: { ...f.translations, [l]: { ...f.translations[l], [field]: value } },
    }));

  return (
    <div className="space-y-6">
      <AdminTitle
        action={
          <Button onClick={() => (setForm(emptyForm()), setEditing('new'))}>
            {t.admin.newCategory}
          </Button>
        }
      >
        {t.admin.categories}
      </AdminTitle>

      {editing && (
        <form className="card space-y-4 p-6" onSubmit={(e) => (e.preventDefault(), save.mutate())}>
          <div className="grid gap-4 md:grid-cols-2">
            {locales.map((l) => (
              <div key={l} className="space-y-3">
                <Field label={`${t.admin.name} (${localeNames[l]})`}>
                  {(id) => (
                    <Input
                      id={id}
                      maxLength={150}
                      value={form.translations[l].name}
                      onChange={(e) => setTr(l, 'name', e.target.value)}
                    />
                  )}
                </Field>
                <Field label={`${t.admin.description} (${localeNames[l]})`}>
                  {(id) => (
                    <Textarea
                      id={id}
                      rows={2}
                      maxLength={2000}
                      value={form.translations[l].description}
                      onChange={(e) => setTr(l, 'description', e.target.value)}
                    />
                  )}
                </Field>
              </div>
            ))}
            <Field label={t.admin.slug}>
              {(id) => (
                <Input
                  id={id}
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              )}
            </Field>
            <Field label={t.admin.parent}>
              {(id) => (
                <Select
                  id={id}
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                >
                  <option value="">{t.admin.noParent}</option>
                  {list.data
                    ?.filter((c) => c.id !== editing)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {name(c)}
                      </option>
                    ))}
                </Select>
              )}
            </Field>
            <Field label={t.admin.imageUrl}>
              {(id) => (
                <Input
                  id={id}
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
              )}
            </Field>
            <Field label={t.admin.sortOrder}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                />
              )}
            </Field>
          </div>
          <Checkbox
            label={t.admin.active}
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          {save.error && <ErrorBox>{errorMessage(save.error, t.errors)}</ErrorBox>}
          <div className="flex gap-2">
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
        <Table
          head={[
            t.admin.name,
            t.admin.slug,
            t.admin.parent,
            t.admin.sortOrder,
            t.admin.status,
            t.admin.actions,
          ]}
        >
          {list.data?.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{name(c)}</Td>
              <Td className="text-ink-muted">{c.slug}</Td>
              <Td>{c.parentId ? name(list.data!.find((p) => p.id === c.parentId)!) : '—'}</Td>
              <Td>{c.sortOrder}</Td>
              <Td>
                <Badge tone={c.isActive ? 'green' : 'gray'}>
                  {c.isActive ? t.admin.active : t.admin.inactive}
                </Badge>
              </Td>
              <Td className="space-x-3 whitespace-nowrap">
                <button
                  type="button"
                  className="text-brand hover:underline"
                  onClick={() => (setForm(fromCategory(c)), setEditing(c.id))}
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  className="text-danger hover:underline"
                  onClick={() => window.confirm(t.admin.deleteConfirm) && remove.mutate(c.id)}
                >
                  {t.common.delete}
                </button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
