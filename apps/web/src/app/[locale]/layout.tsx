import type { ReactNode } from 'react';

import type { Metadata, Viewport } from 'next';

import type { CategoryNode } from '@nuska/types';

import { AiWidget } from '@/components/ai/ai-widget';
import { BackToTop } from '@/components/layout/back-to-top';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { SiteChrome } from '@/components/layout/site-chrome';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { alternates, resolveLocale, siteUrl } from '@/lib/locale-params';
import { AppProviders } from '@/providers/app-providers';

// Fonts ship with the site (Fontsource, OFL): the build needs no request to Google Fonts.
// Each file covers latin, cyrillic and cyrillic-ext (the Kyrgyz letters Ң ң, Ө ө, Ү ү);
// the browser downloads only the ranges a page uses.
import '@fontsource-variable/inter/index.css';
import '@fontsource-variable/lora/index.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/600.css';
import '../../styles/globals.css';

/** Link preview picture (WhatsApp, Telegram, Facebook…): the company's banner. */
const OG_IMAGE = '/og-image.jpg';

export const viewport: Viewport = { themeColor: '#1E3A23' };

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
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t.meta.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.meta.title,
      description: t.meta.description,
      images: [OG_IMAGE],
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
  const categories = await serverApiSafe<CategoryNode[]>('/categories', locale, []);
  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-cream-light"
        >
          {t.common.skipToContent}
        </a>
        <AppProviders locale={locale} dictionary={t}>
          <SiteChrome>
            <Header categories={categories.map(({ slug, name }) => ({ slug, name }))} />
          </SiteChrome>
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteChrome>
            <Footer locale={locale} t={t} />
            <AiWidget />
            <BackToTop />
          </SiteChrome>
        </AppProviders>
      </body>
    </html>
  );
}
