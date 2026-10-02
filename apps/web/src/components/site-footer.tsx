'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SocialIcons } from '@/components/social-icons';

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Company',
    links: [
      ['/about', 'About Us'],
      ['/careers', 'Careers'],
      ['/contact', 'Contact Us'],
    ],
  },
  {
    title: 'Legal',
    links: [
      ['/privacy', 'Privacy Policy'],
      ['/terms', 'Terms of Service'],
      ['/safety', 'Safety'],
    ],
  },
  {
    title: 'Product',
    links: [
      ['/events', 'Find Events'],
      ['/pricing', 'Pricing'],
      ['/become-organizer', 'Sell Tickets'],
      ['/become-promoter', 'Become a Promoter'],
      ['/leaderboard', 'Promoter Leaderboard'],
    ],
  },
];

const Divider = () => <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />;

export function SiteFooter() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  return (
    <footer className="relative overflow-hidden bg-gray-900 text-gray-300">
      <div aria-hidden className="pattern-1 absolute inset-0 opacity-15" />
      <div aria-hidden className="absolute inset-0 bg-gray-900/80" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 py-12 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-heading text-2xl font-bold text-white">Stay in the Loop</h3>
            <p className="font-body text-gray-400">
              Get the latest events and exclusive offers delivered to your inbox
            </p>
          </div>
          {/* Event updates go to account holders, so this starts sign-up with the email filled in. */}
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/register?email=${encodeURIComponent(email.trim())}`);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              aria-label="Email address"
              className="h-11 min-w-0 flex-1 rounded-md border border-gray-700 bg-gray-800 px-4 text-white placeholder:text-gray-500 focus:border-primary focus:outline-none"
            />
            <button type="submit" className="h-11 rounded-md bg-primary px-8 font-semibold text-white hover:bg-primary/90">
              Subscribe
            </button>
          </form>
        </div>

        <Divider />

        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-6 inline-block transition-transform hover:scale-105" aria-label="Klix home">
              <img src="/logo-white.png" alt="Klix" className="h-10 w-auto" />
            </Link>
            <p className="mb-6 font-body text-gray-400">
              Making event discovery and ticketing simple, fun, and rewarding.
            </p>
            <SocialIcons />
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-heading font-semibold text-white">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="font-body text-gray-400 transition-colors hover:text-primary">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Divider />

        <div className="flex flex-col items-center justify-between gap-3 py-6 font-body text-sm text-gray-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Klix. All rights reserved.</p>
          <p className="flex items-center gap-2">
            Payments by <img src="/M-PESA.png" alt="M-Pesa" className="h-5 w-auto rounded bg-white px-1" />
          </p>
        </div>
      </div>
    </footer>
  );
}
