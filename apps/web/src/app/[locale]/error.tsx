'use client';

import { useEffect, useTransition } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-provider';

/** Automatic retries per page: the API host on a free plan needs up to a minute to wake up. */
const DELAYS = [3000, 6000, 12000, 20000, 25000];
const attempts = { path: '', count: 0 };

/**
 * A page failed to load (usually the API host is still waking up). It tries
 * again by itself a few times; «Попробовать снова» reloads the page data from
 * the server (reset alone would only re-render the client).
 */
export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  useEffect(() => {
    console.error(error);
    if (attempts.path !== pathname) Object.assign(attempts, { path: pathname, count: 0 });
    const delay = DELAYS[attempts.count];
    if (delay === undefined) return;
    attempts.count += 1;
    const timer = window.setTimeout(retry, delay);
    return () => window.clearTimeout(timer);
  }, [error]);

  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      {pending && <OrnamentLoader label={t.common.loading} />}
      <p className="text-ink-muted">{t.common.error}</p>
      <Button onClick={retry} loading={pending}>
        {t.common.retry}
      </Button>
    </div>
  );
}
