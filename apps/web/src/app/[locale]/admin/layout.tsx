'use client';

import { useEffect, type ReactNode } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { OrnamentLoader } from '@/components/brand/ornament';
import { useMe } from '@/hooks/use-auth';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

/** Admin area. The real protection is on the API (role ADMIN on every /admin route). */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { t, locale } = useI18n();
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (me.isFetched && !me.data)
      router.replace(`/${locale}/login?next=${encodeURIComponent(pathname)}`);
    else if (me.data && me.data.role !== 'ADMIN') router.replace(`/${locale}`);
  }, [me.isFetched, me.data, router, locale, pathname]);

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
  ];

  return (
    <div className="container py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav
          className="flex gap-1 overflow-x-auto lg:sticky lg:top-24 lg:h-fit lg:flex-col"
          aria-label={t.admin.title}
        >
          <span className="mb-2 hidden px-4 text-xs font-semibold uppercase tracking-widest text-olive lg:block">
            {t.admin.title}
          </span>
          {links.map((link) => {
            const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'whitespace-nowrap rounded-lg px-4 py-2.5 text-sm',
                  active ? 'bg-brand text-cream-light' : 'hover:bg-cream-50'
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
