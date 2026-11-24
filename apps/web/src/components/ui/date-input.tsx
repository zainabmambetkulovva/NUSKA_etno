'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { createPortal } from 'react-dom';

import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon } from './icons';

import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

const MONTHS = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];
const WEEKDAYS = {
  ky: ['Дш', 'Шш', 'Шр', 'Бш', 'Жм', 'Иш', 'Жк'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
};

const two = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${two(m + 1)}-${two(d)}`;

function parse(value: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
}

/**
 * A date field with the site's own calendar (instead of the browser's).
 * The value is "YYYY-MM-DD" or "" — the same as <input type="date">.
 */
export function DateInput({
  value,
  onChange,
  id,
  className,
  required,
  ...aria
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  required?: boolean;
  'aria-label'?: string;
}) {
  const { t, locale } = useI18n();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const today = new Date();
  const picked = parse(value);
  const [view, setView] = useState({
    y: picked?.y ?? today.getFullYear(),
    m: picked?.m ?? today.getMonth(),
  });
  const [box, setBox] = useState<{ top: number; left: number; up: boolean } | null>(null);

  const place = useCallback(() => {
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    const up = window.innerHeight - rect.bottom < 360 && rect.top > 360;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 296));
    setBox({ top: up ? rect.top : rect.bottom, left, up });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (button.current?.contains(target) || panel.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  const toggle = () => {
    if (!open && picked) setView({ y: picked.y, m: picked.m });
    setOpen(!open);
  };
  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  // Monday first: the blank cells before the 1st, then the days
  const first = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [
    ...Array<null>(first).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());
  const label = picked ? `${two(picked.d)}.${two(picked.m + 1)}.${picked.y}` : '';

  return (
    <div className={cn('relative', className)}>
      {required && (
        <input
          tabIndex={-1}
          aria-hidden
          required
          value={value}
          onChange={() => undefined}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}
      <button
        ref={button}
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="field-input flex items-center justify-between gap-2 text-left"
        {...aria}
      >
        <span className={cn(!label && 'text-ink-soft')}>{label || t.common.datePlaceholder}</span>
        <CalendarIcon width={18} height={18} className="shrink-0 text-nk-muted" />
      </button>
      {open &&
        box &&
        createPortal(
          <div
            ref={panel}
            role="dialog"
            aria-label={t.common.datePlaceholder}
            className="fixed z-[90] w-[288px] rounded-3xl border border-nk-beige bg-white p-4 shadow-[0_24px_50px_-24px_rgba(50,40,20,0.55)]"
            style={{
              left: box.left,
              ...(box.up ? { bottom: window.innerHeight - box.top + 6 } : { top: box.top + 6 }),
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => shift(-1)}
                aria-label={t.common.prev}
                className="rounded-full p-2 text-nk-forest transition hover:bg-nk-sage/60"
              >
                <ArrowLeftIcon width={16} height={16} />
              </button>
              <span className="font-serif text-lg capitalize text-nk-ink">
                {MONTHS[view.m]} {view.y}
              </span>
              <button
                type="button"
                onClick={() => shift(1)}
                aria-label={t.common.next}
                className="rounded-full p-2 text-nk-forest transition hover:bg-nk-sage/60"
              >
                <ArrowRightIcon width={16} height={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-nk-muted">
              {WEEKDAYS[locale].map((w) => (
                <span key={w} className="py-1">
                  {w}
                </span>
              ))}
              {cells.map((day, i) => {
                if (!day) return <span key={`e${i}`} />;
                const dayIso = iso(view.y, view.m, day);
                const selected = dayIso === value;
                return (
                  <button
                    key={dayIso}
                    type="button"
                    onClick={() => (onChange(dayIso), setOpen(false))}
                    aria-pressed={selected}
                    className={cn(
                      'h-9 rounded-xl text-sm transition',
                      selected
                        ? 'bg-nk-forest font-semibold text-white'
                        : dayIso === todayIso
                          ? 'border border-nk-gold text-nk-ink hover:bg-nk-sage/60'
                          : 'text-nk-ink hover:bg-nk-sage/60'
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-nk-beige pt-3 text-sm">
              <button
                type="button"
                onClick={() => (onChange(''), setOpen(false))}
                className="rounded-full px-3 py-1.5 text-nk-muted transition hover:bg-nk-sage/50 hover:text-danger"
              >
                {t.common.clear}
              </button>
              <button
                type="button"
                onClick={() => (onChange(todayIso), setOpen(false))}
                className="rounded-full px-3 py-1.5 font-medium text-nk-forest transition hover:bg-nk-sage/50"
              >
                {t.common.today}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
