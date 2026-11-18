'use client';

import { useEffect, useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import type { DeliveryMethod, Order, PickupLocation } from '@nuska/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ClockIcon, PinIcon, TruckIcon } from '@/components/ui/icons';
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
  const pickupPoints = pickup.data ?? [];
  // why "Place order" is disabled, said next to the button
  const blockedReason =
    !cart.loading && cart.lines.length > 0 && !cart.canCheckout ? t.checkout.blockedCart : null;

  const schema = z
    .object({
      customerName: z.string().trim().min(1, t.validation.required).max(150),
      customerPhone: z
        .string()
        .trim()
        .regex(/^[+\d][\d\s\-()]{7,20}$/, t.validation.phone),
      customerEmail: z.union([z.literal(''), z.string().trim().email(t.validation.email)]),
      deliveryMethod: z.enum(['DELIVERY', 'PICKUP']),
      deliveryCity: z.string().trim().max(100),
      deliveryAddress: z.string().trim().max(500),
      deliveryTime: z.string().trim().max(100),
      pickupLocationId: z.string(),
      pickupTime: z.string().optional(),
      customerComment: z.string().max(1000).optional(),
    })
    .superRefine((v, ctx) => {
      const need = (path: 'deliveryCity' | 'deliveryAddress' | 'pickupLocationId', min: number) =>
        v[path].trim().length < min &&
        ctx.addIssue({ code: 'custom', path: [path], message: t.validation.required });
      if (v.deliveryMethod === 'DELIVERY') {
        need('deliveryCity', 2);
        need('deliveryAddress', 5);
      } else need('pickupLocationId', 1);
    });
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      deliveryMethod: 'DELIVERY',
      deliveryCity: '',
      deliveryAddress: '',
      deliveryTime: '',
      pickupLocationId: '',
    },
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

  const methods = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () =>
      api<{ cash: boolean; online: boolean; testAmount: number | null }>('/payments/methods'),
    staleTime: 5 * 60_000,
  });
  const onlineAvailable = Boolean(methods.data?.online);
  const [payment, setPayment] = useState<'CASH' | 'ONLINE'>('CASH');

  const place = useMutation({
    mutationFn: (values: FormValues) =>
      api<Order & { paymentUrl?: string | null }>('/orders', {
        method: 'POST',
        locale,
        body: {
          deliveryMethod: values.deliveryMethod,
          ...(values.deliveryMethod === 'DELIVERY'
            ? {
                deliveryCity: values.deliveryCity,
                deliveryAddress: values.deliveryAddress,
                deliveryTime: values.deliveryTime || undefined,
              }
            : {
                pickupLocationId: values.pickupLocationId,
                pickupTime: values.pickupTime
                  ? new Date(values.pickupTime).toISOString()
                  : undefined,
              }),
          paymentMethod: onlineAvailable ? payment : 'CASH',
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerEmail: values.customerEmail || undefined,
          customerComment: values.customerComment || undefined,
          locale,
        },
      }),
    onSuccess: async (order) => {
      await queryClient.invalidateQueries({ queryKey: cartKey(locale) });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      // online payment: straight to Finik's payment page
      if (order.paymentUrl) {
        window.location.assign(order.paymentUrl);
        return;
      }
      if (order.paymentMethod === 'ONLINE') toast(t.checkout.payOnlineFailed, 'error');
      else toast(t.checkout.success);
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
  const method: DeliveryMethod = form.watch('deliveryMethod');
  const optional = <span className="text-ink-soft">({t.common.optional})</span>;
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
            <h2 className="font-serif text-xl">{t.checkout.howToReceive}</h2>
            {/* pickup is offered only when the shop has pickup points */}
            {pickupPoints.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
                {(['DELIVERY', 'PICKUP'] as const).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition',
                      method === value
                        ? 'border-brand bg-brand-50'
                        : 'border-cream-dark hover:border-brand/50'
                    )}
                  >
                    <input
                      type="radio"
                      value={value}
                      className="accent-brand"
                      {...form.register('deliveryMethod')}
                    />
                    <span className="font-medium">
                      {value === 'DELIVERY' ? t.checkout.methodDelivery : t.checkout.methodPickup}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {method === 'DELIVERY' ? (
              <>
                <p className="flex items-center gap-2 text-sm text-ink-muted">
                  <TruckIcon width={18} height={18} className="text-brand" />
                  {t.checkout.methodDeliveryText}
                </p>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                  <Field label={t.checkout.city} error={errors.deliveryCity?.message}>
                    {(id, d) => (
                      <Input
                        id={id}
                        aria-describedby={d}
                        autoComplete="address-level2"
                        placeholder={t.checkout.cityPlaceholder}
                        {...form.register('deliveryCity')}
                      />
                    )}
                  </Field>
                  <Field
                    label={t.checkout.address}
                    hint={t.checkout.addressHint}
                    error={errors.deliveryAddress?.message}
                  >
                    {(id, d) => (
                      <Input
                        id={id}
                        aria-describedby={d}
                        autoComplete="street-address"
                        placeholder={t.checkout.addressPlaceholder}
                        {...form.register('deliveryAddress')}
                      />
                    )}
                  </Field>
                </div>
                <Field
                  label={
                    <>
                      {t.checkout.deliveryTime} {optional}
                    </>
                  }
                  error={errors.deliveryTime?.message}
                >
                  {(id, d) => (
                    <Input
                      id={id}
                      aria-describedby={d}
                      maxLength={100}
                      placeholder={t.checkout.deliveryTimePlaceholder}
                      {...form.register('deliveryTime')}
                    />
                  )}
                </Field>
              </>
            ) : (
              <>
                <div className="space-y-3" role="radiogroup" aria-label={t.checkout.pickup}>
                  {pickupPoints.map((point) => (
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
                {errors.pickupLocationId && (
                  <p className="field-error">{errors.pickupLocationId.message}</p>
                )}
                <Field
                  label={
                    <>
                      {t.checkout.pickupTime} {optional}
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
              </>
            )}
            <Field
              label={
                <>
                  {t.checkout.comment} {optional}
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

          <section className="card space-y-3 p-6">
            <h2 className="font-serif text-xl">{t.checkout.payment}</h2>
            <div className="space-y-3" role="radiogroup" aria-label={t.checkout.payment}>
              {(
                [
                  ['CASH', t.checkout.payOnReceipt, t.checkout.payOnReceiptText],
                  ['ONLINE', t.checkout.payOnline, t.checkout.payOnlineText],
                ] as const
              ).map(([value, title, text]) => {
                const disabled = value === 'ONLINE' && !onlineAvailable;
                const chosen = (onlineAvailable ? payment : 'CASH') === value;
                return (
                  <label
                    key={value}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 transition',
                      disabled
                        ? 'cursor-not-allowed border-dashed border-cream-dark text-ink-soft'
                        : chosen
                          ? 'cursor-pointer border-brand bg-brand-50'
                          : 'cursor-pointer border-cream-dark hover:border-brand/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={value}
                      checked={chosen}
                      disabled={disabled}
                      onChange={() => setPayment(value)}
                      className="mt-1 accent-brand"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2 font-medium">
                        {title}
                        {disabled && (
                          <span className="rounded-full bg-cream-50 px-2.5 py-0.5 text-xs font-normal">
                            {t.checkout.payOnlineSoon}
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-ink-muted">{text}</span>
                    </span>
                  </label>
                );
              })}
            </div>
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
          <dl className="space-y-1.5 border-t border-cream-dark/60 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">{t.checkout.subtotal}</dt>
              <dd>{formatMoney(cart.subtotal, locale, t.common.som)}</dd>
            </div>
            {method === 'DELIVERY' && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">{t.checkout.delivery}</dt>
                <dd>{t.checkout.deliveryByManager}</dd>
              </div>
            )}
          </dl>
          <div className="flex items-baseline justify-between">
            <span className="font-medium">
              {method === 'DELIVERY' ? t.checkout.totalWithoutDelivery : t.checkout.total}
            </span>
            <span className="text-2xl font-semibold text-brand-dark">
              {formatMoney(cart.subtotal, locale, t.common.som)}
            </span>
          </div>
          {method === 'DELIVERY' && (
            <p className="text-xs text-ink-soft">{t.checkout.deliveryNote}</p>
          )}
          <p className="text-xs text-ink-soft">{t.checkout.paymentNote}</p>
          {onlineAvailable && payment === 'ONLINE' && methods.data?.testAmount && (
            <p className="rounded-xl bg-[#FFF4D6] px-3 py-2 text-xs font-medium text-nk-brown">
              {t.checkout.testPayment.replace('{amount}', String(methods.data.testAmount))}
            </p>
          )}
          {place.error && <ErrorBox>{errorMessage(place.error, t.errors)}</ErrorBox>}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={place.isPending}
            disabled={!cart.canCheckout}
            aria-describedby={blockedReason ? 'checkout-blocked' : undefined}
          >
            {onlineAvailable && payment === 'ONLINE' ? t.checkout.toPayment : t.checkout.place}
          </Button>
          {blockedReason && (
            <p id="checkout-blocked" className="text-center text-xs text-danger" role="status">
              {blockedReason}
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
