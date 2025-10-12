import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Klix - Discover Unforgettable Events",
  description: "Find and book tickets to the hottest events in Kenya. From concerts to conferences, Klix makes event discovery simple, fun, and rewarding.",
  keywords: "events, tickets, Kenya, Nairobi, concerts, festivals, conferences",
  authors: [{ name: "Klix" }],
  openGraph: {
    title: "Klix - Discover Unforgettable Events",
    description: "Find and book tickets to the hottest events in Kenya",
    type: "website",
    locale: "en_KE",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}