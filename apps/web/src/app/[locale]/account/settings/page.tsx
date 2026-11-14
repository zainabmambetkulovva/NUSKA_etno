'use client';

import { useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { switchLocalePath } from '@/components/layout/language-switcher';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ErrorBox } from '@/components/ui/misc';
import { useLogout } from '@/hooks/use-auth';
import { locales, localeNames } from '@/i18n/config';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { errorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { useToast } from '@/stores/toast';

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
