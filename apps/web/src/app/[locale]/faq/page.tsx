import type { Metadata } from 'next';

import type { FaqItem } from '@nuska/types';
import Link from 'next/link';

import { KochkorMuyuz } from '@/components/brand/ornament';
import { FaqList } from '@/components/content/faq-list';
import { getDictionary } from '@/i18n/get-dictionary';
import { serverApiSafe } from '@/lib/api/server';
import { alternates, resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return { title: t.faq.title, alternates: alternates(locale, '/faq') };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const items = await serverApiSafe<FaqItem[]>('/faq', locale, []);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  };
  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-10 space-y-4 text-center">
        <KochkorMuyuz className="mx-auto h-10 w-20 text-brand/60" animate />
        <h1 className="text-4xl font-semibold md:text-5xl">{t.faq.title}</h1>
      </div>
      <FaqList items={items} interactive />
      <p className="mt-10 text-center text-ink-muted">
        <Link href={`/${locale}/contacts`} className="text-brand hover:underline">
          {t.faq.contact}
        </Link>
      </p>
      {items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </div>
  );
}
