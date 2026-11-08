'use client';

import { Suspense } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthCard, safeNext } from '@/components/auth/auth-card';
import { GoogleButton } from '@/components/auth/google-button';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { useRegister } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/i18n-provider';
import { ApiError } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

function RegisterForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'), locale, `/${locale}/account`);
  const register = useRegister();
  const schema = z.object({
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
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const errors = form.formState.errors;
  const emailTaken = register.error instanceof ApiError && register.error.code === 'EMAIL_TAKEN';

  return (
    <AuthCard
      title={t.auth.registerTitle}
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
            { ...values, lastName: values.lastName || undefined, phone: values.phone || undefined },
            { onSuccess: () => router.push(next) }
          )
        )}
      >
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
        <Field label={t.auth.password} error={errors.password?.message} hint={t.auth.passwordHint}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
            />
          )}
        </Field>
        {register.error && !emailTaken && (
          <ErrorBox>{errorMessage(register.error, t.errors)}</ErrorBox>
        )}
        <Button type="submit" className="w-full" size="lg" loading={register.isPending}>
          {t.auth.register}
        </Button>
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
