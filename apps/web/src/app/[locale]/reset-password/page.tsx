'use client';

import { Suspense, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { AuthCard } from '@/components/auth/auth-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

function ResetForm() {
  const { t, locale } = useI18n();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const valid = password.length >= 8 && /\p{L}/u.test(password) && /\d/.test(password);
  const reset = useMutation({
    mutationFn: () => api('/auth/password/reset', { method: 'POST', body: { token, password } }),
  });

  if (!token)
    return (
      <AuthCard title={t.auth.resetTitle}>
        <ErrorBox>{t.auth.invalidLink}</ErrorBox>
      </AuthCard>
    );
  return (
    <AuthCard
      title={t.auth.resetTitle}
      footer={
        <Link href={`/${locale}/login`} className="text-brand hover:underline">
          {t.auth.login}
        </Link>
      }
    >
      {reset.isSuccess ? (
        <div className="space-y-4 text-center">
          <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-dark">{t.auth.resetDone}</p>
          <ButtonLink href={`/${locale}/login`}>{t.auth.login}</ButtonLink>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={(e) => (e.preventDefault(), valid && reset.mutate())}>
          <Field
            label={t.account.newPassword}
            hint={t.auth.passwordHint}
            error={password && !valid ? t.validation.password : undefined}
          >
            {(id, d) => (
              <Input
                id={id}
                aria-describedby={d}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}
          </Field>
          {reset.error && <ErrorBox>{errorMessage(reset.error, t.errors)}</ErrorBox>}
          <Button type="submit" className="w-full" loading={reset.isPending} disabled={!valid}>
            {t.auth.resetSubmit}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
