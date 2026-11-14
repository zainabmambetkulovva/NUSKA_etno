'use client';

import { useEffect, useRef, useState } from 'react';

import type { AiReply, AiStatus } from '@nuska/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { NuskaOrb } from './nuska-orb';

import { Button } from '@/components/ui/button';
import { ErrorBox } from '@/components/ui/misc';
import { useAddSetToCart } from '@/hooks/use-add-set';
import { useCart } from '@/hooks/use-cart';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useAiChat } from '@/stores/ai-chat';
import { useGiftSet } from '@/stores/gift-set';
import { useToast } from '@/stores/toast';

function Proposal({ reply }: { reply: AiReply }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const toast = useToast((s) => s.show);
  const addSet = useAddSetToCart();
  const loadSet = useGiftSet((s) => s.load);
  const proposal = reply.proposal!;
  return (
    <div className="mt-3 space-y-3 rounded-xl border border-brand/20 bg-milk p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-olive">{t.ai.proposal}</p>
      <ul className="space-y-1 text-sm">
        {proposal.items.map((l) => (
          <li key={l.product.id} className="flex justify-between gap-3">
            <Link
              href={`/${locale}/product/${l.product.slug}`}
              className="hover:text-brand hover:underline"
            >
              {l.product.name} × {l.quantity}
            </Link>
            <span className="shrink-0">{formatMoney(l.lineTotal, locale, t.common.som)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-cream-dark/60 pt-2 font-semibold">
        <span>{t.ai.total}</span>
        <span className="text-brand">{formatMoney(proposal.total, locale, t.common.som)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          loading={addSet.isPending}
          onClick={() =>
            addSet.mutate(proposal.items, {
              onSuccess: (r) =>
                r.skipped > 0 ? toast(t.gift.skipped, 'error') : toast(t.ai.added),
            })
          }
        >
          {t.ai.addAll}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            loadSet(proposal.items.map((l) => ({ productId: l.product.id, quantity: l.quantity })));
            router.push(`/${locale}/gift-builder`);
          }}
        >
          {t.ai.openInBuilder}
        </Button>
      </div>
      <p className="text-xs text-ink-soft">{t.ai.confirmNote}</p>
    </div>
  );
}

function Products({ reply }: { reply: AiReply }) {
  const { t, locale } = useI18n();
  if (reply.products.length === 0) return null;
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {reply.products.map((p) => (
        <li key={p.id}>
          <Link
            href={`/${locale}/product/${p.slug}`}
            className="flex items-center justify-between gap-2 rounded-lg border border-cream-dark/60 bg-milk px-3 py-2 text-sm transition hover:border-brand"
          >
            <span className="truncate">{p.name}</span>
            <span className="shrink-0 text-brand">
              {formatMoney(p.price, locale, t.common.som)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Chat with NUSKA AI, shown in the small floating window. */
export function AiChat({
  className,
  initialQuestion,
  onAsked,
}: {
  className?: string;
  initialQuestion?: string;
  /** Called once the initial question was sent. */
  onAsked?: () => void;
}) {
  const { t, locale } = useI18n();
  const { entries, push, clear } = useAiChat();
  const { lines } = useCart();
  const [text, setText] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const asked = useRef<string | null>(null);
  useEffect(() => setHydrated(true), []);

  const status = useQuery({
    queryKey: ['ai-status'],
    queryFn: () => api<AiStatus>('/ai/status'),
    staleTime: 60_000,
  });

  const send = useMutation({
    mutationFn: (question: string) => {
      const history = [
        ...useAiChat.getState().entries,
        { role: 'user' as const, content: question },
      ]
        .slice(-12)
        .map((e) => ({ role: e.role, content: e.content.slice(0, 1000) }));
      return api<AiReply>('/ai/chat', {
        method: 'POST',
        locale,
        body: {
          locale,
          messages: history,
          cart: lines.slice(0, 30).map((l) => ({ productId: l.productId, quantity: l.quantity })),
        },
      });
    },
    onSuccess: (reply) => push({ role: 'assistant', content: reply.reply || t.ai.proposal, reply }),
  });

  const ask = (question: string) => {
    const q = question.trim().slice(0, 1000);
    if (!q || send.isPending) return;
    push({ role: 'user', content: q });
    setText('');
    send.mutate(q);
  };

  useEffect(() => {
    if (!initialQuestion) {
      asked.current = null;
      return;
    }
    if (hydrated && asked.current !== initialQuestion) {
      asked.current = initialQuestion;
      ask(initialQuestion);
      onAsked?.();
    }
  }, [hydrated, initialQuestion]);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' });
  }, [entries.length, send.isPending]);

  const shown = hydrated ? entries : [];
  const lastReply = [...shown].reverse().find((e) => e.reply)?.reply;
  const suggestions = shown.length === 0 ? t.ai.examples : (lastReply?.suggestions ?? []);
  const disabled = status.data?.enabled === false;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex items-center justify-between gap-2 border-b border-cream-dark/60 px-4 py-2 text-xs">
        <span
          className={cn(
            'flex items-center gap-2',
            status.data?.mode === 'catalog' ? 'text-olive' : 'text-brand'
          )}
        >
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              status.data?.mode === 'ai' ? 'bg-brand' : 'bg-gold'
            )}
          />
          {status.data
            ? status.data.mode === 'ai'
              ? t.ai.modeAi
              : t.ai.modeCatalog
            : t.common.loading}
        </span>
        {shown.length > 0 && (
          <button type="button" onClick={clear} className="text-ink-soft hover:text-brand">
            {t.ai.clear}
          </button>
        )}
      </div>

      <div ref={list} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4" aria-live="polite">
        <div className="flex gap-3">
          <NuskaOrb className="h-8 w-8 shrink-0" />
          <p className="rounded-2xl rounded-tl-sm bg-cream-light px-4 py-3 text-sm">
            {t.ai.greeting}
          </p>
        </div>
        {shown.map((e) =>
          e.role === 'user' ? (
            <p
              key={e.id}
              className="ml-auto w-fit max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-brand px-4 py-3 text-sm text-cream-light"
            >
              {e.content}
            </p>
          ) : (
            <div key={e.id} className="flex gap-3">
              <NuskaOrb className="h-8 w-8 shrink-0" />
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-cream-light px-4 py-3 text-sm">
                <p className="whitespace-pre-line">{e.content}</p>
                {e.reply && <Products reply={e.reply} />}
                {e.reply?.proposal && <Proposal reply={e.reply} />}
              </div>
            </div>
          )
        )}
        {send.isPending && (
          <div className="flex items-center gap-3 text-sm text-ink-soft" role="status">
            <NuskaOrb className="h-8 w-8" active /> {t.ai.thinking}
          </div>
        )}
        {send.error && <ErrorBox>{errorMessage(send.error, t.errors)}</ErrorBox>}
        {disabled && <ErrorBox>{t.ai.disabled}</ErrorBox>}
      </div>

      {suggestions.length > 0 && !disabled && (
        <div className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="shrink-0 rounded-full border border-brand/30 bg-milk px-3 py-1.5 text-xs text-brand transition hover:bg-brand hover:text-cream-light"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        className="flex gap-2 border-t border-cream-dark/60 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          ask(text);
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          disabled={disabled}
          placeholder={t.ai.placeholder}
          aria-label={t.ai.placeholder}
          className="h-11 min-w-0 flex-1 rounded-full border border-cream-dark bg-white px-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <Button type="submit" disabled={disabled || !text.trim()} loading={send.isPending}>
          {t.ai.send}
        </Button>
      </form>
      <p className="px-4 pb-3 text-[11px] text-ink-soft">{t.ai.disclaimer}</p>
    </div>
  );
}
