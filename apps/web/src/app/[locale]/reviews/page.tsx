import type { Metadata } from 'next';

import type { Testimonial } from '@nuska/types';

import { LogoMark } from '@/components/brand/logo';
import { TestimonialCard } from '@/components/home/testimonials';
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
  return { title: t.home.reviewsTitle, alternates: alternates(locale, '/reviews') };
}

/** All published testimonials. */
export default async function ReviewsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const t = await getDictionary(locale);
  const items = await serverApiSafe<Testimonial[]>('/testimonials', locale, []);
  return (
    <div className="bg-[#243D2B] pb-20 pt-14 text-[#FAF8EF]">
      <div className="container">
        <div className="mb-12 text-center">
          <LogoMark className="mx-auto h-10 w-10" />
          <h1 className="mt-4 font-serif text-4xl text-[#FAF8EF] md:text-5xl">
            {t.home.reviewsTitle}
          </h1>
          <p className="mt-3 font-serif text-lg italic text-[#F4E9B9]/85">{t.home.reviewsText}</p>
        </div>
        {items.length === 0 ? (
          <p className="text-center text-[#F4E9B9]/80">{t.home.reviewsEmpty}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <li key={item.id}>
                <TestimonialCard item={item} index={i} />
              </li>
            ))}
          </ul>
        )}
        {items.some((item) => item.isDemo) && (
          <p className="mt-8 text-center text-xs text-[#F4E9B9]/60">{t.home.reviewsSampleNote}</p>
        )}
      </div>
    </div>
  );
}
