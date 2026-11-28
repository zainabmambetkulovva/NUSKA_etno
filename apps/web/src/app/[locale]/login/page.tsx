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
import { PasswordInput } from '@/components/ui/password-input';
import { useLogin } from '@/hooks/use-auth';
import { useSlow } from '@/hooks/use-slow';
import { useI18n } from '@/i18n/i18n-provider';
import { errorMessage } from '@/lib/api/errors';

function LoginForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'), locale, `/${locale}/account`);
  const login = useLogin();
  const slow = useSlow(login.isPending);
  // one field for the e-mail or the phone number saved in the profile
  const schema = z.object({
    login: z
      .string()
      .trim()
      .min(1, t.validation.required)
      .refine(
        (v) =>
          v.includes('@')
            ? z.string().email().safeParse(v).success
            : /^\+?[\d\s()-]{9,20}$/.test(v),
        t.validation.emailOrPhone
      ),
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
      <GoogleButton next={next} />
      {searchParams.get('error') && (
        <div className="mt-4">
          <ErrorBox>
            {searchParams.get('error') === 'disabled'
              ? t.errors.ACCOUNT_DISABLED
              : t.auth.googleFailed}
          </ErrorBox>
        </div>
      )}
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(({ login: value, password }) =>
          login.mutate(
            value.includes('@') ? { email: value, password } : { phone: value, password },
            { onSuccess: () => router.push(next) }
          )
        )}
      >
        <Field
          label={t.auth.emailOrPhone}
          error={errors.login?.message}
          hint={t.auth.emailOrPhoneHint}
        >
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="text"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              {...form.register('login')}
            />
          )}
        </Field>
        <Field label={t.auth.password} error={errors.password?.message}>
          {(id, d) => (
            <PasswordInput
              id={id}
              aria-describedby={d}
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
        {slow && (
          <p role="status" className="text-center text-sm text-ink-muted">
            {t.auth.waking}
          </p>
        )}
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
