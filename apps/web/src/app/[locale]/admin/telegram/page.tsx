'use client';

import type { ReactNode } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AdminTitle } from '@/components/admin/admin-ui';
import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { CheckIcon } from '@/components/ui/icons';
import { ErrorBox } from '@/components/ui/misc';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { ApiError, errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { askConfirm } from '@/stores/confirm';
import { useToast } from '@/stores/toast';

interface Chat {
  id: string;
  title: string;
}
interface TelegramStatus {
  tokenConfigured: boolean;
  bot: { username: string; name: string } | null;
  chats: Chat[];
  envChats: number;
  error?: string;
}

function Step({ title, done, children }: { title: string; done: boolean; children: ReactNode }) {
  const { t } = useI18n();
  const tg = t.admin.telegram;
  return (
    <section className="card space-y-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-nk-ink">{title}</h2>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
            done ? 'bg-nk-sage text-nk-forest' : 'bg-nk-cream text-nk-muted'
          )}
        >
          {done && <CheckIcon width={14} height={14} />}
          {done ? tg.done : tg.todo}
        </span>
      </div>
      {children}
    </section>
  );
}

/** Shows Telegram's own reason next to our message (e.g. "chat not found"). */
function TelegramError({ error }: { error: unknown }) {
  const { t } = useI18n();
  const detail = error instanceof ApiError ? error.body?.message : null;
  return (
    <ErrorBox>
      {errorMessage(error, t.errors)}
      {detail && error instanceof ApiError && error.code.startsWith('TELEGRAM') && (
        <span className="mt-1 block text-xs opacity-80">{detail}</span>
      )}
    </ErrorBox>
  );
}

/**
 * Connects the shop's Telegram: the bot token is a server secret (Render),
 * the chats are found and connected here with buttons — no ids to copy.
 */
export default function AdminTelegramPage() {
  const { t } = useI18n();
  const tg = t.admin.telegram;
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const status = useQuery({
    queryKey: ['admin', 'telegram'],
    queryFn: () => api<TelegramStatus>('/admin/telegram'),
  });
  const setStatus = (data: TelegramStatus) => queryClient.setQueryData(['admin', 'telegram'], data);
  const discover = useMutation({
    mutationFn: () => api<Chat[]>('/admin/telegram/discover', { method: 'POST' }),
  });
  const connect = useMutation({
    mutationFn: (chat: Chat) =>
      api<TelegramStatus>('/admin/telegram/chats', { method: 'POST', body: chat }),
    onSuccess: (data) => (setStatus(data), toast(t.common.saved)),
  });
  const disconnect = useMutation({
    mutationFn: (id: string) =>
      api<TelegramStatus>(`/admin/telegram/chats/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: setStatus,
  });
  const test = useMutation({
    mutationFn: () => api<{ sent: number }>('/admin/telegram/test', { method: 'POST' }),
    onSuccess: (r) => toast(tg.testSent.replace('{n}', String(r.sent))),
  });

  if (!status.data) return <OrnamentLoader label={t.common.loading} />;
  const s = status.data;
  const botOk = s.tokenConfigured && Boolean(s.bot);
  const hasChats = s.chats.length + s.envChats > 0;
  const connectedIds = new Set(s.chats.map((c) => c.id));
  const found = (discover.data ?? []).filter((c) => !connectedIds.has(c.id));

  return (
    <div className="space-y-5">
      <AdminTitle hint={tg.hint}>{tg.title}</AdminTitle>

      <Step title={tg.step1} done={botOk}>
        {botOk ? (
          <p className="text-nk-ink">
            {tg.botReady}{' '}
            <a
              href={`https://t.me/${s.bot!.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-nk-forest underline-offset-4 hover:underline"
            >
              @{s.bot!.username}
            </a>
          </p>
        ) : (
          <>
            <p className="leading-relaxed text-nk-muted">{tg.step1Text}</p>
            {s.tokenConfigured && s.error && (
              <ErrorBox>
                {tg.botError} {s.error}
              </ErrorBox>
            )}
          </>
        )}
      </Step>

      <Step title={tg.step2} done={hasChats}>
        <p className="leading-relaxed text-nk-muted">{tg.step2Text}</p>
        <Button
          variant="outline"
          disabled={!botOk}
          loading={discover.isPending}
          onClick={() => discover.mutate()}
        >
          {tg.discover}
        </Button>
        {discover.error && <TelegramError error={discover.error} />}
        {discover.isSuccess && discover.data.length === 0 && (
          <p className="text-sm text-nk-muted">{tg.noneFound}</p>
        )}
        {found.length > 0 && (
          <ul className="space-y-2">
            {found.map((chat) => (
              <li
                key={chat.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-nk-beige bg-nk-cream/60 px-4 py-3"
              >
                <span className="font-medium text-nk-ink">{chat.title}</span>
                <Button
                  size="sm"
                  loading={connect.isPending && connect.variables?.id === chat.id}
                  onClick={() => connect.mutate(chat)}
                >
                  {tg.connect}
                </Button>
              </li>
            ))}
          </ul>
        )}
        {connect.error && <TelegramError error={connect.error} />}

        <div className="border-t border-nk-beige pt-4">
          <p className="mb-2 text-sm font-semibold text-nk-ink">{tg.connected}</p>
          {s.chats.length === 0 ? (
            <p className="text-sm text-nk-muted">{tg.noChats}</p>
          ) : (
            <ul className="space-y-2">
              {s.chats.map((chat) => (
                <li
                  key={chat.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-nk-sage/40 px-4 py-3"
                >
                  <span className="flex items-center gap-2 font-medium text-nk-forest">
                    <CheckIcon width={16} height={16} /> {chat.title}
                  </span>
                  <button
                    type="button"
                    className="rounded-xl px-3 py-1.5 text-sm text-nk-muted transition hover:bg-white hover:text-danger"
                    onClick={() =>
                      void askConfirm(tg.disconnectConfirm, { danger: true }).then(
                        (ok) => ok && disconnect.mutate(chat.id)
                      )
                    }
                  >
                    {tg.disconnect}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {s.envChats > 0 && (
            <p className="mt-2 text-sm text-nk-muted">
              {tg.envChats.replace('{n}', String(s.envChats))}
            </p>
          )}
        </div>
      </Step>

      <Step title={tg.step3} done={test.isSuccess}>
        <p className="text-nk-muted">{tg.step3Text}</p>
        <Button
          disabled={!botOk || !hasChats}
          loading={test.isPending}
          onClick={() => test.mutate()}
        >
          {tg.test}
        </Button>
        {test.error && <TelegramError error={test.error} />}
      </Step>
    </div>
  );
}
