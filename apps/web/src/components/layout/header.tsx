'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LanguageSwitcher } from './language-switcher';

import { Logo } from '@/components/brand/logo';
import { CartIcon, CloseIcon, MenuIcon, UserIcon } from '@/components/ui/icons';
import { useMe } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

function useNavLinks() {
  const { t, locale } = useI18n();
  return [
    { href: `/${locale}`, label: t.nav.home, exact: true },
    { href: `/${locale}/about`, label: t.nav.about },
    { href: `/${locale}#prices`, label: t.nav.prices },
    { href: `/${locale}/contacts`, label: t.nav.contacts },
  ];
}

/**
 * The cart is not part of the header design; it appears only once something
 * is in it, so a customer can always reach the order.
 */
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
  if (count <= 0) return null;

  return (
    <Link
      href={`/${locale}/cart`}
      data-cart-target
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-cream-light transition hover:text-honey-light"
      aria-label={`${t.nav.cart}: ${count}`}
    >
      <CartIcon width={24} height={24} />
      <span
        className={cn(
          'absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-honey px-1 text-[11px] font-bold text-forest-dark ring-2 ring-forest',
          bump && 'animate-bump'
        )}
      >
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  );
}

/**
 * Header of the brand brief: logo on the left, then the menu (Home · About ·
 * Our prices · Contacts), the language switch and two separate buttons
 * "Sign in" and "Register" (the personal account once signed in).
 * On the home page it lies transparent over the hero until the page is scrolled.
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
  const signedIn = Boolean(me.data);

  const authButtons = (mobile = false) =>
    signedIn ? (
      <Link
        href={`/${locale}/account`}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-b from-honey-light to-honey px-5 py-2.5 text-sm font-semibold text-forest-dark transition hover:brightness-105',
          mobile && 'w-full py-3'
        )}
      >
        <UserIcon width={18} height={18} />
        {t.nav.cabinet}
      </Link>
    ) : (
      <>
        <Link
          href={`/${locale}/login`}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-full border px-5 py-2.5 text-sm font-semibold transition',
            mobile
              ? 'w-full border-forest/40 py-3 text-forest hover:bg-forest hover:text-cream-light'
              : 'border-cream-light/60 text-cream-light hover:border-honey hover:text-honey-light'
          )}
        >
          {t.nav.login}
        </Link>
        <Link
          href={`/${locale}/register`}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-full bg-gradient-to-b from-honey-light to-honey px-5 py-2.5 text-sm font-semibold text-forest-dark shadow-[0_8px_20px_-10px_rgba(176,122,53,0.9)] transition hover:brightness-105',
            mobile && 'w-full py-3'
          )}
        >
          {t.nav.register}
        </Link>
      </>
    );

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
          <Logo href={home} className="shrink-0" />

          <nav className="ml-10 hidden items-center gap-1 xl:flex" aria-label={t.nav.menu}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
                className={cn(
                  'group relative whitespace-nowrap px-3 py-2 text-[15px] font-medium transition',
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
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Suspense>
              <LanguageSwitcher variant="dark" className="hidden sm:inline-flex" />
            </Suspense>
            <CartLink />
            <div className="hidden items-center gap-2 md:flex">{authButtons()}</div>
            <button
              type="button"
              className="-mr-1 flex h-10 w-10 items-center justify-center rounded-full text-cream-light xl:hidden"
              onClick={() => setOpen(true)}
              aria-label={t.nav.menu}
              aria-expanded={open}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Outside <header>: its backdrop-filter would make it the containing block of fixed elements. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col gap-6 overflow-y-auto bg-cream-light p-5 shadow-lift"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              aria-label={t.nav.menu}
            >
              <div className="flex items-center justify-between">
                <Logo href={home} tone="dark" />
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
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'border-b border-cream-dark/50 py-3 font-serif text-lg',
                      isActive(link.href, link.exact) ? 'text-brand' : 'text-ink'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                {me.data?.role === 'ADMIN' && (
                  <Link href={`/${locale}/admin`} className="py-3 font-serif text-lg text-olive">
                    {t.nav.admin}
                  </Link>
                )}
              </nav>
              <Suspense>
                <LanguageSwitcher className="self-start" />
              </Suspense>
              <div className="flex flex-col gap-3">{authButtons(true)}</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
