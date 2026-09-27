import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/components/providers';
import { SITE_URL } from '@/lib/utils';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Klix — Discover events & buy tickets in Kenya', template: '%s · Klix' },
  description:
    'Find concerts, festivals, conferences and more across Kenya. Pay with M-Pesa and get your tickets instantly.',
  icons: { icon: '/favicon.png' },
  openGraph: { siteName: 'Klix', type: 'website', locale: 'en_KE' },
};

export const viewport: Viewport = {
  themeColor: '#eb7d30',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
