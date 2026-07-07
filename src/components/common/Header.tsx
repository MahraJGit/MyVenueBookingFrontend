'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { HeaderAuthActions, HeaderAuthMobileLinks } from '@/components/common/HeaderAuthActions';
import { CurrencySelect } from '@/components/currency/CurrencySelect';
import { LanguageSelect } from '@/components/i18n/LanguageSelect';
import { useLocaleContext } from '@/features/i18n/locale-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  mobileNavLinkClass,
  navDropdownItemClass,
  navLinkClass,
} from '@/components/common/nav-link-styles';

type NavItem = { href: string; label: string };

/** Primary links stay in the bar; longer secondary links go under More. */
const PRIMARY_NAV_COUNT = 5;

function DrawerSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('px-5 py-4', className)}>
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
        {title}
      </h2>
      {children}
    </section>
  );
}

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const { isRtl } = useLocaleContext();

  const navItems = useMemo<NavItem[]>(
    () => [
      { href: '/', label: tNav('home') },
      { href: '/events', label: tNav('events') },
      { href: '/attractions', label: tNav('attractions') },
      { href: '/corporate', label: tNav('corporate') },
      { href: '/venues', label: tNav('venueBooking') },
      { href: '/affiliate', label: tNav('listYourVenue') },
      { href: '/blog', label: tNav('blog') },
    ],
    [tNav],
  );

  const primaryNavItems = navItems.slice(0, PRIMARY_NAV_COUNT);
  const moreNavItems = navItems.slice(PRIMARY_NAV_COUNT);
  const moreIsActive = moreNavItems.some((item) => pathname === item.href);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const isNavFlat = scrolled || mobileMenuOpen;

  const mobileLayerTop = isNavFlat
    ? 'top-14 sm:top-[3.75rem]'
    : 'top-[4.25rem] sm:top-[4.75rem]';

  useEffect(() => {
    const handleScroll = () => {
      if (mobileMenuOpen) return;

      const y = window.scrollY;
      setScrolled((prev) => {
        if (y > 28) return true;
        if (y < 10) return false;
        return prev;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    closeMobileMenu();
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobileMenu();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          'site-header fixed left-0 right-0 z-[70] w-full transition-[top] duration-300 ease-out',
          isNavFlat ? 'top-0' : 'top-3 sm:top-4',
        )}
      >
        <div
          className={cn(
            'site-nav-bar flex h-14 w-full items-center sm:h-[3.75rem]',
            isNavFlat ? 'site-nav-bar--scrolled' : 'site-nav-bar--floating',
          )}
        >
          <div className="mx-auto grid h-full w-full max-w-screen-2xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-3 sm:px-4 2xl:px-6">
            <Link href="/" className="relative z-20 flex shrink-0 items-center">
              <Image
                src="/svg/logo.svg"
                alt="Evenjo"
                width={165}
                height={43}
                className="h-7 w-auto sm:h-8 2xl:h-9"
                priority
              />
            </Link>

            <nav
              className="hidden min-w-0 items-center justify-center overflow-hidden 2xl:flex"
              aria-label={tNav('mainNav')}
            >
              <ul className="flex max-w-full items-center justify-center gap-0.5">
                {primaryNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href} className="min-w-0 shrink">
                      <Link
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={navLinkClass(isActive)}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
                {moreNavItems.length > 0 ? (
                  <li className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          navLinkClass(moreIsActive),
                          'inline-flex items-center gap-0.5 outline-none',
                        )}
                      >
                        {tNav('more')}
                        <ChevronDown className="size-3.5 opacity-70" aria-hidden />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="min-w-[12rem]">
                        {moreNavItems.map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <DropdownMenuItem
                              key={item.href}
                              asChild
                              className={navDropdownItemClass(isActive)}
                            >
                              <Link href={item.href} onClick={closeMobileMenu}>
                                {item.label}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ) : null}
              </ul>
            </nav>

            <div className="relative z-20 flex shrink-0 items-center justify-self-end gap-1.5">
              <div
                className={cn(
                  'hidden items-center gap-1.5 2xl:flex 2xl:gap-2',
                  isRtl && 'flex-row-reverse',
                )}
              >
                <LanguageSelect
                  triggerClassName="h-9 w-9 border-[#303030]/80 bg-black/30 backdrop-blur-sm"
                />
                <CurrencySelect
                  triggerClassName="h-9 gap-1 rounded-full border-[#303030]/80 bg-black/30 px-2 backdrop-blur-sm"
                />
                <HeaderAuthActions />
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="site-nav-menu-btn flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition-colors hover:bg-white/10 2xl:hidden"
                aria-label={mobileMenuOpen ? tCommon('closeMenu') : tCommon('toggleMenu')}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'fixed right-0 bottom-0 left-0 z-[60] bg-black/75 backdrop-blur-md transition-opacity duration-300 2xl:hidden',
          mobileLayerTop,
          mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={closeMobileMenu}
        aria-hidden={!mobileMenuOpen}
      />

      <aside
        role="dialog"
        aria-modal={mobileMenuOpen}
        aria-label={tCommon('menu')}
        className={cn(
          'site-mobile-drawer fixed bottom-0 z-[65] flex w-[min(100vw,20rem)] flex-col shadow-2xl transition-transform duration-300 ease-out sm:w-80 2xl:hidden',
          mobileLayerTop,
          isRtl ? 'left-0 border-e' : 'right-0 border-s',
          mobileMenuOpen
            ? 'translate-x-0'
            : isRtl
              ? '-translate-x-full'
              : 'translate-x-full',
        )}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pt-4">
          <DrawerSection title={tCommon('menu')}>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        mobileNavLinkClass(isActive),
                        'justify-start gap-3',
                      )}
                    >
                      <span
                        className={cn(
                          'size-1.5 shrink-0 rounded-full transition-colors',
                          isActive ? 'bg-primary' : 'bg-transparent',
                        )}
                        aria-hidden
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </DrawerSection>

          <DrawerSection title={tCommon('preferences')} className="border-t border-white/10">
            <div className="flex items-center gap-2">
              <LanguageSelect
                triggerClassName="h-11 w-11 border-[#303030]/80 bg-black/30 backdrop-blur-sm"
              />
              <CurrencySelect
                fullWidth
                triggerClassName="h-11 flex-1 justify-start gap-2 rounded-xl border-[#303030]/80 bg-black/30 px-3 backdrop-blur-sm"
              />
            </div>
          </DrawerSection>
        </div>

        <div className="mt-auto border-t border-white/10 bg-black/20 px-5 py-4 backdrop-blur-sm">
          <DrawerSection title={tCommon('account')} className="p-0">
            <HeaderAuthMobileLinks onNavigate={closeMobileMenu} />
          </DrawerSection>
        </div>
      </aside>
    </>
  );
};

export default Header;
