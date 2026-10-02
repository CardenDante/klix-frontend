import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import { CONTACT, SOCIAL_LINKS } from '@/lib/site';
import { SITE_URL } from '@/lib/utils';
import './globals.css';

const DESCRIPTION =
  'Your premier event ticketing platform in Kenya. Discover concerts, festivals, conferences and more. Easy booking, secure M-Pesa payments, instant tickets.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Klix - Discover & Book Tickets to Amazing Events in Kenya', template: '%s · Klix' },
  description: DESCRIPTION,
  keywords: [
    'event tickets Kenya',
    'buy tickets online Kenya',
    'Nairobi events',
    'Kenya concerts',
    'event booking platform',
    'ticket sales Kenya',
    'live events Nairobi',
    'music festivals Kenya',
    'conference tickets',
    'entertainment events',
    'Klix tickets',
    'event discovery Kenya',
  ],
  authors: [{ name: 'Klix' }],
  icons: { icon: '/favicon.png' },
  alternates: { canonical: '/' },
  openGraph: {
    siteName: 'Klix',
    type: 'website',
    locale: 'en_KE',
    url: '/',
    title: 'Klix - Discover & Book Tickets to Amazing Events in Kenya',
    description: DESCRIPTION,
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Klix - events and tickets in Kenya' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Klix - Discover & Book Tickets to Amazing Events in Kenya',
    description: DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
};

const STRUCTURED_DATA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Klix',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    email: CONTACT.email,
    telephone: CONTACT.phone,
    address: { '@type': 'PostalAddress', addressLocality: 'Thika', addressRegion: 'Kiambu County', addressCountry: 'KE' },
    sameAs: Object.values(SOCIAL_LINKS),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Klix',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/events?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  },
];

export const viewport: Viewport = {
  themeColor: '#eb7d30',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, '\\u003c') }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
