'use client';

import { useState } from 'react';

import type {
  AdminCategory,
  AdminProduct,
  Locale,
  PackagingModel,
  ProductStatus,
  ProductType,
} from '@nuska/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useFieldArray, useForm, type Control, type UseFormRegister } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/field';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import { ErrorBox } from '@/components/ui/misc';
import { locales, localeNames } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { somToTyiyn } from '@/lib/format';

interface TranslationValues {
  locale: Locale;
  name: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  benefits: string;
  storageInstructions: string;
  shelfLife: string;
  nutrition: string;
  origin: string;
  producer: string;
  characteristics: { name: string; value: string }[];
}

export interface ProductFormValues {
  sku: string;
  slug: string;
  type: ProductType;
  status: ProductStatus;
  priceSom: number;
  trackInventory: boolean;
  initialStock: number;
  isFeatured: boolean;
  packaging3d: PackagingModel | '';
  sortOrder: number;
  categoryIds: string[];
  translations: TranslationValues[];
  units: { unitName: string; quantityValue: number; quantityUnit: string }[];
}

function toValues(product?: AdminProduct): ProductFormValues {
  return {
    sku: product?.sku ?? '',
    slug: product?.slug ?? '',
    type: product?.type ?? 'FOOD',
    status: product?.status ?? 'DRAFT',
    priceSom: product ? product.priceAmount / 100 : 0,
    trackInventory: product?.trackInventory ?? true,
    initialStock: 0,
    isFeatured: product?.isFeatured ?? false,
    packaging3d: product?.packaging3d ?? '',
    sortOrder: product?.sortOrder ?? 0,
    categoryIds: product?.categories.map((c) => c.id) ?? [],
    translations: locales.map((locale) => {
      const t = product?.translations.find((x) => x.locale === locale);
      return {
        locale,
        name: t?.name ?? '',
        shortDescription: t?.shortDescription ?? '',
        description: t?.description ?? '',
        ingredients: t?.ingredients ?? '',
        benefits: t?.benefits ?? '',
        storageInstructions: t?.storageInstructions ?? '',
        shelfLife: t?.shelfLife ?? '',
        nutrition: t?.nutrition ?? '',
        origin: t?.origin ?? '',
        producer: t?.producer ?? '',
        characteristics: t?.characteristics ?? [],
      };
    }),
    units:
      product?.units.map((u) => ({
        unitName: u.unitName,
        quantityValue: u.quantityValue,
        quantityUnit: u.quantityUnit,
      })) ?? [],
  };
}

function toPayload(values: ProductFormValues, isNew: boolean) {
  const text = (v: string) => (v.trim() ? v.trim() : null);
  return {
    sku: values.sku,
    slug: values.slug,
    type: values.type,
    status: values.status,
    priceAmount: somToTyiyn(Number(values.priceSom)),
    trackInventory: values.trackInventory,
    isFeatured: values.isFeatured,
    packaging3d: values.packaging3d || null,
    sortOrder: Number(values.sortOrder) || 0,
    categoryIds: values.categoryIds,
    // A language without a name is not sent; publishing requires both (checked by the API).
    translations: values.translations
      .filter((t) => t.name.trim())
      .map((t) => ({
        locale: t.locale,
        name: t.name.trim(),
        shortDescription: text(t.shortDescription),
        description: text(t.description),
        ingredients: text(t.ingredients),
        benefits: text(t.benefits),
        storageInstructions: text(t.storageInstructions),
        shelfLife: text(t.shelfLife),
        nutrition: text(t.nutrition),
        origin: text(t.origin),
        producer: text(t.producer),
        characteristics: t.characteristics.filter((c) => c.name.trim() && c.value.trim()),
      })),
    units: values.units.map((u) => ({ ...u, quantityValue: Number(u.quantityValue) })),
    ...(isNew && values.trackInventory && Number(values.initialStock) > 0
      ? { initialStock: Number(values.initialStock) }
      : {}),
  };
}

