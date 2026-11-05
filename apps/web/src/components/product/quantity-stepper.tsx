'use client';

import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

export function QuantityStepper({
  value,
  max = 99,
  onChange,
  disabled,
  label,
  className,
}: {
  value: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  label: string;
  className?: string;
}) {
  const btn =
    'flex h-9 w-9 items-center justify-center rounded-full text-brand transition hover:bg-brand-50 disabled:opacity-40';
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-cream-dark bg-white',
        className
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="−"
      >
        <MinusIcon width={16} height={16} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="+"
      >
        <PlusIcon width={16} height={16} />
      </button>
    </div>
  );
}
