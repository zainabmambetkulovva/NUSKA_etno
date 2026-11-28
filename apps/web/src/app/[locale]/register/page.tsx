'use client';

import { Suspense } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthCard, safeNext } from '@/components/auth/auth-card';
import { GoogleButton } from '@/components/auth/google-button';
import { PasswordStrength } from '@/components/auth/password-strength';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { PasswordInput } from '@/components/ui/password-input';
import { useRegister } from '@/hooks/use-auth';
import { useSlow } from '@/hooks/use-slow';
import { useI18n } from '@/i18n/i18n-provider';
import { ApiError } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

/** «① О вас» — a numbered gold badge and a thin rule. */
function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-nk-gold/90 font-serif text-sm font-semibold text-nk-night">
        {n}
      </span>
      <span className="font-serif text-lg text-nk-ink">{title}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-nk-gold/50 to-transparent" aria-hidden />
    </div>
  );
}

function RegisterForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'), locale, `/${locale}/account`);
  const register = useRegister();
  const slow = useSlow(register.isPending);
  const schema = z
    .object({
      firstName: z.string().trim().min(1, t.validation.required).max(100),
      lastName: z.string().trim().max(100).optional(),
      email: z.string().trim().email(t.validation.email),
      phone: z
        .union([
          z.literal(''),
          z
            .string()
            .trim()
            .regex(/^[+\d][\d\s\-()]{7,20}$/, t.validation.phone),
        ])
        .optional(),
      password: z
        .string()
        .min(8, t.validation.password)
        .max(72)
        .regex(/^(?=.*\p{L})(?=.*\d).+$/u, t.validation.password),
      passwordConfirm: z.string(),
      acceptTerms: z.boolean(),
    })
    // both checks run together, so all problems are shown after one click
    .superRefine((values, ctx) => {
      if (values.password !== values.passwordConfirm)
        ctx.addIssue({
          code: 'custom',
          path: ['passwordConfirm'],
          message: t.auth.passwordMismatch,
        });
      if (!values.acceptTerms)
        ctx.addIssue({
          code: 'custom',
          path: ['acceptTerms'],
          message: t.auth.acceptTermsRequired,
        });
    });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const errors = form.formState.errors;
  const emailTaken = register.error instanceof ApiError && register.error.code === 'EMAIL_TAKEN';

  return (
    <AuthCard
      title={t.auth.registerTitle}
      subtitle={t.auth.registerSub}
      panelTitle={t.auth.registerPanelTitle}
      panelText={t.auth.registerPanelText}
      footer={
        <>
          {t.auth.haveAccount}{' '}
          <Link href={`/${locale}/login`} className="font-medium text-brand hover:underline">
            {t.auth.login}
          </Link>
        </>
      }
    >
      <GoogleButton next={next} />
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit((values) =>
          register.mutate(
            {
              ...values,
              acceptTerms: true,
              lastName: values.lastName || undefined,
              phone: values.phone || undefined,
            },
            { onSuccess: () => router.push(next) }
          )
        )}
      >
        <StepHeading n={1} title={t.auth.stepAbout} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.auth.firstName} error={errors.firstName?.message}>
            {(id, d) => (
              <Input
                id={id}
                aria-describedby={d}
                autoComplete="given-name"
                {...form.register('firstName')}
              />
            )}
          </Field>
          <Field label={t.auth.lastName} error={errors.lastName?.message}>
            {(id, d) => (
              <Input
                id={id}
                aria-describedby={d}
                autoComplete="family-name"
                {...form.register('lastName')}
              />
            )}
          </Field>
        </div>
        <Field
          label={t.auth.email}
          error={errors.email?.message ?? (emailTaken ? t.errors.EMAIL_TAKEN : undefined)}
        >
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="email"
              autoComplete="email"
              {...form.register('email')}
            />
          )}
        </Field>
        <Field
          label={
            <>
              {t.auth.phone} <span className="text-ink-soft">({t.common.optional})</span>
            </>
          }
          error={errors.phone?.message}
        >
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="tel"
              autoComplete="tel"
              placeholder="+996 ___ ___ ___"
              {...form.register('phone')}
            />
          )}
        </Field>
        <StepHeading n={2} title={t.auth.stepAccess} />
        <Field label={t.auth.password} error={errors.password?.message}>
          {(id, d) => (
            <PasswordInput
              id={id}
              aria-describedby={d}
              autoComplete="new-password"
              {...form.register('password')}
            />
          )}
        </Field>
        <PasswordStrength value={form.watch('password') ?? ''} />
        <Field label={t.auth.passwordConfirm} error={errors.passwordConfirm?.message}>
          {(id, d) => (
            <PasswordInput
              id={id}
              aria-describedby={d}
              autoComplete="new-password"
              {...form.register('passwordConfirm')}
            />
          )}
        </Field>
        <div className="rounded-xl border border-nk-gold/40 bg-[#FFFCF4] p-3.5">
          <label className="flex items-start gap-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              aria-invalid={Boolean(errors.acceptTerms)}
              {...form.register('acceptTerms')}
            />
            <span>
              {t.auth.acceptTermsBefore}
              <Link href={`/${locale}/terms`} target="_blank" className="text-brand underline">
                {t.auth.acceptTermsTerms}
              </Link>
              {t.auth.acceptTermsAnd}
              <Link href={`/${locale}/privacy`} target="_blank" className="text-brand underline">
                {t.auth.acceptTermsPrivacy}
              </Link>
              {t.auth.acceptTermsAfter}
            </span>
          </label>
          {errors.acceptTerms?.message && (
            <p className="field-error">{errors.acceptTerms.message}</p>
          )}
        </div>
        {register.error && !emailTaken && (
          <ErrorBox>{errorMessage(register.error, t.errors)}</ErrorBox>
        )}
        <Button type="submit" className="w-full" size="lg" loading={register.isPending}>
          {t.auth.register}
        </Button>
        {slow && (
          <p role="status" className="text-center text-sm text-ink-muted">
            {t.auth.waking}
          </p>
        )}
      </form>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
