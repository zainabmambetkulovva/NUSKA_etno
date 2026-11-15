'use client';

import { useState, type ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';

import { Toaster } from '@/components/ui/toaster';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { I18nProvider } from '@/i18n/i18n-provider';
import { ApiError } from '@/lib/api/client';

export function AppProviders({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, error) =>
              !(error instanceof ApiError && error.status < 500) && count < 2,
          },
        },
      })
  );
  return (
    <I18nProvider locale={locale} dictionary={dictionary}>
      <QueryClientProvider client={queryClient}>
        {/* Respects prefers-reduced-motion for all framer-motion animations (TZ §7.7). */}
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster />
        </MotionConfig>
      </QueryClientProvider>
    </I18nProvider>
  );
}
