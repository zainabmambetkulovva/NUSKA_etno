'use client';

import { useState } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { switchLocalePath } from '@/components/layout/language-switcher';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { useLogout, useLogoutAll, useMe } from '@/hooks/use-auth';
import { locales, localeNames } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useToast } from '@/stores/toast';

interface DeviceSession {
  id: string;
  device: string;
  createdAt: string;
  lastUsedAt: string;
  current: boolean;
}

/** E-mail status, signed-in devices and «sign out everywhere». */
function SecurityCard() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const me = useMe();
  const toast = useToast((s) => s.show);
  const sessions = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => api<DeviceSession[]>('/auth/sessions'),
  });
  const logoutAll = useLogoutAll();

  return (
    <section className="card space-y-4 p-6" aria-labelledby="security-title">
      <h2 id="security-title" className="font-serif text-xl">
        {t.account.security}
      </h2>
      <p className="flex items-center justify-between gap-3 text-sm">
        <span className="text-ink-muted">{t.account.emailStatus}</span>
        <span className={cn('font-medium', me.data?.emailVerified ? 'text-brand' : 'text-danger')}>
          {me.data?.email} ·{' '}
          {me.data?.emailVerified ? t.account.emailConfirmed : t.account.emailNotConfirmed}
        </span>
      </p>
      <div>
        <p className="mb-2 text-sm text-ink-muted">{t.account.devices}</p>
        <ul className="divide-y divide-cream-dark/60 rounded-xl border border-cream-dark/60 bg-white text-sm">
          {(sessions.data ?? []).map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="font-medium">
                {session.device}
                {session.current && (
                  <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand">
                    {t.account.thisDevice}
                  </span>
                )}
              </span>
              <span className="text-xs text-ink-soft">
                {t.account.lastActive}: {formatDate(session.lastUsedAt, locale)}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {logoutAll.error && <ErrorBox>{errorMessage(logoutAll.error, t.errors)}</ErrorBox>}
      <Button
        variant="secondary"
        loading={logoutAll.isPending}
        onClick={() => {
          if (!window.confirm(t.account.logoutAllConfirm)) return;
          logoutAll.mutate(undefined, {
            onSuccess: () => {
              toast(t.account.logoutAllDone);
              router.push(`/${locale}/login`);
            },
          });
        }}
      >
        {t.account.logoutAll}
      </Button>
    </section>
  );
}

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const logout = useLogout();
  const toast = useToast((s) => s.show);
  const [currentPassword, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const valid = password.length >= 8 && /\p{L}/u.test(password) && /\d/.test(password);
  const change = useMutation({
    mutationFn: () =>
      api('/users/me/password', { method: 'POST', body: { currentPassword, password } }),
    onSuccess: () => {
      toast(t.account.passwordChanged);
      setCurrent('');
      setPassword('');
    },
  });

  return (
    <div className="max-w-xl space-y-6">
      <section className="card space-y-3 p-6">
        <h2 className="font-serif text-xl">{t.account.language}</h2>
        <div className="flex gap-2">
          {locales.map((l) => (
            <Link
              key={l}
              href={switchLocalePath(pathname, l)}
              onClick={() =>
                void api('/users/me', { method: 'PATCH', body: { locale: l } }).catch(
                  () => undefined
                )
              }
              className={cn(
                'rounded-full border px-4 py-2 text-sm',
                l === locale
                  ? 'border-brand bg-brand text-cream-light'
                  : 'border-cream-dark hover:border-brand'
              )}
            >
              {localeNames[l]}
            </Link>
          ))}
        </div>
      </section>

      <form
        className="card space-y-4 p-6"
        onSubmit={(e) => (e.preventDefault(), valid && change.mutate())}
      >
        <h2 className="font-serif text-xl">{t.account.changePassword}</h2>
        <Field label={t.account.currentPassword}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          )}
        </Field>
        <Field
          label={t.account.newPassword}
          hint={t.auth.passwordHint}
          error={password && !valid ? t.validation.password : undefined}
        >
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
        </Field>
        {change.error && <ErrorBox>{errorMessage(change.error, t.errors)}</ErrorBox>}
        <Button type="submit" loading={change.isPending} disabled={!valid || !currentPassword}>
          {t.common.save}
        </Button>
      </form>

      <SecurityCard />

      <Button
        variant="danger"
        onClick={() => logout.mutate(undefined, { onSettled: () => router.push(`/${locale}`) })}
        loading={logout.isPending}
      >
        {t.account.logout}
      </Button>
    </div>
  );
}
