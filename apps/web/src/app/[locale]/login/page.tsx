'use client';

import { Suspense } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { AuthCard, safeNext } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { useLogin } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/i18n-provider';
import { errorMessage } from '@/lib/api/errors';

function LoginForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'), locale, `/${locale}/account`);
  const login = useLogin();
  const schema = z.object({
    email: z.string().trim().email(t.validation.email),
    password: z.string().min(1, t.validation.required),
  });
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const errors = form.formState.errors;

  return (
    <AuthCard
      title={t.auth.loginTitle}
      footer={
        <>
          {t.auth.noAccount}{' '}
          <Link
            href={`/${locale}/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-medium text-brand hover:underline"
          >
            {t.auth.register}
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit((values) =>
          login.mutate(values, { onSuccess: () => router.push(next) })
        )}
      >
        <Field label={t.auth.email} error={errors.email?.message}>
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
        <Field label={t.auth.password} error={errors.password?.message}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="password"
              autoComplete="current-password"
              {...form.register('password')}
            />
          )}
        </Field>
        <div className="text-right">
          <Link href={`/${locale}/forgot-password`} className="text-sm text-brand hover:underline">
            {t.auth.forgot}
          </Link>
        </div>
        {login.error && <ErrorBox>{errorMessage(login.error, t.errors)}</ErrorBox>}
        <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
          {t.auth.login}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
