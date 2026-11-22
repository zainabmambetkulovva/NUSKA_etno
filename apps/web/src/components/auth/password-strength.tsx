'use client';

import { CheckIcon } from '@/components/ui/icons';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

/**
 * Live feedback while a password is typed: the three rules the server asks
 * for (8+ characters, a letter, a digit) as ticks and a four-step meter.
 */
export function PasswordStrength({ value }: { value: string }) {
  const { t } = useI18n();
  const rules = [value.length >= 8, /\p{L}/u.test(value), /\d/.test(value)];
  const bonus = value.length >= 12 || /[^\p{L}\d]/u.test(value);
  const score = value ? rules.filter(Boolean).length + (rules.every(Boolean) && bonus ? 1 : 0) : 0;
  const steps = Math.min(4, Math.max(value ? 1 : 0, score));
  const tone = ['bg-cream-dark', 'bg-[#C9553B]', 'bg-[#D9A03F]', 'bg-[#8FA04A]', 'bg-brand'][steps];
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                i <= steps ? tone : 'bg-cream-dark/60'
              )}
            />
          ))}
        </div>
        <span className="w-20 text-right text-xs text-ink-soft">
          {steps > 0 ? t.auth.pwStrength[steps - 1] : ''}
        </span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {t.auth.pwRules.map((rule, i) => (
          <li
            key={rule}
            className={cn(
              'flex items-center gap-1.5 transition-colors',
              rules[i] ? 'text-brand' : 'text-ink-soft'
            )}
          >
            <span
              className={cn(
                'flex h-4 w-4 items-center justify-center rounded-full border transition',
                rules[i] ? 'border-brand bg-brand text-white' : 'border-cream-dark'
              )}
              aria-hidden
            >
              {rules[i] && <CheckIcon width={10} height={10} />}
            </span>
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}
