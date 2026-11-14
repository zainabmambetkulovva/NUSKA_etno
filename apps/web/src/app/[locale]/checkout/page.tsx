'use client';

import { useEffect } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Order, PickupLocation } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ClockIcon, PinIcon } from '@/components/ui/icons';
import { EmptyState, ErrorBox } from '@/components/ui/misc';
import { useMe } from '@/hooks/use-auth';
import { cartKey, useCart } from '@/hooks/use-cart';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useToast } from '@/stores/toast';

export default function CheckoutPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const me = useMe();
  const cart = useCart();
  const pickup = useQuery({
    queryKey: ['pickup-locations', locale],
    queryFn: () => api<PickupLocation[]>('/pickup-locations', { locale }),
  });

  const schema = z.object({
    customerName: z.string().trim().min(1, t.validation.required).max(150),
    customerPhone: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s\-()]{7,20}$/, t.validation.phone),
    customerEmail: z.union([z.literal(''), z.string().trim().email(t.validation.email)]),
    pickupLocationId: z.string().min(1, t.validation.required),
    pickupTime: z.string().optional(),
    customerComment: z.string().max(1000).optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { customerName: '', customerPhone: '', customerEmail: '', pickupLocationId: '' },
  });

  useEffect(() => {
    if (me.isFetched && !me.data) router.replace(`/${locale}/login?next=/${locale}/checkout`);
    if (me.data) {
      const name = [me.data.firstName, me.data.lastName].filter(Boolean).join(' ');
      if (!form.getValues('customerName')) form.setValue('customerName', name);
      if (!form.getValues('customerPhone') && me.data.phone)
        form.setValue('customerPhone', me.data.phone);
      if (!form.getValues('customerEmail')) form.setValue('customerEmail', me.data.email);
    }
  }, [me.isFetched, me.data, router, locale, form]);

  useEffect(() => {
    if (pickup.data?.length === 1 && !form.getValues('pickupLocationId'))
      form.setValue('pickupLocationId', pickup.data[0].id);
  }, [pickup.data, form]);

  const place = useMutation({
    mutationFn: (values: FormValues) =>
      api<Order>('/orders', {
        method: 'POST',
        locale,
        body: {
          pickupLocationId: values.pickupLocationId,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerEmail: values.customerEmail || undefined,
          pickupTime: values.pickupTime ? new Date(values.pickupTime).toISOString() : undefined,
          customerComment: values.customerComment || undefined,
          locale,
        },
      }),
    onSuccess: async (order) => {
      toast(t.checkout.success);
      await queryClient.invalidateQueries({ queryKey: cartKey(locale) });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      router.push(`/${locale}/checkout/success?order=${order.id}`);
    },
  });

  if (!me.data || cart.loading)
    return <OrnamentLoader label={t.common.loading} className="py-24" />;
  if (cart.lines.length === 0 && !place.isSuccess) {
    return (
      <div className="container py-10">
        <EmptyState title={t.cart.empty} />
      </div>
    );
  }

  const errors = form.formState.errors;
  return (
    <div className="container py-10">
      <h1 className="mb-8 text-4xl font-semibold">{t.checkout.title}</h1>
      <form
        onSubmit={form.handleSubmit((values) => place.mutate(values))}
        className="grid gap-8 lg:grid-cols-[1fr_380px]"
        noValidate
      >
        <div className="space-y-8">
          <section className="card space-y-4 p-6">
            <h2 className="font-serif text-xl">{t.checkout.contacts}</h2>
            <Field label={t.checkout.name} error={errors.customerName?.message}>
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  autoComplete="name"
                  {...form.register('customerName')}
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.checkout.phone} error={errors.customerPhone?.message}>
                {(id, d) => (
                  <Input
                    id={id}
                    aria-describedby={d}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+996 ___ ___ ___"
                    {...form.register('customerPhone')}
                  />
                )}
              </Field>
              <Field
                label={
                  <>
                    {t.checkout.email} <span className="text-ink-soft">({t.common.optional})</span>
                  </>
                }
                error={errors.customerEmail?.message}
              >
                {(id, d) => (
                  <Input
                    id={id}
                    aria-describedby={d}
                    type="email"
                    autoComplete="email"
                    {...form.register('customerEmail')}
                  />
                )}
              </Field>
            </div>
          </section>

          <section className="card space-y-4 p-6">
            <h2 className="font-serif text-xl">{t.checkout.pickup}</h2>
            {pickup.isLoading ? (
              <OrnamentLoader label={t.common.loading} />
            ) : (pickup.data ?? []).length === 0 ? (
              <p className="text-ink-soft">{t.checkout.noPickup}</p>
            ) : (
              <div className="space-y-3" role="radiogroup" aria-label={t.checkout.pickup}>
                {pickup.data!.map((point) => (
                  <label
                    key={point.id}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-xl border p-4 transition',
                      form.watch('pickupLocationId') === point.id
                        ? 'border-brand bg-brand-50'
                        : 'border-cream-dark hover:border-brand/50'
                    )}
                  >
                    <input
                      type="radio"
                      value={point.id}
                      className="mt-1 accent-brand"
                      {...form.register('pickupLocationId')}
                    />
                    <span className="space-y-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <PinIcon width={16} height={16} /> {point.name}
                      </span>
                      <span className="block text-sm text-ink-muted">{point.address}</span>
                      {point.openingHours && (
                        <span className="flex items-center gap-1.5 text-xs text-ink-soft">
                          <ClockIcon width={14} height={14} /> {point.openingHours}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {errors.pickupLocationId && (
              <p className="field-error">{errors.pickupLocationId.message}</p>
            )}
            <Field
              label={
                <>
                  {t.checkout.pickupTime}{' '}
                  <span className="text-ink-soft">({t.common.optional})</span>
                </>
              }
            >
              {(id, d) => (
                <Input
                  id={id}
                  aria-describedby={d}
                  type="datetime-local"
                  {...form.register('pickupTime')}
                />
              )}
            </Field>
            <Field
              label={
                <>
                  {t.checkout.comment} <span className="text-ink-soft">({t.common.optional})</span>
                </>
              }
            >
              {(id, d) => (
                <Textarea
                  id={id}
                  aria-describedby={d}
                  maxLength={1000}
                  {...form.register('customerComment')}
                />
              )}
            </Field>
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-xl">{t.checkout.summary}</h2>
          <ul className="space-y-2 text-sm">
            {cart.lines.map((line) => (
              <li key={line.productId} className="flex justify-between gap-3">
                <span>
                  {line.product.name} × {line.quantity}
                </span>
                <span className="shrink-0">
                  {formatMoney(line.lineTotal, locale, t.common.som)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between border-t border-cream-dark/60 pt-4">
            <span className="font-medium">{t.checkout.total}</span>
            <span className="text-2xl font-semibold text-brand-dark">
              {formatMoney(cart.subtotal, locale, t.common.som)}
            </span>
          </div>
          <p className="text-xs text-ink-soft">{t.checkout.paymentNote}</p>
          {place.error && <ErrorBox>{errorMessage(place.error, t.errors)}</ErrorBox>}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={place.isPending}
            disabled={!cart.canCheckout || (pickup.data ?? []).length === 0}
          >
            {t.checkout.place}
          </Button>
        </aside>
      </form>
    </div>
  );
}
