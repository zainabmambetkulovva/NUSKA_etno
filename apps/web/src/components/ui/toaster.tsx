'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { CheckIcon, CloseIcon } from './icons';

import { cn } from '@/lib/cn';
import { useToast } from '@/stores/toast';

/** Smooth confirmation messages (e.g. "added to cart", TZ §7.5). */
export function Toaster() {
  const { toasts, dismiss } = useToast();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            className={cn(
              'pointer-events-auto flex items-center gap-3 rounded-full px-5 py-3 text-sm shadow-lift',
              toast.tone === 'success' ? 'bg-brand text-cream-light' : 'bg-danger text-white'
            )}
          >
            {toast.tone === 'success' ? <CheckIcon /> : <CloseIcon />}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="opacity-70 hover:opacity-100"
              aria-label="×"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
