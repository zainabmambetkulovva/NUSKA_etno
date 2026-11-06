import type { ReactNode } from 'react';

import type { Metadata, Viewport } from 'next';

import { Inter, Lora } from 'next/font/google';

import { AiWidget } from '@/components/ai/ai-widget';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { getDictionary } from '@/i18n/get-dictionary';
import { alternates, resolveLocale, siteUrl } from '@/lib/locale-params';
import { AppProviders } from '@/providers/app-providers';

import '../../styles/globals.css';

// cyrillic-ext contains the Kyrgyz letters Ң ң, Ө ө, Ү ү.
const sans = Inter({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-sans',
  display: 'swap',
});
const serif = Lora({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-serif',
  display: 'swap',
});

export const viewport: Viewport = { themeColor: '#355B3E' };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: { default: t.meta.title, template: `%s — NUSKA_etno` },
    description: t.meta.description,
    alternates: alternates(locale),
    openGraph: {
      type: 'website',
      siteName: 'NUSKA_etno',
      title: t.meta.title,
      description: t.meta.description,
      locale: locale === 'ky' ? 'ky_KG' : 'ru_RU',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return (
    <html lang={locale} className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-cream-light"
        >
          {t.common.skipToContent}
        </a>
        <AppProviders locale={locale} dictionary={t}>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer locale={locale} t={t} />
          <AiWidget />
        </AppProviders>
      </body>
    </html>
  );
}
