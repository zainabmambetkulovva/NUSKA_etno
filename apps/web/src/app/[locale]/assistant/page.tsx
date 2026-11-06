import type { Metadata } from 'next';

import { AiChat } from '@/components/ai/ai-chat';
import { AiSymbol } from '@/components/ai/ai-symbol';
import { getDictionary } from '@/i18n/get-dictionary';
import { alternates, resolveLocale } from '@/lib/locale-params';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  return {
    title: t.ai.name,
    description: t.ai.homeText,
    alternates: alternates(locale, '/assistant'),
  };
}

export default async function AssistantPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.slice(0, 300);
  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[360px_1fr]">
      <aside className="space-y-4 text-center lg:sticky lg:top-24 lg:h-fit lg:text-left">
        <AiSymbol className="mx-auto h-56 w-56 lg:mx-0" />
        <h1 className="text-4xl font-semibold">{t.ai.name}</h1>
        <p className="text-ink-muted">{t.ai.homeText}</p>
      </aside>
      <AiChat
        initialQuestion={q}
        className="h-[min(760px,calc(100dvh-8rem))] overflow-hidden rounded-2xl border border-cream-dark/60 bg-milk shadow-card"
      />
    </div>
  );
}
