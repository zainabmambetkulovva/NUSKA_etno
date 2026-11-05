import type { ComponentProps, ReactNode } from 'react';

import Link from 'next/link';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition duration-200 ' +
  'disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-cream-light shadow-card hover:bg-brand-dark hover:shadow-lift',
  secondary: 'bg-cream text-brand-dark hover:bg-cream-dark',
  outline: 'border border-brand/60 text-brand hover:bg-brand hover:text-cream-light',
  ghost: 'text-ink hover:bg-cream-50 hover:text-brand',
  danger: 'border border-danger/50 text-danger hover:bg-danger hover:text-white',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-[15px]',
  lg: 'h-12 px-8 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden
    />
  );
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant,
  size,
  loading,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
