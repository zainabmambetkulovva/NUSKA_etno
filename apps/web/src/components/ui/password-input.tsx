'use client';

import { forwardRef, useState, type ComponentProps } from 'react';

import { Input } from './field';

import { useI18n } from '@/i18n/i18n-provider';

/** Password field with a «show / hide» eye. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<ComponentProps<'input'>, 'type'>>(
  function PasswordInput(props, ref) {
    const { t } = useI18n();
    const [shown, setShown] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} {...props} type={shown ? 'text' : 'password'} className="pr-11" />
        <button
          type="button"
          onClick={() => setShown(!shown)}
          aria-label={shown ? t.auth.hidePassword : t.auth.showPassword}
          aria-pressed={shown}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-soft transition hover:text-brand"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
            {shown && <path d="M4 4l16 16" />}
          </svg>
        </button>
      </div>
    );
  }
);
