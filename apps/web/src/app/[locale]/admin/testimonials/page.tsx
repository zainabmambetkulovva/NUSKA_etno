'use client';

import { useState } from 'react';

import type { AdminTestimonial } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Stars } from '@/components/home/stars';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { Badge, ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { useToast } from '@/stores/toast';

type Form = {
  authorName: string;
  text: string;
  rating: number;
  reviewDate: string;
  photoUrl: string;
  avatarUrl: string;
  productName: string;
  instagramUrl: string;
  isPublished: boolean;
  isDemo: boolean;
  sortOrder: number;
};
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): Form => ({
  authorName: '',
  text: '',
  rating: 5,
  reviewDate: today(),
  photoUrl: '',
  avatarUrl: '',
  productName: '',
  instagramUrl: '',
  isPublished: true,
  isDemo: false,
  sortOrder: 0,
});

/** Image field: upload a file (stored in the image storage) or paste an https link. */
function ImageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { t } = useI18n();
  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('file', file);
      return api<{ url: string }>('/admin/uploads/image?folder=testimonials', {
        method: 'POST',
        body,
      });
    },
    onSuccess: (res) => onChange(res.url),
  });
  return (
    <Field label={label} error={upload.error ? errorMessage(upload.error, t.errors) : undefined}>
      {(id) => (
        <div className="flex items-center gap-3">
          {value && (
            <img src={value} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          )}
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id={id}
              type="url"
              placeholder="https://…"
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label={`${label}: ${t.admin.uploadImage}`}
              className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-brand"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      )}
    </Field>
  );
}

/**
 * Testimonials of the home page carousel: add, edit, delete, upload photos,
 * publish or hide. Sample entries ("demo") are labelled on the site.
 */
export default function AdminTestimonialsPage() {
  const { t, locale } = useI18n();
  const a = t.admin.testimonialsPage;
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const list = useQuery({
    queryKey: ['admin', 'testimonials'],
    queryFn: () => api<AdminTestimonial[]>('/admin/testimonials'),
  });
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'testimonials'] });
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = useMutation({
    mutationFn: () => {
      const body = {
        authorName: form.authorName,
        text: form.text,
        rating: Number(form.rating),
        reviewDate: form.reviewDate,
        photoUrl: form.photoUrl.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        productName: form.productName.trim() || null,
        instagramUrl: form.instagramUrl.trim() || null,
        isPublished: form.isPublished,
        isDemo: form.isDemo,
        sortOrder: Number(form.sortOrder) || 0,
      };
      return editing === 'new'
        ? api('/admin/testimonials', { method: 'POST', body })
        : api(`/admin/testimonials/${editing}`, { method: 'PATCH', body });
    },
    onSuccess: () => (toast(t.common.saved), setEditing(null), refresh()),
  });
  const quick = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      api(`/admin/testimonials/${id}`, { method: 'PATCH', body: { isPublished } }),
    onSuccess: () => refresh(),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/testimonials/${id}`, { method: 'DELETE' }),
    onSuccess: () => refresh(),
  });

  return (
    <div className="space-y-6">
      <AdminTitle
        action={<Button onClick={() => (setForm(emptyForm()), setEditing('new'))}>{a.new}</Button>}
      >
        {t.admin.testimonials}
      </AdminTitle>
      <p className="text-sm text-ink-muted">{a.hint}</p>

      {editing && (
        <form
          className="card grid gap-4 p-6 md:grid-cols-2"
          onSubmit={(e) => (e.preventDefault(), save.mutate())}
        >
          <Field label={a.authorName}>
            {(id) => (
              <Input
                id={id}
                required
                minLength={2}
                maxLength={80}
                value={form.authorName}
                onChange={(e) => set('authorName', e.target.value)}
              />
            )}
          </Field>
          <Field label={a.productName}>
            {(id) => (
              <Input
                id={id}
                maxLength={80}
                value={form.productName}
                onChange={(e) => set('productName', e.target.value)}
              />
            )}
          </Field>
          <Field label={a.text} className="md:col-span-2">
            {(id) => (
              <Textarea
                id={id}
                required
                rows={4}
                minLength={3}
                maxLength={1000}
                value={form.text}
                onChange={(e) => set('text', e.target.value)}
              />
            )}
          </Field>
          <Field label={a.rating}>
            {(id) => (
              <Select
                id={id}
                value={form.rating}
                onChange={(e) => set('rating', Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {'★'.repeat(n)} ({n})
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label={a.date}>
            {(id) => (
              <Input
                id={id}
                type="date"
                required
                value={form.reviewDate}
                onChange={(e) => set('reviewDate', e.target.value)}
              />
            )}
          </Field>
          <ImageInput label={a.photo} value={form.photoUrl} onChange={(v) => set('photoUrl', v)} />
          <ImageInput
            label={a.avatar}
            value={form.avatarUrl}
            onChange={(v) => set('avatarUrl', v)}
          />
          <Field label={a.instagram}>
            {(id) => (
              <Input
                id={id}
                type="url"
                placeholder="https://www.instagram.com/…"
                value={form.instagramUrl}
                onChange={(e) => set('instagramUrl', e.target.value)}
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
                onChange={(e) => set('sortOrder', Number(e.target.value))}
              />
            )}
          </Field>
          <Checkbox
            label={a.published}
            checked={form.isPublished}
            onChange={(e) => set('isPublished', e.target.checked)}
          />
          <Checkbox
            label={a.demo}
            checked={form.isDemo}
            onChange={(e) => set('isDemo', e.target.checked)}
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
      ) : list.error ? (
        <ErrorBox>{errorMessage(list.error, t.errors)}</ErrorBox>
      ) : (
        <div className="space-y-3">
          {list.data?.map((item) => (
            <div key={item.id} className="card flex flex-wrap items-start gap-4 p-5">
              {item.photoUrl && (
                <img src={item.photoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{item.authorName}</span>
                  <Stars value={item.rating} />
                  <Badge tone={item.isPublished ? 'green' : 'gray'}>
                    {item.isPublished ? a.published : a.hidden}
                  </Badge>
                  {item.isDemo && <Badge tone="cream">{a.demoBadge}</Badge>}
                  {item.productName && <Badge tone="cream">{item.productName}</Badge>}
                </div>
                <p className="line-clamp-2 text-sm text-ink-muted">{item.text}</p>
                <p className="text-xs text-ink-soft">{formatDate(item.reviewDate, locale)}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm">
                <button
                  type="button"
                  className="text-brand hover:underline"
                  onClick={() => quick.mutate({ id: item.id, isPublished: !item.isPublished })}
                >
                  {item.isPublished ? a.hide : a.publish}
                </button>
                <button
                  type="button"
                  className="text-brand hover:underline"
                  onClick={() => {
                    setForm({
                      authorName: item.authorName,
                      text: item.text,
                      rating: item.rating,
                      reviewDate: item.reviewDate,
                      photoUrl: item.photoUrl ?? '',
                      avatarUrl: item.avatarUrl ?? '',
                      productName: item.productName ?? '',
                      instagramUrl: item.instagramUrl ?? '',
                      isPublished: item.isPublished,
                      isDemo: item.isDemo,
                      sortOrder: item.sortOrder,
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
          ))}
        </div>
      )}
    </div>
  );
}
