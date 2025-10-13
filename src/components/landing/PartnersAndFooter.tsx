'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Partners section before footer
export default function PartnersSection() {
  const partners = [
    { name: 'Chacha', logo: '/cc.svg' },
    { name: 'Safaricom', logo: '/M-PESA.png' },
    { name: 'Google', logo: '/Google_2015_logo.svg.webp' },
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6 text-center">
        {/* --- MODIFIED: Title Style --- */}
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 font-heading tracking-tight">
          Our <span className="gradient-text font-playful pr-2">Partners</span>
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-3 gap-10 items-center justify-center max-w-4xl mx-auto">
          {partners.map((partner) => (
            <div key={partner.name} className="flex justify-center">
              <div className="relative h-12 w-32 grayscale hover:grayscale-0 transition-all duration-300">
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


export function Footer() {
  const footerLinks = {
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact Us', href: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Safety', href: '/safety' },
    ],
    product: [
      { label: 'Find Events', href: '/events' },
      { label: 'Pricing', href: '/pricing' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300 relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 bg-no-repeat bg-cover bg-center opacity-15"
        style={{ backgroundImage: "url('/bckpattern1.png')", backgroundSize: '100%' }}
      />
      <div className="absolute inset-0 bg-gray-900/80" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 font-comfortaa">
                Stay in the Loop
              </h3>
              <p className="text-gray-400">
                Get the latest events and exclusive offers delivered to your inbox
              </p>
            </div>
            <form className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-primary"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8">
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* --- MODIFIED: Gradient Divider --- */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <div className="relative w-28 h-14 transition-transform group-hover:scale-105">
                <Image
                  src="/logo-white.png"
                  alt="Klix Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="text-gray-400 mb-6 font-body">
              Making event discovery and ticketing simple, fun, and rewarding.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-comfortaa">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary transition-colors font-body">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 font-comfortaa">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary transition-colors font-body">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 font-comfortaa">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-primary transition-colors font-body">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* --- MODIFIED: Gradient Divider --- */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {/* Bottom Bar */}
        <div className="py-6 text-center text-gray-500 text-sm font-body">
          © {new Date().getFullYear()} Klix. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// Simple Footer for non-landing pages
export function SimpleFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-400 text-sm font-body">
          © {new Date().getFullYear()} Klix. All rights reserved.
        </div>
      </div>
    </footer>
  );
}