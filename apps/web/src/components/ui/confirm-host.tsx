'use client';

import { useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';
import { useConfirmStore } from '@/stores/confirm';

/** Shows the question asked through `askConfirm` in the site's style. */
export function ConfirmHost() {
  const { t } = useI18n();
  const request = useConfirmStore((s) => s.request);
  const answer = useConfirmStore((s) => s.answer);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!request) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') answer(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, answer]);

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          key="confirm"
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label={t.common.close}
            className="absolute inset-0 cursor-default bg-nk-night/45 backdrop-blur-[3px]"
            onClick={() => answer(false)}
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-describedby="confirm-message"
            className="relative w-full max-w-sm rounded-3xl border border-nk-beige bg-gradient-to-b from-white to-nk-cream p-6 text-center shadow-[0_30px_70px_-30px_rgba(30,40,25,0.7)]"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <span
              className={cn(
                'mx-auto flex h-12 w-12 items-center justify-center rounded-full font-serif text-2xl',
                request.danger ? 'bg-danger/10 text-danger' : 'bg-nk-sage text-nk-forest'
              )}
              aria-hidden
            >
              ?
            </span>
            <p id="confirm-message" className="mt-4 font-serif text-xl leading-snug text-nk-ink">
              {request.message}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => answer(false)}
                className="rounded-full border border-nk-beige bg-white px-6 py-2.5 text-sm font-medium text-nk-ink transition hover:border-nk-forest hover:text-nk-forest"
              >
                {t.common.cancel}
              </button>
              <button
                ref={confirmRef}
                type="button"
                onClick={() => answer(true)}
                className={cn(
                  'rounded-full px-6 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(30,40,25,0.9)] transition hover:-translate-y-0.5',
                  request.danger ? 'bg-danger hover:bg-[#9a3825]' : 'bg-nk-forest hover:bg-nk-deep'
                )}
              >
                {request.danger ? t.common.delete : t.common.confirm}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
