'use client';

import { CalendarDays, DollarSign, LayoutDashboard, Megaphone, Tag, Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';

export default function PromoterLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      title="Promoter"
      items={[
        { href: '/promoter', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { href: '/promoter/events', label: 'Events', icon: CalendarDays },
        { href: '/promoter/codes', label: 'My Codes', icon: Tag },
        { href: '/promoter/earnings', label: 'Earnings', icon: DollarSign },
        { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
      ]}
    >
    <RequireAuth
      roles={['promoter']}
      fallback={
        <div className="mx-auto max-w-lg py-8">
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
      {children}
    </RequireAuth>
    </DashboardShell>
  );
}
