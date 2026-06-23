
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { HeaderAuthActions, HeaderAuthMobileLinks } from '@/components/common/HeaderAuthActions';
import { CurrencySelect } from '@/components/currency/CurrencySelect';
import { LanguageSelect } from '@/components/i18n/LanguageSelect';
import { useLocaleContext } from '@/features/i18n/locale-context';
import { cn } from '@/lib/utils';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const { isRtl } = useLocaleContext();

  const navItems = useMemo(
    () => [
      { href: '/', label: tNav('home') },
      { href: '/events', label: tNav('events') },
      { href: '/venues', label: tNav('venueBooking') },
      { href: '/affiliate', label: tNav('listYourVenue') },
      { href: '/blog', label: tNav('blog') },
    ],
    [tNav],
  );

  useEffect(() => {
    const handleScroll = () => {
      if (!mobileMenuOpen) {
        setScrolled(window.scrollY > 20);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full rounded-lg z-50 h-[75px] transition-all duration-300 ${scrolled
          ? 'bg-background/80 backdrop-blur-md shadow-sm border-b border-border/50'
          : 'bg-transparent'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[75px]">

            <div className="flex items-center">
              <Link href="/">
                <Image
                  src="/svg/logo.svg"
                  alt={tCommon('logoAlt')}
                  width={165}
                  height={43}
                  className="h-10 w-auto lg:h-11 transition-all"
                  priority
                />
              </Link>
            </div>

            <nav className="hidden lg:flex items-center">
              <ul className="flex items-center gap-6 lg:gap-8 xl:gap-10">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-md font-normal transition-colors whitespace-nowrap
                           ${pathname === item.href
                          ? 'text-primary'
                          : 'hover:text-primary'
                        }`}
                    >
                      {item.label}
                    </Link>

                  </li>
                ))}
              </ul>
            </nav>

            <div className={cn('hidden lg:flex items-center gap-4', isRtl && 'flex-row-reverse')}>
              <LanguageSelect />
              <CurrencySelect />

              <HeaderAuthActions />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden z-50 p-2"
              aria-label={tCommon('toggleMenu')}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={cn(
          'fixed top-0 h-full w-80 max-w-full bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden',
          isRtl ? 'left-0' : 'right-0',
          mobileMenuOpen
            ? 'translate-x-0'
            : isRtl
              ? '-translate-x-full'
              : 'translate-x-full',
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <Image
              src="/svg/logo.svg"
              alt={tCommon('logoAlt')}
              width={140}
              height={36}
              className="h-9 w-auto"
            />
            <button onClick={() => setMobileMenuOpen(false)} className="p-2">
              <X size={28} />
            </button>
          </div>

          <nav className="flex-1 px-6 py-8 overflow-y-auto">
            <ul className="space-y-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-lg font-medium hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-6 border-t space-y-4">
            <LanguageSelect fullWidth />
            <CurrencySelect fullWidth />

            <HeaderAuthMobileLinks onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
