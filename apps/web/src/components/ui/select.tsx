'use client';

import {
  Children,
  Fragment,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';

import { createPortal } from 'react-dom';

import { CheckIcon, ChevronDownIcon } from './icons';

import { cn } from '@/lib/cn';

interface Option {
  value: string;
  label: string;
  disabled: boolean;
}

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return '';
}

/** Reads the <option>s out of the children (also inside fragments and arrays). */
function collectOptions(children: ReactNode, out: Option[] = []): Option[] {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const element = child as ReactElement<{
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    }>;
    if (element.type === Fragment) {
      collectOptions(element.props.children, out);
    } else if (element.type === 'option') {
      const label = textOf(element.props.children);
      out.push({
        value: String(element.props.value ?? label),
        label,
        disabled: Boolean(element.props.disabled),
      });
    }
  });
  return out;
}

/**
 * A drop-down list in the site's style. It is a real <select> underneath
 * (hidden), so forms, react-hook-form and screen readers keep working; the
 * list that opens is drawn by the site, not by the browser.
 */
export const Select = forwardRef<HTMLSelectElement, ComponentProps<'select'>>(function Select(
  { className, children, disabled, id, ...props },
  forwardedRef
) {
  const native = useRef<HTMLSelectElement | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [active, setActive] = useState(0);
  const [box, setBox] = useState<{ top: number; left: number; width: number; up: boolean } | null>(
    null
  );
  const options = collectOptions(children);

  const setRefs = useCallback(
    (el: HTMLSelectElement | null) => {
      native.current = el;
      if (typeof forwardedRef === 'function') forwardedRef(el);
      else if (forwardedRef) forwardedRef.current = el;
    },
    [forwardedRef]
  );

  // the value can be changed from outside (form reset): read it after every render
  useLayoutEffect(() => {
    const value = native.current?.value ?? '';
    if (value !== current) setCurrent(value);
  });

  const place = useCallback(() => {
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    const room = window.innerHeight - rect.bottom;
    const up = room < 260 && rect.top > room;
    setBox({ top: up ? rect.top : rect.bottom, left: rect.left, width: rect.width, up });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (button.current?.contains(target) || list.current?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      if (list.current?.contains(e.target as Node)) return;
      place();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, place]);

  const choose = (value: string) => {
    const el = native.current;
    if (el && el.value !== value) {
      // set the value and tell React / react-hook-form, as a real choice does
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
      setter?.call(el, value);
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    setCurrent(value);
    setOpen(false);
    button.current?.focus();
  };

  const selected = options.find((o) => o.value === current);

  const openList = () => {
    if (disabled) return;
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === current)
      )
    );
    setOpen(true);
  };

  const move = (step: number) => {
    let next = active;
    for (let i = 0; i < options.length; i++) {
      next = (next + step + options.length) % options.length;
      if (!options[next]?.disabled) break;
    }
    setActive(next);
    list.current?.children[next]?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <div className={cn('relative', className)}>
      <select
        ref={setRefs}
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        {...props}
      >
        {children}
      </select>
      <button
        ref={button}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-describedby={props['aria-describedby']}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!open) openList();
            else move(e.key === 'ArrowDown' ? 1 : -1);
          } else if ((e.key === 'Enter' || e.key === ' ') && open) {
            e.preventDefault();
            const option = options[active];
            if (option && !option.disabled) choose(option.value);
          } else if (e.key === 'Escape' && open) {
            e.preventDefault();
            setOpen(false);
          } else if (e.key === 'Tab') {
            setOpen(false);
          }
        }}
        className="field-input flex items-center justify-between gap-2 pr-3 text-left disabled:cursor-not-allowed"
      >
        <span className={cn('truncate', !selected && 'text-ink-soft')}>
          {selected?.label ?? ' '}
        </span>
        <ChevronDownIcon
          width={18}
          height={18}
          className={cn('shrink-0 text-nk-muted transition-transform', open && 'rotate-180')}
        />
      </button>
      {open &&
        box &&
        createPortal(
          <ul
            ref={list}
            role="listbox"
            className="fixed z-[90] max-h-64 overflow-y-auto rounded-2xl border border-nk-beige bg-white p-1.5 shadow-[0_24px_50px_-24px_rgba(50,40,20,0.55)]"
            style={{
              left: Math.min(box.left, Math.max(8, window.innerWidth - 328)),
              minWidth: box.width,
              width: 'max-content',
              maxWidth: Math.min(360, window.innerWidth - 16),
              ...(box.up ? { bottom: window.innerHeight - box.top + 6 } : { top: box.top + 6 }),
            }}
          >
            {options.map((option, i) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === current}
                aria-disabled={option.disabled || undefined}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => !option.disabled && choose(option.value)}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm',
                  option.disabled && 'cursor-not-allowed opacity-40',
                  i === active && 'bg-nk-sage/60',
                  option.value === current && 'font-medium text-nk-forest'
                )}
              >
                <span className="truncate">{option.label}</span>
                {option.value === current && <CheckIcon width={16} height={16} />}
              </li>
            ))}
          </ul>,
          document.body
        )}
    </div>
  );
});
