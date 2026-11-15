'use client';

import { useEffect } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

import { AiChat } from './ai-chat';
import { NuskaOrb } from './nuska-orb';

import { CloseIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { useAiWidget } from '@/stores/ai-widget';

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
              <NuskaOrb className="h-9 w-9" />
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
        className="group fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-brand py-2 pl-2 pr-4 text-sm font-medium text-cream-light shadow-lift transition hover:-translate-y-0.5 sm:right-5"
      >
        <NuskaOrb className="h-9 w-9" active={open} />
        <span className="hidden sm:inline">{t.ai.name}</span>
      </button>
    </>
  );
}
