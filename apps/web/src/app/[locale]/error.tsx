'use client';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-provider';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-ink-muted">{t.common.error}</p>
      <Button onClick={reset}>{t.common.retry}</Button>
    </div>
  );
}
