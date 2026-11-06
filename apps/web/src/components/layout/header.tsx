'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { LanguageSwitcher } from './language-switcher';
import { CatalogMegaMenu } from './mega-menu';

import { Logo } from '@/components/brand/logo';
import {
  CartIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from '@/components/ui/icons';
import { useMe } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useFavoriteIds } from '@/hooks/use-favorites';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

function useNavLinks() {
  const { t, locale } = useI18n();
  return [
    { href: `/${locale}`, label: t.nav.home, exact: true },
    { href: `/${locale}/catalog`, label: t.nav.catalog, mega: true },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/traditions`, label: t.nav.traditions },
    { href: `/${locale}/pickup`, label: t.nav.pickup },
    { href: `/${locale}/contacts`, label: t.nav.contacts },
  ];
}

function CartLink() {
  const { t, locale } = useI18n();
  const { count } = useCart();
  const [bump, setBump] = useState(false);
  const previous = useRef(count);
  useEffect(() => {
    if (count > previous.current) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 400);
      previous.current = count;
      return () => clearTimeout(timer);
    }
    previous.current = count;
  }, [count]);

  return (
    <Link
      href={`/${locale}/cart`}
      data-cart-target
      className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-50"
      aria-label={`${t.nav.cart}: ${count}`}
    >
      <CartIcon />
      <CountBadge count={count} bump={bump} />
    </Link>
  );
}

function CountBadge({ count, bump }: { count: number; bump?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-cream-light',
        bump && 'animate-bump'
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function FavoritesLink({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const me = useMe();
  const ids = useFavoriteIds();
  const count = ids.data?.size ?? 0;
  return (
    <Link
      href={me.data ? `/${locale}/account/favorites` : `/${locale}/login`}
      className={cn(
        'relative h-10 w-10 items-center justify-center rounded-full hover:bg-cream-50',
        className
      )}
      aria-label={`${t.nav.favorites}: ${count}`}
    >
      <HeartIcon />
      <CountBadge count={count} />
    </Link>
  );
}

function SearchForm({ onDone, className }: { onDone?: () => void; className?: string }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault();
        const q = String(new FormData(event.currentTarget).get('q') ?? '').trim();
        router.push(q ? `/${locale}/search?q=${encodeURIComponent(q)}` : `/${locale}/search`);
        onDone?.();
      }}
    >
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
        width={18}
        height={18}
      />
      <input
        name="q"
        type="search"
        placeholder={t.catalog.searchPlaceholder}
        aria-label={t.common.search}
        className="h-10 w-full rounded-full border border-cream-dark bg-white pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </form>
  );
}

export function Header() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const links = useNavLinks();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);
  const accountHref = me.data ? `/${locale}/account` : `/${locale}/login`;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300',
          scrolled
            ? 'border-cream-dark/60 bg-milk/90 shadow-soft backdrop-blur-md'
            : 'border-transparent bg-cream-light'
        )}
      >
        <div className="container flex h-16 items-center gap-4">
          <button
            type="button"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full xl:hidden"
            onClick={() => setOpen(true)}
            aria-label={t.nav.menu}
            aria-expanded={open}
          >
            <MenuIcon />
          </button>
          <Logo href={`/${locale}`} animate />

          <nav className="ml-6 hidden items-center gap-1 xl:flex" aria-label={t.nav.menu}>
            {links.map((link) =>
              link.mega ? (
                <CatalogMegaMenu key={link.href} active={isActive(link.href)} />
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
                  className={cn(
                    'group relative whitespace-nowrap rounded-full px-3 py-2 text-sm transition',
                    isActive(link.href, link.exact)
                      ? 'bg-brand-50 font-medium text-brand-dark'
                      : 'text-ink-muted hover:text-brand'
                  )}
                >
                  {link.label}
                  <span
                    className="absolute inset-x-3 bottom-1 h-px origin-left scale-x-0 bg-brand transition-transform group-hover:scale-x-100"
                    aria-hidden
                  />
                </Link>
              )
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <SearchForm className="mr-2 hidden w-52 2xl:block" />
            <Suspense>
              <LanguageSwitcher className="mr-1 hidden sm:inline-flex" />
            </Suspense>
            <Link
              href={`/${locale}/search`}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-cream-50 2xl:hidden"
              aria-label={t.nav.search}
            >
              <SearchIcon />
            </Link>
            <FavoritesLink className="hidden sm:flex" />
            <CartLink />
            <Link
              href={accountHref}
              className="flex h-10 items-center gap-2 rounded-full px-2 hover:bg-cream-50"
              aria-label={me.data ? t.nav.account : t.nav.login}
            >
              <UserIcon />
              <span className="hidden text-sm md:inline">
                {me.data ? me.data.firstName || t.nav.account : t.nav.login}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Outside <header>: its backdrop-filter would make it the containing block of fixed elements. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col gap-6 overflow-y-auto bg-milk p-5 shadow-lift"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              aria-label={t.nav.menu}
            >
              <div className="flex items-center justify-between">
                <Logo href={`/${locale}`} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  aria-label={t.common.close}
                >
                  <CloseIcon />
                </button>
              </div>
              <SearchForm onDone={() => setOpen(false)} />
              <nav className="flex flex-col">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'border-b border-cream-dark/50 py-3 font-serif text-lg',
                      isActive(link.href, link.exact) ? 'text-brand' : 'text-ink'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={me.data ? `/${locale}/account/favorites` : `/${locale}/login`}
                  className="border-b border-cream-dark/50 py-3 font-serif text-lg"
                >
                  {t.nav.favorites}
                </Link>
                <Link
                  href={`/${locale}/faq`}
                  className="border-b border-cream-dark/50 py-3 font-serif text-lg"
                >
                  {t.nav.faq}
                </Link>
                {me.data?.role === 'ADMIN' && (
                  <Link href={`/${locale}/admin`} className="py-3 font-serif text-lg text-olive">
                    {t.nav.admin}
                  </Link>
                )}
              </nav>
              <Suspense>
                <LanguageSwitcher className="self-start" />
              </Suspense>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
