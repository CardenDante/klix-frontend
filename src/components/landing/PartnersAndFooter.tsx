'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Partners section before footer
export default function PartnersSection() {
  const partners = [
    { name: 'Eventbrite', logo: '/partners/eventbrite.png' },
    { name: 'Safaricom', logo: '/partners/safaricom.png' },
    { name: 'Flutterwave', logo: '/partners/flutterwave.png' },
    { name: 'Google', logo: '/partners/google.png' },
  ];

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-10" style={{ fontFamily: 'Comfortaa' }}>
          Our Partners
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 items-center justify-center">
          {partners.map((partner) => (
            <div key={partner.name} className="flex justify-center">
              <Image
                src={partner.logo}
                alt={partner.name}
                width={150}
                height={60}
                className="object-contain grayscale hover:grayscale-0 transition-all duration-300"
              />
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
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12 border-b border-gray-800">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Comfortaa' }}>
                Stay in the Loop
              </h3>
              <p className="text-gray-400">
                Get the latest events and exclusive offers delivered to your inbox
              </p>
            </div>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#EB7D30]"
              />
              <Button className="bg-[#EB7D30] hover:bg-[#d16a1f] text-white px-8">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png"
                  alt="Klix Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Comfortaa' }}>
                Klix
              </span>
            </Link>
            <p className="text-gray-400 mb-6">
              Making event discovery and ticketing simple, fun, and rewarding.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#EB7D30] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#EB7D30] transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#EB7D30] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-[#EB7D30] transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontFamily: 'Comfortaa' }}>
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#EB7D30] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontFamily: 'Comfortaa' }}>
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#EB7D30] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-white font-semibold mb-4" style={{ fontFamily: 'Comfortaa' }}>
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#EB7D30] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Klix. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-[#EB7D30] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-[#EB7D30] transition-colors">
                Terms of Service
              </Link>
              <Link href="/safety" className="text-gray-400 hover:text-[#EB7D30] transition-colors">
                Safety
              </Link>
            </div>
          </div>
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Klix. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/about" className="text-gray-400 hover:text-[#EB7D30] transition-colors">
              About
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-[#EB7D30] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-[#EB7D30] transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-[#EB7D30] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}