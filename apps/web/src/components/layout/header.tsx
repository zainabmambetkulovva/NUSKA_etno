'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { HeaderMedallion } from './header-ornament';
import { LanguageSwitcher } from './language-switcher';
import { CatalogMegaMenu } from './mega-menu';

import { Logo } from '@/components/brand/logo';
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, UserIcon } from '@/components/ui/icons';
import { useMe } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useFavoriteIds } from '@/hooks/use-favorites';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

function useNavLinks() {
  const { t, locale } = useI18n();
  return [
    { href: `/${locale}/catalog`, label: t.nav.catalog, mega: true },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}/traditions`, label: t.nav.traditions },
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
        'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-cream-light ring-2 ring-cream-light',
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
        'relative h-10 w-10 items-center justify-center rounded-full text-ink transition hover:text-brand',
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
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:text-brand"
      aria-label={`${t.nav.cart}: ${count}`}
    >
      <CartIcon width={24} height={24} />
      <CountBadge count={count} bump={bump} />
    </Link>
  );
}

/**
 * Header after the design reference: a floating cream plate with an ornament
 * medallion on top. Logo · Catalog ▾ · About · Traditions · Pickup · Reviews ·
 * Contacts · KG RU · ♡ · cart · "Personal account". Burger menu below 1280 px.
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

  const isActive = (href: string) => !href.includes('#') && pathname.startsWith(href);
  const accountHref = me.data ? `/${locale}/account` : `/${locale}/login`;

  return (
    <>
      <header className="sticky top-0 z-40 px-2 pt-2 sm:px-3 sm:pt-3 xl:pt-5">
        <div
          className={cn(
            'relative mx-auto flex h-16 max-w-[1440px] items-center gap-3 rounded-[2rem] border border-gold/30 bg-cream-light/95 px-4 backdrop-blur-md transition-shadow duration-300 sm:px-6 xl:h-[84px] xl:rounded-[2.75rem] xl:px-7 2xl:px-10',
            scrolled ? 'shadow-lift' : 'shadow-card'
          )}
        >
          <HeaderMedallion className="pointer-events-none absolute -top-[19px] left-1/2 hidden h-10 w-32 -translate-x-1/2 xl:block" />
          <button
            type="button"
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full xl:hidden"
            onClick={() => setOpen(true)}
            aria-label={t.nav.menu}
            aria-expanded={open}
          >
            <MenuIcon />
          </button>
          <Logo
            href={`/${locale}`}
            animate
            className="shrink-0 2xl:[&_span]:text-[28px] 2xl:[&_svg]:h-9 2xl:[&_svg]:w-[72px]"
          />

          <nav
            className="ml-2 hidden items-center xl:flex 2xl:ml-6 2xl:gap-1"
            aria-label={t.nav.menu}
          >
            {links.map((link) =>
              link.mega ? (
                <CatalogMegaMenu key={link.href} active={isActive(link.href)} />
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'group relative whitespace-nowrap px-2 py-2 text-sm transition min-[1360px]:px-3 2xl:text-[15px]',
                    isActive(link.href) ? 'text-brand' : 'text-ink hover:text-brand'
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      'absolute inset-x-2 bottom-0.5 h-px origin-left bg-brand transition-transform min-[1360px]:inset-x-3',
                      isActive(link.href) ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                    )}
                    aria-hidden
                  />
                </Link>
              )
            )}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Suspense>
              <LanguageSwitcher variant="plain" className="mr-1 hidden sm:inline-flex" />
            </Suspense>
            <span className="mx-1 hidden h-8 w-px bg-gold/40 sm:block" aria-hidden />
            <FavoritesLink className="hidden sm:flex" />
            <CartLink />
            <Link
              href={accountHref}
              className="ml-2 hidden items-center gap-2 whitespace-nowrap rounded-full bg-brand px-4 py-3 text-sm font-medium 2xl:px-5 text-cream-light shadow-card transition hover:bg-brand-dark md:inline-flex"
            >
              <UserIcon width={18} height={18} />
              {t.nav.cabinet}
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
                className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-medium text-cream-light"
              >
                <UserIcon width={18} height={18} /> {t.nav.cabinet}
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
