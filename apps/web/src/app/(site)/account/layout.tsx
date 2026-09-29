'use client';

import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { SubNav } from '@/components/sub-nav';

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold">Your account</h1>
        <SubNav
          items={[
            { href: '/account', label: 'Profile', exact: true },
            { href: '/account/loyalty', label: 'Loyalty credits' },
            { href: '/tickets', label: 'Tickets' },
          ]}
        />
        {children}
      </div>
    </RequireAuth>
  );
}
