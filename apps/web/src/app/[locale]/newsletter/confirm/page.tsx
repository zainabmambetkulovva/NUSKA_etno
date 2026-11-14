'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { KochkorMuyuz, OrnamentLoader } from '@/components/brand/ornament';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';

function Confirm() {
  const { t, locale } = useI18n();
  const token = useSearchParams().get('token');
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (!token) return setState('fail');
    api('/newsletter/confirm', { method: 'POST', body: { token } })
      .then(() => setState('ok'))
      .catch(() => setState('fail'));
  }, [token]);

  return (
    <div className="container max-w-xl py-20 text-center">
      <h1 className="mb-6 text-3xl font-semibold">{t.newsletter.confirmTitle}</h1>
      {state === 'loading' ? (
        <OrnamentLoader label={t.newsletter.confirming} />
      ) : (
        <div className="space-y-4">
          <KochkorMuyuz className="mx-auto h-10 w-20 text-brand" animate />
          <p className="text-lg" role="status">
            {state === 'ok' ? t.newsletter.confirmOk : t.newsletter.confirmFail}
          </p>
          <Link href={`/${locale}`} className="text-brand hover:underline">
            {t.common.toHome}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function NewsletterConfirmPage() {
  return (
    <Suspense>
      <Confirm />
    </Suspense>
  );
}
