import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Facebook } from 'lucide-react';
import { Instagram } from 'lucide-react';
import { Linkedin } from 'lucide-react';
import { Youtube } from 'lucide-react';
import { Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <>
      <footer className='pt-30 pb-10'>
        <div className="container mx-auto px-4">
          <div className="inner flex flex-col items-center gap-10">
            <div className="footer-logo">
              <Image src="/svg/logo.svg" alt="logo" width={165} height={43} />
            </div>
            <div className="footer-links">
              <ul className='flex sm:flex-row flex-col items-center gap-10 text-sm font-normal'>
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li>
                  <Link href="/contact">Contact us</Link>
                </li>
                <li>
                  <Link href="/about">About us</Link>
                </li>
                <li>
                  <Link href="/terms">Terms and Conditions</Link>
                </li>
                <li>
                  <Link href="/privacy-policy">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="#">Become an affiliate</Link>
                </li>
              </ul>
            </div>
            <div className="footer-icons flex items-center sm:gap-6 gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="icon h-[42px] w-[42px] bg-white rounded-full flex items-center justify-center hover:bg-primary transition"
              >
                <Facebook className="fill-black stroke-black" size={20} />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="icon h-[42px] w-[42px] bg-white rounded-full flex items-center justify-center hover:bg-primary transition"
              >
                <Instagram className="fill-white stroke-black" size={20} />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="icon h-[42px] w-[42px] bg-white rounded-full flex items-center justify-center hover:bg-primary transition"
              >
                <Linkedin className="fill-black stroke-black" size={20} />
              </a>

              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="icon h-[42px] w-[42px] bg-white rounded-full flex items-center justify-center hover:bg-primary transition"
              >
                <Youtube className="fill-white stroke-black" size={20} />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="icon h-[42px] w-[42px] bg-white rounded-full flex items-center justify-center hover:bg-primary transition"
              >
                <Twitter className="fill-black stroke-black" size={20} />
              </a>
            </div>
            <hr className="w-full border-t border-white my-4" />
            <p>copyright © 2023 MyVenueBooking</p>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer