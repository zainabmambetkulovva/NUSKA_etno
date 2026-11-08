'use client';

import type { ReactNode } from 'react';

import { useAiWidget } from '@/stores/ai-widget';

/** Button that opens the NUSKA AI window (optionally with a ready question). */
export function AskAi({
  question,
  className,
  children,
}: {
  question?: string;
  className?: string;
  children: ReactNode;
}) {
  const ask = useAiWidget((s) => s.ask);
  return (
    <button type="button" className={className} onClick={() => ask(question)}>
      {children}
    </button>
  );
}
