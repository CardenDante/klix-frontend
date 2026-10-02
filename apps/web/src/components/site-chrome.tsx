'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site-footer';
import { BottomNav, SiteHeader } from '@/components/site-header';

// These areas bring their own sidebar (DashboardShell) instead of the site header and footer.
const DASHBOARD = /^\/(organizer|admin|promoter|account|tickets)(\/|$)/;

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (DASHBOARD.test(pathname)) {
    return (
      <>
        {children}
        <BottomNav />
      </>
    );
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
