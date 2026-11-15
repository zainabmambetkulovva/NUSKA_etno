'use client';

import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';

import { AuthCard } from '@/components/auth/auth-card';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';

export default function ForgotPasswordPage() {
  const { t, locale } = useI18n();
  const [email, setEmail] = useState('');
  const send = useMutation({
    mutationFn: () => api('/auth/password/forgot', { method: 'POST', body: { email } }),
  });

  return (
    <AuthCard
      title={t.auth.forgotTitle}
      footer={
        <Link href={`/${locale}/login`} className="text-brand hover:underline">
          {t.auth.login}
        </Link>
      }
    >
      {send.isSuccess ? (
        <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-dark">{t.auth.forgotSent}</p>
      ) : (
        <form className="space-y-4" onSubmit={(e) => (e.preventDefault(), send.mutate())}>
          <p className="text-sm text-ink-muted">{t.auth.forgotText}</p>
          <Field label={t.auth.email}>
            {(id) => (
              <Input
                id={id}
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </Field>
          {send.error && <ErrorBox>{errorMessage(send.error, t.errors)}</ErrorBox>}
          <Button type="submit" className="w-full" loading={send.isPending}>
            {t.auth.forgotSend}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
