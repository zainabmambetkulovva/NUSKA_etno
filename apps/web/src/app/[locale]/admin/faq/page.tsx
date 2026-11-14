'use client';

import { useState } from 'react';

import type { AdminFaqItem, Locale } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Badge, ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useToast } from '@/stores/toast';

const LOCALES: Locale[] = ['ky', 'ru'];
const CATEGORIES = ['orders', 'pickup', 'products', 'account', 'other'];

type Form = {
  category: string;
  sortOrder: number;
  isActive: boolean;
  text: Record<Locale, { question: string; answer: string }>;
};
const empty: Form = {
  category: 'other',
  sortOrder: 0,
  isActive: true,
  text: { ky: { question: '', answer: '' }, ru: { question: '', answer: '' } },
};

/** FAQ editor (KY/RU). Every change is written to the audit log on the server. */
export default function AdminFaqPage() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const list = useQuery({
    queryKey: ['admin', 'faq'],
    queryFn: () => api<AdminFaqItem[]>('/admin/faq'),
  });
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'faq'] });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        category: form.category,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        translations: LOCALES.filter((l) => form.text[l].question.trim()).map((l) => ({
          locale: l,
          question: form.text[l].question,
          answer: form.text[l].answer,
        })),
      };
      return editing === 'new'
        ? api('/admin/faq', { method: 'POST', body })
        : api(`/admin/faq/${editing}`, { method: 'PATCH', body });
    },
    onSuccess: () => (toast(t.common.saved), setEditing(null), refresh()),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/faq/${id}`, { method: 'DELETE' }),
    onSuccess: () => refresh(),
  });
  const setText = (l: Locale, key: 'question' | 'answer') => (e: { target: { value: string } }) =>
    setForm({ ...form, text: { ...form.text, [l]: { ...form.text[l], [key]: e.target.value } } });

  return (
    <div className="space-y-6">
      <AdminTitle
        action={
          <Button onClick={() => (setForm(empty), setEditing('new'))}>{t.admin.newFaq}</Button>
        }
      >
        {t.admin.faq}
      </AdminTitle>

      {editing && (
        <form
          className="card grid gap-4 p-6 md:grid-cols-2"
          onSubmit={(e) => (e.preventDefault(), save.mutate())}
        >
          <Field label={t.admin.faqCategory}>
            {(id) => (
              <Select
                id={id}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t.faq.categories[c] ?? c}
                  </option>
                ))}
              </Select>
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
          {LOCALES.map((l) => (
            <fieldset key={l} className="space-y-3 rounded-xl border border-cream-dark/60 p-4">
              <legend className="px-1 text-sm font-semibold uppercase">{l}</legend>
              <Field label={t.admin.question}>
                {(id) => (
                  <Input
                    id={id}
                    maxLength={300}
                    value={form.text[l].question}
                    onChange={setText(l, 'question')}
                  />
                )}
              </Field>
              <Field label={t.admin.answer}>
                {(id) => (
                  <Textarea
                    id={id}
                    rows={4}
                    maxLength={5000}
                    value={form.text[l].answer}
                    onChange={setText(l, 'answer')}
                  />
                )}
              </Field>
            </fieldset>
          ))}
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
        <div className="space-y-3">
          {list.data?.map((item) => {
            const tr = item.translations.find((x) => x.locale === locale) ?? item.translations[0];
            return (
              <div key={item.id} className="card flex flex-wrap items-start gap-4 p-5">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="cream">{t.faq.categories[item.category] ?? item.category}</Badge>
                    <Badge tone={item.isActive ? 'green' : 'gray'}>
                      {item.isActive ? t.admin.active : t.admin.inactive}
                    </Badge>
                  </div>
                  <p className="font-medium">{tr?.question}</p>
                  <p className="line-clamp-2 text-sm text-ink-muted">{tr?.answer}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button
                    type="button"
                    className="text-brand hover:underline"
                    onClick={() => {
                      const text = { ...empty.text };
                      for (const l of LOCALES) {
                        const x = item.translations.find((y) => y.locale === l);
                        text[l] = { question: x?.question ?? '', answer: x?.answer ?? '' };
                      }
                      setForm({
                        category: item.category,
                        sortOrder: item.sortOrder,
                        isActive: item.isActive,
                        text,
                      });
                      setEditing(item.id);
                    }}
                  >
                    {t.common.edit}
                  </button>
                  <button
                    type="button"
                    className="text-danger hover:underline"
                    onClick={() => window.confirm(t.admin.confirmDelete) && remove.mutate(item.id)}
                  >
                    {t.common.delete}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
