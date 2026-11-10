import Image from 'next/image';

import { Leaf, MountainSilhouettes, Wave } from '@/components/brand/kyrgyz-decor';
import { LogoMark } from '@/components/brand/logo';
import {
  HeartIcon,
  JugIcon,
  LeafIcon,
  MountainIcon,
  ShieldIcon,
  SproutIcon,
} from '@/components/ui/icons';
import { Reveal } from '@/components/ui/reveal';
import type { Dictionary } from '@/i18n/dictionaries/ky';
import { cn } from '@/lib/cn';

/** Photo (sent by the company) and icon of each promise, in order 01–06. */
const ITEMS = [
  { photo: 'navat', Icon: LeafIcon },
  { photo: 'kymyz', Icon: MountainIcon },
  { photo: 'sary-mai', Icon: ShieldIcon },
  { photo: 'kompot', Icon: HeartIcon },
  { photo: 'besh-barmak', Icon: JugIcon },
  { photo: 'zhupka', Icon: SproutIcon },
] as const;

/**
 * "Why choose us?" after the brand reference: deep green with the Tian Shan,
 * big translucent numbers, gold line icons and the company's product photos
 * floating next to each promise, joined by thin gold curves.
 */
export function WhyUs({ t }: { t: Dictionary }) {
  return (
    <section
      className="relative overflow-hidden bg-[#1E3A23] text-[#FAF8EF]"
      aria-labelledby="why-title"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(214,173,98,0.18),transparent_45%),radial-gradient(ellipse_at_15%_60%,rgba(125,164,83,0.18),transparent_45%)]"
        aria-hidden
      />
      <MountainSilhouettes className="absolute inset-x-0 bottom-10 h-56 w-full opacity-60" />
      <Leaf className="absolute left-6 top-24 h-12 w-20 [--sway-from:-30deg] [--sway-to:-18deg]" />
      <Leaf
        className="absolute right-10 top-[38%] h-10 w-16 [--sway-from:160deg] [--sway-to:172deg]"
        style={{ animationDelay: '-2.5s' }}
      />

      <div className="container relative pb-24 pt-14 sm:pt-20">
        <Reveal className="text-center">
          <div className="mx-auto flex max-w-sm items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D6AD62]/70" />
            <LogoMark className="h-8 w-8" />
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D6AD62]/70" />
          </div>
          <h2 id="why-title" className="mt-6 font-serif text-4xl leading-tight sm:text-6xl">
            <span className="block text-[#FAF8EF]">{t.home.whyTitleTop}</span>{' '}
            <span className="block italic text-[#E7C77F]">{t.home.whyTitleAccent}</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[#F4E9B9]/85">{t.home.whyText}</p>
        </Reveal>

        <ol className="mt-14 grid gap-x-12 gap-y-14 md:grid-cols-2">
          {t.home.why.map((item, i) => {
            const { photo, Icon } = ITEMS[i % ITEMS.length];
            const flip = i % 2 === 1;
            return (
              <li key={item.title}>
                <Reveal delay={(i % 2) * 0.12}>
                  <div
                    className={cn(
                      'relative flex flex-col items-center gap-6 sm:flex-row',
                      flip && 'sm:flex-row-reverse'
                    )}
                  >
                    <div className="relative min-w-0 flex-1">
                      <span
                        className="pointer-events-none absolute -top-12 left-0 select-none font-serif text-[7rem] leading-none text-[#FAF8EF]/[0.07]"
                        aria-hidden
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="relative flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#D6AD62]/70 text-[#D6AD62]">
                          <Icon width={26} height={26} strokeWidth={1.4} />
                        </span>
                        <h3 className="font-sans text-lg font-semibold leading-snug text-[#FAF8EF]">
                          {item.title}
                        </h3>
                      </div>
                      <p className="relative mt-4 text-sm leading-relaxed text-[#F4E9B9]/80">
                        {item.text}
                      </p>
                    </div>

                    <div className="relative w-48 shrink-0 sm:w-56">
                      {/* thin gold curve from the text to the photo */}
                      <svg
                        viewBox="0 0 120 60"
                        className={cn(
                          'absolute -top-6 hidden h-12 w-24 text-[#D6AD62]/60 sm:block',
                          flip ? '-right-16 -scale-x-100' : '-left-16'
                        )}
                        fill="none"
                        aria-hidden
                      >
                        <path d="M2 58 C30 10 80 4 118 20" stroke="currentColor" strokeWidth="1" />
                        <circle cx="2" cy="58" r="2.5" fill="currentColor" />
                      </svg>
                      <div
                        className="motion-safe:animate-float"
                        style={{ animationDelay: `${-i * 0.9}s`, animationDuration: '6s' }}
                      >
                        <div
                          className={cn(
                            'relative aspect-square overflow-hidden rounded-[2rem] shadow-[0_30px_50px_-20px_rgba(0,0,0,0.7)] ring-1 ring-[#D6AD62]/50 transition duration-500 hover:scale-105',
                            flip ? '-rotate-3' : 'rotate-3'
                          )}
                        >
                          <Image
                            src={`/images/products/${photo}.webp`}
                            alt={item.photoAlt}
                            fill
                            sizes="224px"
                            className="object-cover"
                          />
                          <span
                            className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent"
                            aria-hidden
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </li>
            );
          })}
        </ol>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[#D6AD62]/25 pt-6 text-sm sm:flex-row">
          <p className="flex items-center gap-3 text-[#F4E9B9]/85">
            <LogoMark className="h-6 w-6" />
            {t.home.whyFooter}
          </p>
          <p className="text-xs tracking-[0.3em] text-[#D6AD62]">
            NATURAL • TRADITIONAL • KYRGYZSTAN
          </p>
        </div>
      </div>
      <Wave className="absolute inset-x-0 -bottom-px text-sand" />
    </section>
  );
}
