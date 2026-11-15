'use client';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { ButtonLink } from '@/components/ui/button';
import { useI18n } from '@/i18n/i18n-provider';

export function NotFoundContent() {
  const { t, locale } = useI18n();
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <KochkorMuyuz className="h-14 w-28 text-brand/40" />
      <h1 className="text-3xl font-semibold">{t.common.notFoundTitle}</h1>
      <p className="text-ink-muted">{t.common.notFoundText}</p>
      <ButtonLink href={`/${locale}`}>{t.common.toHome}</ButtonLink>
    </div>
  );
}
