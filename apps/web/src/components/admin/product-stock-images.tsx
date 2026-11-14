'use client';

import { useRef, useState } from 'react';

import type { AdminProduct, Page } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/field';
import { TrashIcon } from '@/components/ui/icons';
import { Badge, ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { useToast } from '@/stores/toast';

interface Movement {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  createdBy: { email: string } | null;
}

export function StockPanel({ product }: { product: AdminProduct }) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [type, setType] = useState<'IN' | 'ADJUSTMENT'>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const history = useQuery({
    queryKey: ['admin', 'stock', product.id],
    queryFn: () => api<Page<Movement>>(`/admin/products/${product.id}/stock-movements?limit=20`),
  });
  const adjust = useMutation({
    mutationFn: () =>
      api(`/admin/products/${product.id}/stock`, {
        method: 'POST',
        body: { type, quantity: Number(quantity), reason },
      }),
    onSuccess: () => {
      toast(t.common.saved);
      setQuantity('');
      setReason('');
      void queryClient.invalidateQueries({ queryKey: ['admin', 'product', product.id] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stock', product.id] });
    },
  });

  return (
    <section className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">{t.admin.stock}</h2>
        <span className="text-2xl font-semibold text-brand-dark">
          {product.trackInventory ? product.stockQuantity : t.admin.notTracked}
        </span>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-[160px_120px_1fr_auto] sm:items-end"
        onSubmit={(e) => (e.preventDefault(), adjust.mutate())}
      >
        <Field label={t.admin.stockAdjust}>
          {(id) => (
            <Select
              id={id}
              value={type}
              onChange={(e) => setType(e.target.value as 'IN' | 'ADJUSTMENT')}
            >
              <option value="IN">{t.admin.stockIn}</option>
              <option value="ADJUSTMENT">{t.admin.stockAdjustment}</option>
            </Select>
          )}
        </Field>
        <Field label={t.admin.count}>
          {(id) => (
            <Input
              id={id}
              type="number"
              required
              min={type === 'IN' ? 1 : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          )}
        </Field>
        <Field label={t.admin.stockReason}>
          {(id) => (
            <Input
              id={id}
              required
              maxLength={300}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          )}
        </Field>
        <Button
          type="submit"
          loading={adjust.isPending}
          disabled={!quantity || Number(quantity) === 0 || !reason.trim()}
        >
          {t.admin.apply}
        </Button>
      </form>
      {adjust.error && <ErrorBox>{errorMessage(adjust.error, t.errors)}</ErrorBox>}
      {(history.data?.data.length ?? 0) > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-brand">{t.admin.stockHistory}</summary>
          <ul className="mt-3 space-y-1 text-sm">
            {history.data!.data.map((m) => (
              <li key={m.id} className="flex flex-wrap gap-x-3 text-ink-muted">
                <span className={m.quantity > 0 ? 'text-brand' : 'text-danger'}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </span>
                <span>{m.type}</span>
                <span>{m.reason}</span>
                <span className="text-ink-soft">
                  {formatDate(m.createdAt, locale, true)} · {m.createdBy?.email ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

export function ImagesPanel({ product }: { product: AdminProduct }) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const input = useRef<HTMLInputElement>(null);
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'product', product.id] });
  const onError = (error: unknown) => toast(errorMessage(error, t.errors), 'error');

  const upload = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append('file', file);
      return api(`/admin/products/${product.id}/images`, { method: 'POST', body });
    },
    onSuccess: refresh,
    onError,
  });
  const update = useMutation({
    mutationFn: (imageId: string) =>
      api(`/admin/products/${product.id}/images/${imageId}`, {
        method: 'PATCH',
        body: { isPrimary: true },
      }),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: (imageId: string) =>
      api(`/admin/products/${product.id}/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: refresh,
    onError,
  });

  return (
    <section className="card space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl">{t.admin.images}</h2>
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) =>
            e.target.files?.[0] &&
            upload.mutate(e.target.files[0], {
              onSettled: () => {
                if (input.current) input.current.value = '';
              },
            })
          }
        />
        <Button
          size="sm"
          variant="outline"
          loading={upload.isPending}
          onClick={() => input.current?.click()}
        >
          {t.admin.upload}
        </Button>
      </div>
      {product.images.length === 0 ? (
        <p className="text-sm text-ink-soft">{t.admin.noData}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {product.images.map((image) => (
            <div key={image.id} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-xl bg-cream-light">
                <Image
                  src={image.url}
                  alt={image.alt ?? ''}
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex items-center justify-between gap-1">
                {image.isPrimary ? (
                  <Badge>{t.admin.primary}</Badge>
                ) : (
                  <button
                    type="button"
                    className="text-xs text-brand hover:underline"
                    onClick={() => update.mutate(image.id)}
                  >
                    {t.admin.makePrimary}
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-full p-1.5 text-ink-soft hover:text-danger"
                  aria-label={t.common.delete}
                  onClick={() => window.confirm(t.admin.deleteConfirm) && remove.mutate(image.id)}
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
