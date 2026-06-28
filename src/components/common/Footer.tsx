'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react';
import { useTranslations } from 'next-intl';

const Footer = () => {
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const tCommon = useTranslations('common');
  const year = new Date().getFullYear();

  const footerLinks = [
    { href: '/', label: tNav('home') },
    { href: '/about#contact-us', label: tNav('contact') },
    { href: '/about', label: tNav('about') },
    { href: '/terms', label: tNav('terms') },
    { href: '/privacy-policy', label: tNav('privacy') },
    { href: '/affiliate', label: tNav('affiliate') },
  ] as const;

  const socialLinks = [
    { href: 'https://facebook.com', label: 'Facebook', Icon: Facebook, iconClass: 'fill-black stroke-black' },
    { href: 'https://instagram.com', label: 'Instagram', Icon: Instagram, iconClass: 'fill-white stroke-black' },
    { href: 'https://linkedin.com', label: 'LinkedIn', Icon: Linkedin, iconClass: 'fill-black stroke-black' },
    { href: 'https://youtube.com', label: 'YouTube', Icon: Youtube, iconClass: 'fill-white stroke-black' },
    { href: 'https://twitter.com', label: 'Twitter', Icon: Twitter, iconClass: 'fill-black stroke-black' },
  ] as const;

  return (
    <footer className="pt-16 pb-10 sm:pt-24 md:pt-28">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="inner flex flex-col items-center gap-8 sm:gap-10">
          <div className="footer-logo">
            <Image src="/svg/logo.svg" alt={tCommon('logoAlt')} width={165} height={43} className="h-auto w-[140px] sm:w-[165px]" />
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-col items-center gap-4 text-sm font-normal sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-3">
              {footerLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-foreground/80 transition-colors hover:text-primary"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="footer-icons flex items-center gap-3 sm:gap-6">
            {socialLinks.map(({ href, label, Icon, iconClass }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="icon flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white transition hover:bg-primary"
              >
                <Icon className={iconClass} size={20} aria-hidden />
              </a>
            ))}
          </div>
          <hr className="my-2 w-full border-t border-white/10" />
          <p className="text-center text-sm text-muted-foreground">{tFooter('copyright', { year })}</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
