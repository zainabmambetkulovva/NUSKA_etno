'use client';

import { useState } from 'react';

import type { AdminBanner, AdminSiteContent, Locale } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/field';
import { Badge, ErrorBox } from '@/components/ui/misc';
import { locales, localeNames } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { useToast } from '@/stores/toast';

type Tr = Record<Locale, { title: string; subtitle: string; buttonLabel: string }>;
const emptyTr = (): Tr => ({
  ky: { title: '', subtitle: '', buttonLabel: '' },
  ru: { title: '', subtitle: '', buttonLabel: '' },
});

function Banners() {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const list = useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => api<AdminBanner[]>('/admin/content/banners'),
  });
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setActive] = useState(true);
  const [tr, setTr] = useState<Tr>(emptyTr());
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
  const save = useMutation({
    mutationFn: () => {
      const body = {
        linkUrl: linkUrl || null,
        imageUrl: imageUrl || null,
        isActive,
        translations: locales
          .filter((l) => tr[l].title.trim())
          .map((l) => ({
            locale: l,
            title: tr[l].title,
            subtitle: tr[l].subtitle || null,
            buttonLabel: tr[l].buttonLabel || null,
          })),
      };
      return editing === 'new'
        ? api('/admin/content/banners', { method: 'POST', body })
        : api(`/admin/content/banners/${editing}`, { method: 'PATCH', body });
    },
    onSuccess: () => (toast(t.common.saved), setEditing(null), refresh()),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/content/banners/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });
  const open = (b?: AdminBanner) => {
    setEditing(b?.id ?? 'new');
    setLinkUrl(b?.linkUrl ?? '');
    setImageUrl(b?.imageUrl ?? '');
    setActive(b?.isActive ?? true);
    const next = emptyTr();
    b?.translations.forEach(
      (x) =>
        (next[x.locale] = {
          title: x.title,
          subtitle: x.subtitle ?? '',
          buttonLabel: x.buttonLabel ?? '',
        })
    );
    setTr(next);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl">{t.admin.banners}</h2>
        <Button size="sm" onClick={() => open()}>
          {t.admin.newBanner}
        </Button>
      </div>
      {editing && (
        <form className="card space-y-4 p-6" onSubmit={(e) => (e.preventDefault(), save.mutate())}>
          <div className="grid gap-4 md:grid-cols-2">
            {locales.map((l) => (
              <div key={l} className="space-y-3">
                <Field label={`${t.admin.bannerTitle} (${localeNames[l]})`}>
                  {(id) => (
                    <Input
                      id={id}
                      maxLength={200}
                      value={tr[l].title}
                      onChange={(e) => setTr({ ...tr, [l]: { ...tr[l], title: e.target.value } })}
                    />
                  )}
                </Field>
                <Field label={`${t.admin.subtitle} (${localeNames[l]})`}>
                  {(id) => (
                    <Input
                      id={id}
                      maxLength={500}
                      value={tr[l].subtitle}
                      onChange={(e) =>
                        setTr({ ...tr, [l]: { ...tr[l], subtitle: e.target.value } })
                      }
                    />
                  )}
                </Field>
                <Field label={`${t.admin.buttonLabel} (${localeNames[l]})`}>
                  {(id) => (
                    <Input
                      id={id}
                      maxLength={60}
                      value={tr[l].buttonLabel}
                      onChange={(e) =>
                        setTr({ ...tr, [l]: { ...tr[l], buttonLabel: e.target.value } })
                      }
                    />
                  )}
                </Field>
              </div>
            ))}
            <Field label={t.admin.linkUrl} hint="/catalog">
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              )}
            </Field>
            <Field label={t.admin.imageUrl}>
              {(id) => (
                <Input
                  id={id}
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              )}
            </Field>
          </div>
          <Checkbox
            label={t.admin.active}
            checked={isActive}
            onChange={(e) => setActive(e.target.checked)}
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
        <ul className="space-y-2">
          {list.data?.map((b) => (
            <li key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <span className="font-medium">
                {b.translations.find((x) => x.locale === locale)?.title ?? b.translations[0]?.title}
              </span>
              <span className="flex items-center gap-3">
                <Badge tone={b.isActive ? 'green' : 'gray'}>
                  {b.isActive ? t.admin.active : t.admin.inactive}
                </Badge>
                <button
                  type="button"
                  className="text-sm text-brand hover:underline"
                  onClick={() => open(b)}
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  className="text-sm text-danger hover:underline"
                  onClick={() => window.confirm(t.admin.deleteConfirm) && remove.mutate(b.id)}
                >
                  {t.common.delete}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Blocks() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const list = useQuery({
    queryKey: ['admin', 'blocks'],
    queryFn: () => api<AdminSiteContent[]>('/admin/content/blocks'),
  });
  const [key, setKey] = useState('');
  const [data, setData] = useState('');
  const [tr, setTr] = useState<Record<Locale, { title: string; body: string }>>({
    ky: { title: '', body: '' },
    ru: { title: '', body: '' },
  });
  const [jsonError, setJsonError] = useState(false);
  const save = useMutation({
    mutationFn: (payload: unknown) =>
      api(`/admin/content/blocks/${encodeURIComponent(key)}`, { method: 'PUT', body: payload }),
    onSuccess: () => (
      toast(t.common.saved),
      queryClient.invalidateQueries({ queryKey: ['admin', 'blocks'] })
    ),
  });
  const open = (b: AdminSiteContent) => {
    setKey(b.key);
    setData(b.data ? JSON.stringify(b.data, null, 2) : '');
    const next = { ky: { title: '', body: '' }, ru: { title: '', body: '' } };
    b.translations.forEach((x) => (next[x.locale] = { title: x.title ?? '', body: x.body ?? '' }));
    setTr(next);
  };
  const submit = () => {
    let parsed: unknown = null;
    if (data.trim()) {
      try {
        parsed = JSON.parse(data);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object');
      } catch {
        setJsonError(true);
        return;
      }
    }
    setJsonError(false);
    save.mutate({
      data: parsed,
      translations: locales.map((l) => ({
        locale: l,
        title: tr[l].title || null,
        body: tr[l].body || null,
      })),
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl">{t.admin.blocks}</h2>
      <p className="text-sm text-ink-soft">{t.admin.blockHint}</p>
      <div className="flex flex-wrap gap-2">
        {list.data?.map((b) => (
          <Button
            key={b.id}
            size="sm"
            variant={b.key === key ? 'primary' : 'outline'}
            onClick={() => open(b)}
          >
            {b.key}
          </Button>
        ))}
      </div>
      <form className="card space-y-4 p-6" onSubmit={(e) => (e.preventDefault(), submit())}>
        <Field label={t.admin.blockKey}>
          {(id) => (
            <Input
              id={id}
              required
              pattern="[a-z0-9]+([.\-][a-z0-9]+)*"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          )}
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          {locales.map((l) => (
            <div key={l} className="space-y-3">
              <Field label={`${t.admin.blockTitle} (${localeNames[l]})`}>
                {(id) => (
                  <Input
                    id={id}
                    maxLength={300}
                    value={tr[l].title}
                    onChange={(e) => setTr({ ...tr, [l]: { ...tr[l], title: e.target.value } })}
                  />
                )}
              </Field>
              <Field label={`${t.admin.blockBody} (${localeNames[l]})`}>
                {(id) => (
                  <Textarea
                    id={id}
                    rows={6}
                    maxLength={20000}
                    value={tr[l].body}
                    onChange={(e) => setTr({ ...tr, [l]: { ...tr[l], body: e.target.value } })}
                  />
                )}
              </Field>
            </div>
          ))}
        </div>
        <Field
          label={t.admin.blockData}
          hint='{"phone": "+996…", "email": "…", "instagram": "nuska_etno"}'
          error={jsonError ? t.admin.invalidJson : undefined}
        >
          {(id, d) => (
            <Textarea
              id={id}
              aria-describedby={d}
              rows={4}
              className="font-mono text-sm"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          )}
        </Field>
        {save.error && <ErrorBox>{errorMessage(save.error, t.errors)}</ErrorBox>}
        <Button type="submit" loading={save.isPending} disabled={!key}>
          {t.common.save}
        </Button>
      </form>
    </section>
  );
}

export default function AdminContentPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-10">
      <AdminTitle>{t.admin.content}</AdminTitle>
      <Banners />
      <Blocks />
    </div>
  );
}
