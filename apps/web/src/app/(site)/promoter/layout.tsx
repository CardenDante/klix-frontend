'use client';

import { Megaphone } from 'lucide-react';
import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { SubNav } from '@/components/sub-nav';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';

export default function PromoterLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth
      roles={['promoter']}
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16">
          <EmptyState
            icon={<Megaphone className="size-5" />}
            title="Promoter dashboard"
            action={<ButtonLink href="/become-promoter">Apply to promote</ButtonLink>}
          >
            You need an approved promoter account to sell tickets with your own codes.
          </EmptyState>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-10">
        <SubNav
          items={[
            { href: '/promoter', label: 'Dashboard', exact: true },
            { href: '/promoter/events', label: 'Events' },
            { href: '/promoter/codes', label: 'My codes' },
            { href: '/promoter/earnings', label: 'Earnings' },
            { href: '/leaderboard', label: 'Leaderboard' },
          ]}
        />
        {children}
      </div>
    </RequireAuth>
  );
}
