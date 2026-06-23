'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HeaderAuthActions, HeaderAuthMobileLinks } from '@/components/common/HeaderAuthActions';
import { CurrencySelect } from '@/components/currency/CurrencySelect';
import { cn } from '@/lib/utils';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/attractions", label: "Attractions" },
    { href: "/corporate", label: "Corporate" },
    { href: "/venues", label: "Venues" },
    { href: "/affiliate", label: "List Venue" },
    { href: "/blog", label: "Blog" },
  ];

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

  return (
    <>
      <header
        className={cn(
          'site-header fixed left-0 right-0 z-50 w-full transition-[top] duration-300 ease-out',
          scrolled ? 'top-0' : 'top-3 sm:top-4',
        )}
      >
        <div
          className={cn(
            'site-nav-bar flex h-14 w-full items-center sm:h-[3.75rem]',
            scrolled ? 'site-nav-bar--scrolled' : 'site-nav-bar--floating',
          )}
        >
          <div className="container mx-auto flex h-full w-full items-center justify-between gap-3 px-4 xl:px-6">
            <Link href="/" className="relative z-10 flex shrink-0 items-center">
              <Image
                src="/svg/logo.svg"
                alt="Evenjo"
                width={165}
                height={43}
                className="h-8 w-auto sm:h-9 xl:h-10"
                priority
              />
            </Link>

            <nav className="hidden flex-1 items-center justify-center xl:flex" aria-label="Main">
              <ul className="flex items-center gap-0.5 xl:gap-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors xl:px-3.5',
                          isActive
                            ? 'bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(215,73,142,0.25)]'
                            : 'text-foreground/75 hover:bg-white/5 hover:text-primary',
                        )}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="hidden shrink-0 items-center gap-2 xl:flex xl:gap-3">
              <CurrencySelect
                triggerClassName="h-9 rounded-full border-[#303030]/80 bg-black/30 text-sm backdrop-blur-sm"
              />
              <HeaderAuthActions />
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="site-nav-menu-btn relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground transition-colors hover:bg-white/10 xl:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 xl:hidden',
          mobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden={!mobileMenuOpen}
      />

      <div
        className={cn(
          'site-mobile-drawer fixed right-0 left-0 z-50 mx-auto max-w-md overflow-hidden border border-[#303030]/80 xl:hidden sm:right-4 sm:left-auto sm:w-80 sm:max-w-[calc(100vw-2rem)]',
          'transition-all duration-300 ease-out',
          scrolled ? 'top-14 sm:top-[3.75rem]' : 'top-[4.25rem] sm:top-[4.75rem]',
          mobileMenuOpen
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0',
        )}
      >
        <div className="flex max-h-[calc(100vh-6rem)] flex-col">
          <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Mobile">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block rounded-2xl px-4 py-3 text-base font-medium transition-colors',
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-foreground/90 hover:bg-white/5 hover:text-primary',
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="space-y-3 border-t border-[#303030]/60 px-4 py-4">
            <CurrencySelect
              fullWidth
              triggerClassName="h-10 rounded-2xl border-[#303030]/80 bg-black/30 backdrop-blur-sm"
            />
            <HeaderAuthMobileLinks onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
