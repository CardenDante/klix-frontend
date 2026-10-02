'use client';

import type { ReactNode } from 'react';
import { ACCOUNT_NAV } from '@/components/account-nav';
import { DashboardShell } from '@/components/dashboard-shell';

export default function TicketsLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="My Account" items={ACCOUNT_NAV} width="max-w-4xl">
      {children}
    </DashboardShell>
  );
}
