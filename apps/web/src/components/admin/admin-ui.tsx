'use client';

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

export function AdminTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-3xl font-semibold">{children}</h1>
      {action}
    </div>
  );
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-cream-dark/60 bg-cream-50 text-xs uppercase tracking-wider text-ink-soft">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-cream-dark/40">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-middle', className)}>{children}</td>;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-ink-soft">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-brand-dark">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-soft">{hint}</div>}
    </div>
  );
}

export function Pager({
  total,
  limit,
  offset,
  onChange,
  labels,
}: {
  total: number;
  limit: number;
  offset: number;
  onChange: (offset: number) => void;
  labels: { prev: string; next: string };
}) {
  if (total <= limit) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-3 text-sm">
      <button
        type="button"
        className="rounded-full px-3 py-1.5 hover:bg-cream-50 disabled:opacity-40"
        disabled={offset === 0}
        onClick={() => onChange(Math.max(0, offset - limit))}
      >
        {labels.prev}
      </button>
      <span className="text-ink-soft">
        {Math.floor(offset / limit) + 1} / {Math.ceil(total / limit)}
      </span>
      <button
        type="button"
        className="rounded-full px-3 py-1.5 hover:bg-cream-50 disabled:opacity-40"
        disabled={offset + limit >= total}
        onClick={() => onChange(offset + limit)}
      >
        {labels.next}
      </button>
    </div>
  );
}
