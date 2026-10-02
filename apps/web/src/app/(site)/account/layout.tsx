'use client';

import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { ACCOUNT_NAV } from '@/components/account-nav';
import { DashboardShell } from '@/components/dashboard-shell';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell title="My Account" items={ACCOUNT_NAV} width="max-w-3xl">
      <RequireAuth>
        <h1 className="mb-6 font-heading text-3xl font-bold">Your account</h1>
        {children}
      </RequireAuth>
    </DashboardShell>
  );
}
