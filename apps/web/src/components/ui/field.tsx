import { forwardRef, useId, type ComponentProps, type ReactNode } from 'react';

import { cn } from '@/lib/cn';

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}

/** Label + control + hint/error with correct aria wiring. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function Input(
  { className, ...props },
  ref
) {
  return <input ref={ref} className={cn('field-input', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn('field-input min-h-[96px]', className)} {...props} />;
  }
);

export const Select = forwardRef<HTMLSelectElement, ComponentProps<'select'>>(function Select(
  { className, ...props },
  ref
) {
  return <select ref={ref} className={cn('field-input pr-8', className)} {...props} />;
});

export function Checkbox({
  label,
  className,
  ...props
}: ComponentProps<'input'> & { label: ReactNode }) {
  return (
    <label
      className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-ink', className)}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-cream-dark accent-brand"
        {...props}
      />
      {label}
    </label>
  );
}
