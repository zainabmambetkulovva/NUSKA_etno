'use client';

import { Suspense, useEffect, useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';

import { AuthCard } from '@/components/auth/auth-card';
import { OrnamentLoader } from '@/components/brand/ornament';
import { ButtonLink } from '@/components/ui/button';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';

function Verify() {
  const { t, locale } = useI18n();
  const token = useSearchParams().get('token') ?? '';
  const queryClient = useQueryClient();
  const verify = useMutation({
    mutationFn: () => api('/auth/email/verify', { method: 'POST', body: { token } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
  const started = useRef(false);
  useEffect(() => {
    if (token && !started.current) {
      started.current = true;
      verify.mutate();
    }
  }, [token, verify]);

  return (
    <AuthCard title={t.auth.verifyTitle}>
      {!token || verify.isError ? (
        <ErrorBox>{t.auth.invalidLink}</ErrorBox>
      ) : verify.isSuccess ? (
        <div className="space-y-4 text-center">
          <p className="rounded-xl bg-brand-50 p-4 text-sm text-brand-dark">{t.auth.verifyDone}</p>
          <ButtonLink href={`/${locale}/account`}>{t.nav.account}</ButtonLink>
        </div>
      ) : (
        <OrnamentLoader label={t.auth.verifying} />
      )}
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
