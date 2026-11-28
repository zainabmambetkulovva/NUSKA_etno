'use client';

import { useEffect, type ReactNode } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { Logo } from '@/components/brand/logo';
import { OrnamentLoader } from '@/components/brand/ornament';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { ArrowRightIcon } from '@/components/ui/icons';
import { useLogout, useMe } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

/** Admin area. The real protection is on the API (role ADMIN on every /admin route). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t, locale } = useI18n();
  const me = useMe();
  const logout = useLogout();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (me.isFetched && !me.data)
      router.replace(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
  }, [me.isFetched, me.data, router, locale, pathname]);

  if (me.data && me.data.role !== 'ADMIN')
    return (
      <div className="container flex justify-center py-20">
        <div className="card max-w-md space-y-4 p-8 text-center">
          <h1 className="font-serif text-2xl text-nk-ink">{t.admin.noAccessTitle}</h1>
          <p className="text-ink-muted">{t.admin.noAccessText.replace('{email}', me.data.email)}</p>
          <Link
            href={`/${locale}/login?next=${encodeURIComponent(pathname)}`}
            className="btn-forest"
          >
            {t.admin.noAccessSwitch}
          </Link>
        </div>
      </div>
    );
  if (me.data?.role !== 'ADMIN')
    return <OrnamentLoader label={t.common.loading} className="py-24" />;

  const base = `/${locale}/admin`;
  const links = [
    { href: base, label: t.admin.dashboard, exact: true },
    { href: `${base}/orders`, label: t.admin.orders },
    { href: `${base}/products`, label: t.admin.products },
    { href: `${base}/categories`, label: t.admin.categories },
    { href: `${base}/users`, label: t.admin.users },
    { href: `${base}/reviews`, label: t.admin.reviews },
    { href: `${base}/pickup`, label: t.admin.pickup },
    { href: `${base}/content`, label: t.admin.content },
    { href: `${base}/faq`, label: t.admin.faq },
    { href: `${base}/testimonials`, label: t.admin.testimonials },
    { href: `${base}/newsletter`, label: t.admin.newsletter },
    { href: `${base}/telegram`, label: 'Telegram' },
    { href: `${base}/ai`, label: t.admin.aiTitle },
  ];

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-nk-cream via-white to-sand-light/70"
      data-no-reveal
    >
      <div className="mx-auto grid max-w-[1600px] gap-4 p-3 sm:p-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6 lg:p-5">
        {/* The menu stays in place while the page scrolls */}
        <aside className="lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
          <div className="flex h-full flex-col gap-3 rounded-3xl border border-nk-beige bg-gradient-to-b from-white to-nk-cream/70 p-3 shadow-[0_18px_40px_-26px_rgba(70,48,20,0.55)] lg:p-4">
            <div className="flex items-center justify-between gap-2 lg:block">
              <Logo href={`/${locale}`} tone="dark" className="shrink-0" />
              <div className="flex items-center gap-2 lg:hidden">
                <LanguageSwitcher />
              </div>
            </div>
            <span className="hidden px-3 pt-2 text-xs font-semibold uppercase tracking-widest text-olive lg:block">
              {t.admin.title}
            </span>
            <nav
              className="flex gap-1 overflow-x-auto pb-1 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0"
              aria-label={t.admin.title}
            >
              {links.map((link) => {
                const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'shrink-0 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition',
                      active
                        ? 'bg-nk-forest font-medium text-white shadow-[0_10px_20px_-12px_rgba(42,72,49,0.9)]'
                        : 'text-nk-ink hover:bg-nk-sage/50'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="hidden space-y-2 border-t border-nk-beige pt-3 lg:block">
              <Link
                href={`/${locale}`}
                className="flex items-center justify-between rounded-xl bg-nk-sage/50 px-4 py-2.5 text-sm font-medium text-nk-forest transition hover:bg-nk-sage"
              >
                {t.admin.toSite}
                <ArrowRightIcon width={16} height={16} />
              </Link>
              <div className="flex items-center justify-between gap-2 px-1">
                <LanguageSwitcher />
                <button
                  type="button"
                  className="rounded-xl px-3 py-2 text-sm text-nk-muted transition hover:bg-nk-sage/50 hover:text-danger"
                  onClick={() =>
                    logout.mutate(undefined, { onSettled: () => router.replace(`/${locale}`) })
                  }
                >
                  {t.nav.logout}
                </button>
              </div>
              <p className="truncate px-2 text-xs text-nk-muted" title={me.data.email}>
                {me.data.email}
              </p>
            </div>
          </div>
        </aside>
        <div className="min-w-0 pb-6">{children}</div>
      </div>
    </div>
  );
}
