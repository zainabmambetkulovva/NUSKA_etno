'use client';

import { Suspense, useEffect, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LanguageMenu } from './language-menu';
import { LanguageSwitcher } from './language-switcher';

import { Logo } from '@/components/brand/logo';
import {
  CartIcon,
  ChevronDownIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from '@/components/ui/icons';
import { useMe } from '@/hooks/use-auth';
import { useCart } from '@/hooks/use-cart';
import { useI18n } from '@/i18n/i18n-provider';
import { cn } from '@/lib/cn';

export interface HeaderCategory {
  slug: string;
  name: string;
}

/** Cart icon with the number of items; it bumps when something is added. */
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
      className={iconButton}
      aria-label={count > 0 ? `${t.nav.cart}: ${count}` : t.nav.cart}
    >
      <CartIcon width={22} height={22} />
      {count > 0 && (
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-nk-forest px-1 text-[10px] font-bold text-white ring-2 ring-nk-cream',
            bump && 'animate-bump'
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

const iconButton =
  'relative flex h-9 w-9 items-center justify-center rounded-full text-nk-ink transition hover:bg-white/80 hover:text-nk-forest sm:h-10 sm:w-10';

/** A menu that opens on click (and on hover with a mouse); closes on Escape and outside click. */
function useDisclosure() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !ref.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return { open, setOpen, ref };
}

function CatalogMenu({ categories }: { categories: HeaderCategory[] }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const { open, setOpen, ref } = useDisclosure();
  const active = pathname.startsWith(`/${locale}/catalog`);
  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(navLink, 'inline-flex items-center gap-1', active && 'text-nk-forest')}
      >
        {t.nav.catalog}
        <ChevronDownIcon
          width={14}
          height={14}
          className={cn('transition', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3"
          >
            <div className="overflow-hidden rounded-2xl border border-nk-beige bg-white p-2 shadow-lift">
              <Link
                href={`/${locale}/catalog`}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-nk-forest transition hover:bg-nk-cream"
              >
                {t.nav.allProducts}
                <span aria-hidden>→</span>
              </Link>
              <div className="my-1 h-px bg-nk-beige/70" />
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/${locale}/catalog/${category.slug}`}
                  className="block rounded-xl px-3 py-2 text-sm text-nk-ink transition hover:bg-nk-cream hover:text-nk-forest"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountMenu() {
  const { t, locale } = useI18n();
  const me = useMe();
  const { open, setOpen, ref } = useDisclosure();
  if (me.data)
    return (
      <Link href={`/${locale}/account`} className={iconButton} aria-label={t.nav.cabinet}>
        <UserIcon width={22} height={22} />
        <span className="absolute bottom-1.5 right-1.5 h-2 w-2 rounded-full bg-nk-forest ring-2 ring-nk-cream" />
      </Link>
    );
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.nav.account}
        className={iconButton}
      >
        <UserIcon width={22} height={22} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-50 flex w-52 flex-col gap-2 rounded-2xl border border-nk-beige bg-white p-3 shadow-lift motion-safe:animate-fade-up"
        >
          <Link
            role="menuitem"
            href={`/${locale}/login`}
            className="btn-forest w-full py-2.5 text-sm"
          >
            {t.nav.login}
          </Link>
          <Link
            role="menuitem"
            href={`/${locale}/register`}
            className="inline-flex w-full items-center justify-center rounded-full border border-nk-forest/30 py-2.5 text-sm font-semibold text-nk-forest transition hover:bg-nk-cream"
          >
            {t.nav.register}
          </Link>
        </div>
      )}
    </div>
  );
}

const navLink =
  'relative whitespace-nowrap px-1 py-2 text-[15px] font-medium text-nk-ink transition hover:text-nk-forest';

/**
 * Header of the NUSKA_etno mockup: logo; Catalog (dropdown with the real
 * categories) · About the brand · Delivery and payment · Recipes · Contacts;
 * KG/RU, search, favorites, cart and account. Transparent over the cream hero
 * of the home page, a light cream bar with a soft shadow once scrolled.
 */
export function Header({ categories }: { categories: HeaderCategory[] }) {
  const { t, locale } = useI18n();
  const pathname = usePathname();
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
  const links = [
    { href: `/${locale}/about`, label: t.nav.brand },
    { href: `/${locale}/delivery`, label: t.nav.delivery },
    { href: `/${locale}/recipes`, label: t.nav.recipes },
    { href: `/${locale}/contacts`, label: t.nav.contacts },
  ];
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500',
          overHero
            ? 'bg-transparent'
            : 'bg-nk-cream/90 shadow-[0_10px_30px_-20px_rgba(43,42,34,0.45)] backdrop-blur-md'
        )}
      >
        <div className="mx-auto flex h-[68px] max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:h-[80px] xl:px-10">
          <Logo href={home} tone="dark" className="shrink-0" />

          <nav
            className="ml-8 hidden items-center gap-6 min-[1180px]:flex xl:ml-14 xl:gap-8"
            aria-label={t.nav.menu}
          >
            <CatalogMenu categories={categories} />
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  navLink,
                  'after:absolute after:inset-x-1 after:bottom-0 after:h-px after:origin-left after:bg-nk-gold after:transition-transform',
                  isActive(link.href)
                    ? 'text-nk-forest after:scale-x-100'
                    : 'after:scale-x-0 hover:after:scale-x-100'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <Suspense>
              <LanguageMenu className="mr-1 hidden sm:block" />
            </Suspense>
            <Link href={`/${locale}/search`} className={iconButton} aria-label={t.nav.search}>
              <SearchIcon width={22} height={22} />
            </Link>
            <Link
              href={`/${locale}/account/favorites`}
              className={cn(iconButton, 'hidden sm:flex')}
              aria-label={t.nav.favorites}
            >
              <HeartIcon width={22} height={22} />
            </Link>
            <CartLink />
            <div className="hidden sm:block">
              <AccountMenu />
            </div>
            <button
              type="button"
              className={cn(iconButton, '-mr-1 min-[1180px]:hidden')}
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
              className="fixed inset-0 z-40 bg-nk-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col gap-5 overflow-y-auto bg-nk-cream p-5 shadow-lift"
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
                  className={iconButton}
                  aria-label={t.common.close}
                >
                  <CloseIcon />
                </button>
              </div>
              <nav className="flex flex-col">
                <Link
                  href={`/${locale}/catalog`}
                  className="border-b border-nk-beige py-3 font-serif text-lg text-nk-ink"
                >
                  {t.nav.catalog}
                </Link>
                <div className="flex flex-wrap gap-2 border-b border-nk-beige py-3">
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/${locale}/catalog/${category.slug}`}
                      className="rounded-full bg-white px-3 py-1.5 text-sm text-nk-ink shadow-sm"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'border-b border-nk-beige py-3 font-serif text-lg',
                      isActive(link.href) ? 'text-nk-forest' : 'text-nk-ink'
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href={`/${locale}/account/favorites`}
                  className="border-b border-nk-beige py-3 font-serif text-lg text-nk-ink"
                >
                  {t.nav.favorites}
                </Link>
                {me.data?.role === 'ADMIN' && (
                  <Link href={`/${locale}/admin`} className="py-3 font-serif text-lg text-nk-brown">
                    {t.nav.admin}
                  </Link>
                )}
              </nav>
              <Suspense>
                <LanguageSwitcher className="self-start" />
              </Suspense>
              <div className="flex flex-col gap-3">
                {me.data ? (
                  <Link href={`/${locale}/account`} className="btn-forest w-full">
                    <UserIcon width={18} height={18} />
                    {t.nav.cabinet}
                  </Link>
                ) : (
                  <>
                    <Link href={`/${locale}/login`} className="btn-forest w-full">
                      {t.nav.login}
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      className="inline-flex w-full items-center justify-center rounded-full border border-nk-forest/30 py-3 text-sm font-semibold text-nk-forest"
                    >
                      {t.nav.register}
                    </Link>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
