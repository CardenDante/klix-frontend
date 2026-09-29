'use client';

import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { SubNav } from '@/components/sub-nav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth roles={['admin']}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <SubNav
          items={[
            { href: '/admin', label: 'Overview', exact: true },
            { href: '/admin/organizers', label: 'Organizers' },
            { href: '/admin/promoters', label: 'Promoters' },
            { href: '/admin/users', label: 'Users' },
            { href: '/admin/events', label: 'Events' },
            { href: '/admin/payouts', label: 'Payouts' },
            { href: '/admin/audit', label: 'Audit log' },
          ]}
        />
        {children}
      </div>
    </RequireAuth>
  );
}
