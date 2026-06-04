
'use client';

import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { HeaderAuthActions, HeaderAuthMobileLinks } from '@/components/common/HeaderAuthActions';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/events", label: "Events" },
    { href: "/shows", label: "Venue Booking" },
    { href: "/affiliate", label: "List Your Venue" },
    { href: "/blog", label: "Blog" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!mobileMenuOpen) {
        setScrolled(window.scrollY > 20);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // call once to set initial state
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);

  return (
    <>
      {/* Header*/}
      <header
        className={`fixed top-0 left-0 w-full z-50 h-[75px] transition-all duration-300 ${scrolled
          ? 'bg-background/80 backdrop-blur-md shadow-sm border-b border-border/50'
          : 'bg-transparent'
          }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-[75px]">

            {/* Logo */}
            <div className="flex items-center">
              <Link href="/">
                <Image
                  src="/svg/logo.svg"
                  alt="Logo"
                  width={165}
                  height={43}
                  className="h-10 w-auto lg:h-11 transition-all"
                  priority
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
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

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-4">
              <Select defaultValue="Eng">
                <SelectTrigger className="w-[110px] text-sm border-muted">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eng">
                    <div className="flex items-center gap-2">
                      <Image src="/svg/usa.svg" alt="USA" width={20} height={14} />
                      <span>Eng</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Rus">
                    <div className="flex items-center gap-2">
                      <Image src="/svg/usa.svg" alt="Russia" width={20} height={14} />
                      <span>Rus</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <HeaderAuthActions />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden z-50 p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay and Panel moved OUTSIDE the header so the header background doesn't interfere */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b">
            <Image
              src="/svg/logo.svg"
              alt="Logo"
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
            <Select defaultValue="Eng">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Eng">
                  <div className="flex items-center gap-2">
                    <Image src="/svg/usa.svg" alt="USA" width={24} height={16} />
                    <span>English</span>
                  </div>
                </SelectItem>
                <SelectItem value="Rus">
                  <div className="flex items-center gap-2">
                    <Image src="/svg/rus.svg" alt="Russia" width={24} height={16} />
                    <span>Русский</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <HeaderAuthMobileLinks onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
