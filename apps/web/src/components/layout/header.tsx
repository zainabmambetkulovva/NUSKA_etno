'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    { href: `/${locale}/pickup`, label: t.nav.pickup },
    { href: `/${locale}#reviews`, label: t.nav.reviews },
    { href: `/${locale}/contacts`, label: t.nav.contacts },
  ];
}

function CountBadge({ count, bump }: { count: number; bump?: boolean }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-honey px-1 text-[11px] font-bold text-forest-dark ring-2 ring-forest',
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
        'relative h-10 w-10 items-center justify-center rounded-full text-cream-light transition hover:text-honey-light',
        className
      )}
      aria-label={`${t.nav.favorites}: ${count}`}
    >
      <HeartIcon width={24} height={24} />
      <CountBadge count={count} />
    </Link>
  );
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
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-cream-light transition hover:text-honey-light"
      aria-label={`${t.nav.cart}: ${count}`}
    >
      <CartIcon width={24} height={24} />
      <CountBadge count={count} bump={bump} />
    </Link>
  );
}

/**
 * Header of the design: deep green bar with the gold NUSKA medallion,
 * Home · Catalog ▾ · About · Pickup · Reviews · Contacts, then search,
 * favourites, cart and "Sign in / Register". On the home page it lies
 * transparent over the hero picture until the page is scrolled.
 */
export function Header() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const links = useNavLinks();
  const me = useMe();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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

  const home = `/${locale}`;
  const overHero = pathname === home && !scrolled;
  const isActive = (href: string, exact?: boolean) =>
    !href.includes('#') && (exact ? pathname === href : pathname.startsWith(href));
  const accountHref = me.data ? `/${locale}/account` : `/${locale}/login`;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 transition-[background-color,box-shadow] duration-500',
          overHero
            ? 'bg-gradient-to-b from-forest-dark/70 to-transparent'
            : 'bg-forest/95 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.6)] backdrop-blur-md'
        )}
      >
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:h-[76px] xl:px-10">
          <button
            type="button"
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full text-cream-light xl:hidden"
            onClick={() => setOpen(true)}
            aria-label={t.nav.menu}
            aria-expanded={open}
          >
            <MenuIcon />
          </button>
          <Logo href={home} className="shrink-0" />

          <nav className="mx-auto hidden items-center gap-1 xl:flex" aria-label={t.nav.menu}>
            {links.map((link) =>
              link.mega ? (
                <CatalogMegaMenu key={link.href} active={isActive(link.href)} />
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
                  className={cn(
                    'group relative whitespace-nowrap px-3 py-2 text-sm font-medium transition 2xl:text-[15px]',
                    isActive(link.href, link.exact)
                      ? 'text-honey-light'
                      : 'text-cream-light/90 hover:text-honey-light'
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      'absolute inset-x-3 bottom-0.5 h-px origin-left bg-honey transition-transform',
                      isActive(link.href, link.exact)
                        ? 'scale-x-100'
                        : 'scale-x-0 group-hover:scale-x-100'
                    )}
                    aria-hidden
                  />
                </Link>
              )
            )}
          </nav>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5 xl:ml-0">
            <Suspense>
              <LanguageSwitcher variant="dark" className="mr-1 hidden md:inline-flex" />
            </Suspense>
            <Link
              href={`/${locale}/search`}
              className="hidden h-10 w-10 items-center justify-center rounded-full text-cream-light transition hover:text-honey-light sm:flex"
              aria-label={t.nav.search}
            >
              <SearchIcon width={22} height={22} />
            </Link>
            <FavoritesLink className="hidden sm:flex" />
            <CartLink />
            <Link
              href={accountHref}
              className="ml-2 hidden items-center gap-2.5 whitespace-nowrap rounded-full border border-cream-light/50 bg-forest-dark/40 py-1.5 pl-2 pr-4 text-cream-light transition hover:border-honey hover:text-honey-light md:inline-flex"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-light/10">
                <UserIcon width={18} height={18} />
              </span>
              {me.data ? (
                <span className="max-w-[9rem] truncate text-sm font-medium">{t.nav.cabinet}</span>
              ) : (
                <span className="text-left text-xs font-medium leading-tight">
                  {t.nav.login} /<br />
                  {t.nav.register}
                </span>
              )}
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
              className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col gap-6 overflow-y-auto bg-cream-light p-5 shadow-lift"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              aria-label={t.nav.menu}
            >
              <div className="flex items-center justify-between">
                <Logo href={`/${locale}`} tone="dark" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  aria-label={t.common.close}
                >
                  <CloseIcon />
                </button>
              </div>
              <nav className="flex flex-col">
                {[...links, { href: `/${locale}/gift-builder`, label: t.nav.giftSets }].map(
                  (link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'border-b border-cream-dark/50 py-3 font-serif text-lg',
                        isActive(link.href) ? 'text-brand' : 'text-ink'
                      )}
                    >
                      {link.label}
                    </Link>
                  )
                )}
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
              <Link
                href={accountHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-medium text-cream-light"
              >
                <UserIcon width={18} height={18} />{' '}
                {me.data ? t.nav.cabinet : `${t.nav.login} / ${t.nav.register}`}
              </Link>
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
