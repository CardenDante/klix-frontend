'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Mail, Facebook, Twitter, Instagram, Linkedin, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PartnersSection() {
  const partners = [
    { name: 'Partner 1', logo: '/partners/partner1.png' },
    { name: 'Partner 2', logo: '/partners/partner2.png' },
    { name: 'Partner 3', logo: '/partners/partner3.png' },
    { name: 'Partner 4', logo: '/partners/partner4.png' },
    { name: 'Partner 5', logo: '/partners/partner5.png' },
    { name: 'Partner 6', logo: '/partners/partner6.png' },
  ];

  return (
    <section className="py-20 bg-white border-t border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-heading">
            Trusted by Leading Brands
          </h2>
          <p className="text-gray-600 font-body">
            Partnering with the best to bring you amazing events
          </p>
        </div>

        {/* Partners Carousel */}
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll gap-12">
            {[...partners, ...partners].map((partner, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-40 h-20 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 flex items-center justify-center"
              >
                <div className="text-4xl">{partner.name}</div>
                {/* Replace with actual logo: <Image src={partner.logo} alt={partner.name} width={160} height={80} className="object-contain" /> */}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center">
          <div>
            <div className="text-3xl font-bold text-[#EB7D30] mb-2 font-heading">50+</div>
            <div className="text-gray-600 font-body">Partner Brands</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EB7D30] mb-2 font-heading">10K+</div>
            <div className="text-gray-600 font-body">Events Hosted</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EB7D30] mb-2 font-heading">500K+</div>
            <div className="text-gray-600 font-body">Tickets Sold</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EB7D30] mb-2 font-heading">98%</div>
            <div className="text-gray-600 font-body">Satisfaction Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const footerLinks = {
    product: [
      { label: 'Find Events', href: '/events' },
      { label: 'Create Event', href: '/organizers' },
      { label: 'Become Promoter', href: '/promoters' },
      { label: 'Rewards Program', href: '/loyalty' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
      { label: 'Blog', href: '/blog' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Contact Us', href: '/contact' },
      { label: 'Safety', href: '/safety' },
      { label: 'Terms of Service', href: '/terms' },
    ],
    organizers: [
      { label: 'Organizer Portal', href: '/dashboard/organizer' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Resources', href: '/resources' },
      { label: 'API Docs', href: '/docs' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="py-12 border-b border-gray-800">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2 font-heading">
                Stay in the Loop
              </h3>
              <p className="text-gray-400 font-body">
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
        <div className="py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
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
              <span className="text-2xl font-bold text-white font-heading">Klix</span>
            </Link>
            <p className="text-gray-400 mb-6 font-body">
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

          {/* Links Columns */}
          <div>
            <h4 className="text-white font-semibold mb-4 font-heading">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#EB7D30] transition-colors font-body">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 font-heading">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#EB7D30] transition-colors font-body">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 font-heading">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#EB7D30] transition-colors font-body">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 font-heading">For Organizers</h4>
            <ul className="space-y-3">
              {footerLinks.organizers.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-gray-400 hover:text-[#EB7D30] transition-colors font-body">
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
            <div className="text-gray-400 text-sm font-body">
              © {new Date().getFullYear()} Klix. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-[#EB7D30] transition-colors font-body">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-[#EB7D30] transition-colors font-body">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-[#EB7D30] transition-colors font-body">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats Ticker */}
      <div className="bg-[#EB7D30] py-2 overflow-hidden">
        <div className="flex animate-scroll-slow gap-12 text-white font-semibold text-sm">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex gap-12 whitespace-nowrap">
              <span>✓ John just bought 2 tickets to Summer Fest</span>
              <span>✓ Sarah joined the Music Lovers event</span>
              <span>✓ Mike secured VIP tickets to Sports Arena</span>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}

<style jsx>{`
  @keyframes scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  @keyframes scroll-slow {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  .animate-scroll {
    animation: scroll 30s linear infinite;
  }

  .animate-scroll-slow {
    animation: scroll-slow 40s linear infinite;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>