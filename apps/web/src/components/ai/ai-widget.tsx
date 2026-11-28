'use client';

import { useEffect } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { AiChat } from './ai-chat';

import { CloseIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';
import { useAiWidget } from '@/stores/ai-widget';

/** The NUSKA logo (the five swirls), centred, for the button and the chat header. */
function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <Image
      src="/images/logo-nuska.webp"
      alt=""
      width={460}
      height={433}
      sizes="48px"
      className={`${className} object-contain`}
      aria-hidden
    />
  );
}

/** Floating NUSKA AI button + small chat window (on every page except the admin panel). */
export function AiWidget() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const { open, setOpen, pending, takePending } = useAiWidget();
  useEffect(() => setOpen(false), [pathname, setOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  if (pathname.startsWith(`/${locale}/admin`)) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={t.ai.name}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-2 bottom-20 z-50 flex h-[min(620px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-cream-dark/60 bg-milk shadow-lift sm:inset-x-auto sm:right-5 sm:w-[400px]"
          >
            <div className="flex items-center gap-3 bg-brand px-4 py-3 text-cream-light">
              <Logo className="h-10 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg leading-tight">{t.ai.name}</p>
                <p className="truncate text-xs text-cream/75">{t.ai.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10"
                aria-label={t.common.close}
              >
                <CloseIcon />
              </button>
            </div>
            <AiChat
              className="min-h-0 flex-1"
              initialQuestion={pending ?? undefined}
              onAsked={takePending}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t.ai.open}
        className={cn(
          'group fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-sm font-medium text-cream-light shadow-lift ring-2 ring-nk-gold/50 transition hover:-translate-y-0.5',
          'sm:right-5 sm:w-auto sm:gap-2.5 sm:px-5',
          open && 'ring-nk-gold'
        )}
      >
        <Logo className="h-9 w-9 shrink-0 transition group-hover:scale-105" />
        <span className="hidden sm:inline">{t.ai.name}</span>
      </button>
    </>
  );
}
