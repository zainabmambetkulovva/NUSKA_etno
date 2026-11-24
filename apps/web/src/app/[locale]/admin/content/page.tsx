'use client';

import { useEffect, useState } from 'react';

import type { AdminSiteContent, Locale } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { CheckIcon } from '@/components/ui/icons';
import { ErrorBox } from '@/components/ui/misc';
import { locales, localeNames } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { useToast } from '@/stores/toast';

/** The texts of the site that can be edited: the key the site reads, and how the form looks. */
const BLOCKS = [
  { key: 'contacts', kind: 'contacts' },
  { key: 'stores', kind: 'stores' },
  { key: 'about', kind: 'text' },
  { key: 'pickup', kind: 'text' },
  { key: 'page.traditions', kind: 'text' },
  { key: 'page.privacy', kind: 'text' },
  { key: 'page.terms', kind: 'text' },
  { key: 'page.order-terms', kind: 'text' },
  { key: 'page.returns', kind: 'text' },
] as const;
type BlockKey = (typeof BLOCKS)[number]['key'];

type Tr = Record<Locale, { title: string; body: string }>;
const emptyTr = (): Tr => ({ ky: { title: '', body: '' }, ru: { title: '', body: '' } });

interface Channels {
  whatsapp: string;
  instagram: string;
  telegram: string;
  youtube: string;
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

function Editor({
  blockKey,
  kind,
  block,
}: {
  blockKey: BlockKey;
  kind: (typeof BLOCKS)[number]['kind'];
  block: AdminSiteContent | undefined;
}) {
  const { t } = useI18n();
  const c = t.admin.contentEditor;
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [tr, setTr] = useState<Tr>(emptyTr());
  const [channels, setChannels] = useState<Channels>({
    whatsapp: '',
    instagram: '',
    telegram: '',
    youtube: '',
  });
  const [city, setCity] = useState('');
  const [stores, setStores] = useState('');
  const [problem, setProblem] = useState<string | null>(null);

  // load the saved values whenever another text is chosen (or after saving)
  useEffect(() => {
    const next = emptyTr();
    block?.translations.forEach(
      (x) => (next[x.locale] = { title: x.title ?? '', body: x.body ?? '' })
    );
    setTr(next);
    const data = block?.data ?? {};
    setChannels({
      whatsapp: str(data.whatsapp) || str(data.phone),
      instagram: str(data.instagram),
      telegram: str(data.telegram),
      youtube: str(data.youtube),
    });
    setCity(str(data.city));
    setStores(
      Array.isArray(data.stores)
        ? (data.stores as unknown[]).filter((s): s is string => typeof s === 'string').join('\n')
        : ''
    );
    setProblem(null);
  }, [block, blockKey]);

  const save = useMutation({
    mutationFn: () => {
      // other values already stored in the block are kept; the company has no street address
      const data: Record<string, unknown> = { ...(block?.data ?? {}) };
      delete data.address;
      if (kind === 'contacts') {
        delete data.phone;
        data.whatsapp = channels.whatsapp.trim();
        data.instagram = channels.instagram.trim().replace(/^@/, '');
        data.telegram = channels.telegram.trim().replace(/^@/, '');
        data.youtube = channels.youtube.trim();
      }
      if (kind === 'stores') {
        data.city = city.trim();
        data.stores = stores
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      return api(`/admin/content/blocks/${encodeURIComponent(blockKey)}`, {
        method: 'PUT',
        body: {
          data: Object.keys(data).length ? data : null,
          translations: locales.map((l) => ({
            locale: l,
            title: tr[l].title.trim() || null,
            body: tr[l].body.trim() || null,
          })),
        },
      });
    },
    onSuccess: () => {
      toast(t.common.saved);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'blocks'] });
    },
  });

  const submit = () => {
    if (kind === 'contacts') {
      if (channels.whatsapp.trim() && !/^\+?[\d\s()-]{9,20}$/.test(channels.whatsapp.trim()))
        return setProblem(c.badPhone);
      if (channels.youtube.trim() && !/^https:\/\//.test(channels.youtube.trim()))
        return setProblem(c.badLink);
    }
    setProblem(null);
    save.mutate();
  };

  const setText = (l: Locale, field: 'title' | 'body', value: string) =>
    setTr((prev) => ({ ...prev, [l]: { ...prev[l], [field]: value } }));

  return (
    <form className="card space-y-6 p-5 sm:p-6" onSubmit={(e) => (e.preventDefault(), submit())}>
      <div>
        <h2 className="font-serif text-2xl text-nk-ink">{c.blocks[blockKey].name}</h2>
        <p className="mt-1 text-sm text-nk-muted">
          {c.where} <span className="font-medium text-nk-forest">{c.blocks[blockKey].where}</span>
        </p>
        <p className="mt-1 text-sm text-nk-muted">{c.languageHint}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {locales.map((l) => (
          <div key={l} className="space-y-4 rounded-2xl bg-nk-cream/70 p-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-olive">
              {localeNames[l]}
            </p>
            <Field label={c.titleField}>
              {(id) => (
                <Input
                  id={id}
                  maxLength={300}
                  value={tr[l].title}
                  onChange={(e) => setText(l, 'title', e.target.value)}
                />
              )}
            </Field>
            <Field label={c.bodyField} hint={c.bodyHint}>
              {(id, d) => (
                <Textarea
                  id={id}
                  aria-describedby={d}
                  rows={kind === 'text' ? 12 : 5}
                  maxLength={20000}
                  value={tr[l].body}
                  onChange={(e) => setText(l, 'body', e.target.value)}
                />
              )}
            </Field>
          </div>
        ))}
      </div>

      {kind === 'contacts' && (
        <div className="space-y-4">
          <h3 className="font-serif text-xl text-nk-ink">{c.contactsTitle}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={c.whatsapp} hint={c.whatsappHint}>
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  inputMode="tel"
                  maxLength={30}
                  placeholder="+996 …"
                  value={channels.whatsapp}
                  onChange={(e) => setChannels({ ...channels, whatsapp: e.target.value })}
                />
              )}
            </Field>
            <Field label={c.instagram} hint={c.instagramHint}>
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  maxLength={60}
                  value={channels.instagram}
                  onChange={(e) => setChannels({ ...channels, instagram: e.target.value })}
                />
              )}
            </Field>
            <Field label={c.telegram} hint={c.telegramHint}>
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  maxLength={60}
                  value={channels.telegram}
                  onChange={(e) => setChannels({ ...channels, telegram: e.target.value })}
                />
              )}
            </Field>
            <Field label={c.youtube} hint={c.youtubeHint}>
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  type="url"
                  maxLength={200}
                  placeholder="https://"
                  value={channels.youtube}
                  onChange={(e) => setChannels({ ...channels, youtube: e.target.value })}
                />
              )}
            </Field>
          </div>
        </div>
      )}

      {kind === 'stores' && (
        <div className="space-y-4">
          <h3 className="font-serif text-xl text-nk-ink">{c.storesTitle}</h3>
          <Field label={c.city} className="max-w-xs">
            {(id) => (
              <Input
                id={id}
                maxLength={100}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            )}
          </Field>
          <Field label={c.storesList} hint={c.storesHint}>
            {(id, d) => (
              <Textarea
                id={id}
                aria-describedby={d}
                rows={10}
                value={stores}
                onChange={(e) => setStores(e.target.value)}
              />
            )}
          </Field>
        </div>
      )}

      {(problem || save.error) && (
        <ErrorBox>{problem ?? errorMessage(save.error, t.errors)}</ErrorBox>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" loading={save.isPending}>
          {t.common.save}
        </Button>
        <span className="text-sm text-nk-muted">{c.saveHint}</span>
      </div>
    </form>
  );
}