function Characteristics({
  index,
  control,
  register,
}: {
  index: number;
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
}) {
  const { t } = useI18n();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `translations.${index}.characteristics`,
  });
  return (
    <div className="space-y-2">
      <span className="field-label">{t.admin.characteristics}</span>
      {fields.map((field, i) => (
        <div key={field.id} className="flex gap-2">
          <Input
            placeholder={t.admin.characteristicName}
            aria-label={t.admin.characteristicName}
            {...register(`translations.${index}.characteristics.${i}.name`)}
          />
          <Input
            placeholder={t.admin.characteristicValue}
            aria-label={t.admin.characteristicValue}
            {...register(`translations.${index}.characteristics.${i}.value`)}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="rounded-full p-2 text-ink-soft hover:text-danger"
            aria-label={t.common.delete}
          >
            <TrashIcon width={18} height={18} />
          </button>
        </div>
      ))}
      <Button size="sm" variant="ghost" onClick={() => append({ name: '', value: '' })}>
        <PlusIcon width={16} height={16} />
        {t.admin.addCharacteristic}
      </Button>
    </div>
  );
}

export function ProductForm({
  product,
  onSaved,
}: {
  product?: AdminProduct;
  onSaved: (product: AdminProduct) => void;
}) {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<Locale>('ky');
  const categories = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api<AdminCategory[]>('/admin/categories'),
  });
  const form = useForm<ProductFormValues>({ defaultValues: toValues(product) });
  const units = useFieldArray({ control: form.control, name: 'units' });
  const isNew = !product;
  const save = useMutation({
    mutationFn: (values: ProductFormValues) =>
      isNew
        ? api<AdminProduct>('/admin/products', { method: 'POST', body: toPayload(values, true) })
        : api<AdminProduct>(`/admin/products/${product.id}`, {
            method: 'PATCH',
            body: toPayload(values, false),
          }),
    onSuccess: (saved) => {
      form.reset(toValues(saved));
      onSaved(saved);
    },
  });
  const tIndex = locales.indexOf(tab);
  const catName = (c: AdminCategory) =>
    c.translations.find((x) => x.locale === locale)?.name ?? c.slug;

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit((values) => save.mutate(values))}>
      <section className="card grid gap-4 p-6 md:grid-cols-2">
        <Field label={t.admin.sku}>
          {(id) => (
            <Input id={id} required maxLength={64} {...form.register('sku', { required: true })} />
          )}
        </Field>
        <Field label={t.admin.slug} hint="navat-0-5">
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={150}
              {...form.register('slug', { required: true })}
            />
          )}
        </Field>
        <Field label={t.admin.price}>
          {(id) => (
            <Input
              id={id}
              type="number"
              min={0}
              step="0.01"
              required
              {...form.register('priceSom', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label={t.admin.status}>
          {(id) => (
            <Select id={id} {...form.register('status')}>
              {(['DRAFT', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
                <option key={s} value={s}>
                  {t.admin.statuses[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t.admin.type}>
          {(id) => (
            <Select id={id} {...form.register('type')}>
              {(['FOOD', 'BEVERAGE'] as const).map((s) => (
                <option key={s} value={s}>
                  {t.admin.types[s]}
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
              {...form.register('sortOrder', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label={t.admin.packaging3d}>
          {(id) => (
            <Select id={id} {...form.register('packaging3d')}>
              <option value="">{t.admin.packagingModels.NONE}</option>
              {(['BOTTLE', 'JAR', 'BOX', 'PACK'] as const).map((m) => (
                <option key={m} value={m}>
                  {t.admin.packagingModels[m]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="flex flex-col gap-3 md:col-span-2">
          <Checkbox label={t.admin.trackInventory} {...form.register('trackInventory')} />
          {isNew && form.watch('trackInventory') && (
            <Field label={t.admin.initialStock} className="max-w-xs">
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  {...form.register('initialStock', { valueAsNumber: true })}
                />
              )}
            </Field>
          )}
          <Checkbox label={t.admin.featured} {...form.register('isFeatured')} />
        </div>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="font-serif text-xl">{t.admin.categories}</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {(categories.data ?? []).map((c) => (
            <Checkbox
              key={c.id}
              label={catName(c)}
              value={c.id}
              {...form.register('categoryIds')}
            />
          ))}
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl">{t.admin.translations}</h2>
          <div className="inline-flex rounded-full border border-cream-dark p-0.5" role="tablist">
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                role="tab"
                aria-selected={tab === l}
                onClick={() => setTab(l)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm',
                  tab === l ? 'bg-brand text-cream-light' : 'text-ink-muted'
                )}
              >
                {localeNames[l]}
                {form.watch(`translations.${locales.indexOf(l)}.name`) ? '' : ' •'}
              </button>
            ))}
          </div>
        </div>
        <div key={tab} className="space-y-4" role="tabpanel">
          <Field label={t.admin.name}>
            {(id) => (
              <Input id={id} maxLength={200} {...form.register(`translations.${tIndex}.name`)} />
            )}
          </Field>
          <Field label={t.admin.shortDescription}>
            {(id) => (
              <Input
                id={id}
                maxLength={500}
                {...form.register(`translations.${tIndex}.shortDescription`)}
              />
            )}
          </Field>
          <Field label={t.admin.description}>
            {(id) => (
              <Textarea
                id={id}
                rows={5}
                maxLength={10000}
                {...form.register(`translations.${tIndex}.description`)}
              />
            )}
          </Field>
          <Field label={t.admin.benefits}>
            {(id) => (
              <Textarea
                id={id}
                rows={4}
                maxLength={2000}
                {...form.register(`translations.${tIndex}.benefits`)}
              />
            )}
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.admin.ingredients}>
              {(id) => (
                <Textarea
                  id={id}
                  maxLength={3000}
                  {...form.register(`translations.${tIndex}.ingredients`)}
                />
              )}
            </Field>
            <Field label={t.admin.storage}>
              {(id) => (
                <Textarea
                  id={id}
                  maxLength={2000}
                  {...form.register(`translations.${tIndex}.storageInstructions`)}
                />
              )}
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.admin.shelfLife}>
              {(id) => (
                <Input
                  id={id}
                  maxLength={500}
                  {...form.register(`translations.${tIndex}.shelfLife`)}
                />
              )}
            </Field>
            <Field label={t.admin.nutrition}>
              {(id) => (
                <Textarea
                  id={id}
                  rows={3}
                  maxLength={2000}
                  {...form.register(`translations.${tIndex}.nutrition`)}
                />
              )}
            </Field>
            <Field label={t.admin.origin}>
              {(id) => (
                <Input
                  id={id}
                  maxLength={500}
                  {...form.register(`translations.${tIndex}.origin`)}
                />
              )}
            </Field>
            <Field label={t.admin.producer}>
              {(id) => (
                <Input
                  id={id}
                  maxLength={500}
                  {...form.register(`translations.${tIndex}.producer`)}
                />
              )}
            </Field>
          </div>
          <Characteristics index={tIndex} control={form.control} register={form.register} />
        </div>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="font-serif text-xl">{t.admin.units}</h2>
        {units.fields.map((field, i) => (
          <div key={field.id} className="flex flex-wrap gap-2">
            <Input
              className="max-w-[180px]"
              placeholder={t.admin.unitName}
              aria-label={t.admin.unitName}
              required
              {...form.register(`units.${i}.unitName`)}
            />
            <Input
              className="max-w-[120px]"
              type="number"
              step="0.001"
              min="0.001"
              placeholder={t.admin.unitValue}
              aria-label={t.admin.unitValue}
              required
              {...form.register(`units.${i}.quantityValue`, { valueAsNumber: true })}
            />
            <Input
              className="max-w-[100px]"
              placeholder={t.admin.unitUnit}
              aria-label={t.admin.unitUnit}
              required
              {...form.register(`units.${i}.quantityUnit`)}
            />
            <button
              type="button"
              onClick={() => units.remove(i)}
              className="rounded-full p-2 text-ink-soft hover:text-danger"
              aria-label={t.common.delete}
            >
              <TrashIcon width={18} height={18} />
            </button>
          </div>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => units.append({ unitName: '', quantityValue: 1, quantityUnit: '' })}
        >
          <PlusIcon width={16} height={16} />
          {t.admin.addUnit}
        </Button>
      </section>

      {save.error && <ErrorBox>{errorMessage(save.error, t.errors)}</ErrorBox>}
      <div className="sticky bottom-4 z-10 flex justify-end">
        <Button type="submit" size="lg" loading={save.isPending} className="shadow-lift">
          {isNew ? t.common.create : t.common.save}
        </Button>
      </div>
    </form>
  );
}
