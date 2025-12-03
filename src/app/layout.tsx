import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Klix - Discover & Book Tickets to Amazing Events in Kenya",
  description: "Your premier event ticketing platform in Kenya. Discover concerts, festivals, conferences, and more. Easy booking, secure payments, instant tickets. Find your next unforgettable experience with Klix!",
  keywords: [
    "event tickets Kenya",
    "buy tickets online Kenya",
    "Nairobi events",
    "Kenya concerts",
    "event booking platform",
    "ticket sales Kenya",
    "live events Nairobi",
    "music festivals Kenya",
    "conference tickets",
    "entertainment events",
    "Klix tickets",
    "event discovery Kenya"
  ].join(", "),
  authors: [{ name: "Klix" }],
  metadataBase: new URL('https://e-klix.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Klix - Discover & Book Tickets to Amazing Events in Kenya",
    description: "Your premier event ticketing platform in Kenya. Discover concerts, festivals, conferences, and more. Easy booking, secure payments, instant tickets.",
    type: "website",
    locale: "en_KE",
    url: 'https://e-klix.com',
    siteName: 'Klix',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Klix - Event Ticketing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Klix - Discover & Book Tickets to Amazing Events in Kenya",
    description: "Your premier event ticketing platform in Kenya. Find and book tickets to concerts, festivals, conferences, and more.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Add your Google Search Console verification code
  },
  other: {
    'color-scheme': 'light',
    'apple-mobile-web-app-status-bar-style': 'light-content',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#ffffff' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Force light mode with color-scheme and explicit class
    <html lang="en" className="light" suppressHydrationWarning style={{ colorScheme: 'light' }}>
      {/* Explicit inline styles to prevent any dark mode flashing */}
      <body
        className={`${dmSans.variable} antialiased bg-white text-gray-900`}
        style={{ backgroundColor: '#ffffff', color: '#171717', colorScheme: 'light' }}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}