export default function AdminContentPage() {
  const { t } = useI18n();
  const c = t.admin.contentEditor;
  const [selected, setSelected] = useState<BlockKey>('contacts');
  const list = useQuery({
    queryKey: ['admin', 'blocks'],
    queryFn: () => api<AdminSiteContent[]>('/admin/content/blocks'),
  });
  const byKey = new Map(list.data?.map((b) => [b.key, b]));
  const isFilled = (key: string) =>
    Boolean(byKey.get(key)?.translations.some((x) => x.title || x.body));
  const current = BLOCKS.find((b) => b.key === selected)!;

  return (
    <div>
      <AdminTitle hint={t.admin.pages.content}>{t.admin.content}</AdminTitle>
      {list.isLoading ? (
        <OrnamentLoader label={t.common.loading} />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <div className="card space-y-1 p-3">
            <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-widest text-olive">
              {c.pick}
            </p>
            {BLOCKS.map((b) => (
              <button
                key={b.key}
                type="button"
                aria-pressed={selected === b.key}
                onClick={() => setSelected(b.key)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition',
                  selected === b.key ? 'bg-nk-forest text-white' : 'text-nk-ink hover:bg-nk-sage/50'
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{c.blocks[b.key].name}</span>
                  <span
                    className={cn(
                      'block truncate text-xs',
                      selected === b.key ? 'text-white/75' : 'text-nk-muted'
                    )}
                  >
                    {c.blocks[b.key].where}
                  </span>
                </span>
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs',
                    isFilled(b.key)
                      ? selected === b.key
                        ? 'bg-white/20 text-white'
                        : 'bg-nk-sage text-nk-forest'
                      : selected === b.key
                        ? 'bg-white/10 text-white/70'
                        : 'bg-nk-cream text-nk-muted'
                  )}
                  title={isFilled(b.key) ? c.filled : c.empty}
                >
                  {isFilled(b.key) ? <CheckIcon width={14} height={14} /> : '–'}
                </span>
              </button>
            ))}
          </div>
          <Editor
            key={current.key}
            blockKey={current.key}
            kind={current.kind}
            block={byKey.get(current.key)}
          />
        </div>
      )}
    </div>
  );
}
