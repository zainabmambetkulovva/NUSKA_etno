'use client';

import { useEffect, type ReactNode } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { OrnamentLoader } from '@/components/brand/ornament';
import { Button } from '@/components/ui/button';
import { useMe } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/i18n-provider';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/cn';
import { useToast } from '@/stores/toast';

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { t, locale } = useI18n();
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast((s) => s.show);

  useEffect(() => {
    if (me.isFetched && !me.data)
      router.replace(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
  }, [me.isFetched, me.data, router, locale, pathname]);

  if (!me.data) return <OrnamentLoader label={t.common.loading} className="py-24" />;

  const base = `/${locale}/account`;
  const tabs = [
    { href: base, label: t.account.profile, exact: true },
    { href: `${base}/orders`, label: t.account.orders },
    { href: `${base}/favorites`, label: t.account.favorites },
    { href: `${base}/notifications`, label: t.account.notifications },
    { href: `${base}/settings`, label: t.account.settings },
    ...(me.data.role === 'ADMIN' ? [{ href: `/${locale}/admin`, label: t.nav.admin }] : []),
  ];

  return (
    <div className="container py-10">
      <h1 className="mb-6 text-4xl font-semibold">{t.account.title}</h1>
      {!me.data.emailVerified && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-dark bg-cream-light px-4 py-3 text-sm">
          <span>{t.auth.verifyBanner}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              api('/auth/email/resend', { method: 'POST' })
                .then(() => toast(t.auth.verifyResent))
                .catch(() => toast(t.errors.UNKNOWN, 'error'))
            }
          >
            {t.auth.verifyResend}
          </Button>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label={t.account.title}>
          {tabs.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-lg px-4 py-2.5 text-sm transition',
                  active ? 'bg-brand text-cream-light' : 'hover:bg-cream-50'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
