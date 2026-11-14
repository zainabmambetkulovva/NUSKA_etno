import type { ReactNode } from 'react';

import { KochkorMuyuz } from '../brand/ornament';

import { cn } from '@/lib/cn';

type Tone = 'green' | 'cream' | 'olive' | 'red' | 'gray';
const tones: Record<Tone, string> = {
  green: 'bg-brand-50 text-brand-dark',
  cream: 'bg-cream text-ink',
  olive: 'bg-olive/15 text-olive',
  red: 'bg-danger/10 text-danger',
  gray: 'bg-ink/5 text-ink-muted',
};

export function Badge({
  tone = 'green',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-14 text-center">
      <KochkorMuyuz className="h-10 w-20 text-brand/40" />
      <p className="text-ink-muted">{title}</p>
      {action}
    </div>
  );
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-cream-dark/40', className)} aria-hidden />;
}

/** Section heading with the brand's green caption plate (as on the company's Instagram). */
export function SectionHeading({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="space-y-2">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="max-w-2xl text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
