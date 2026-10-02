'use client';

import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { BarChart3, CalendarDays, LayoutDashboard, PlusCircle, Settings, Users, Wallet } from 'lucide-react';

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      title="Organizer"
      items={[
        { href: '/organizer', label: 'My Events', icon: CalendarDays, exact: true },
        { href: '/organizer/events/new', label: 'Create Event', icon: PlusCircle },
        { href: '/organizer/analytics', label: 'Analytics', icon: BarChart3 },
        { href: '/organizer/promoters', label: 'Promoters', icon: Users },
        { href: '/organizer/payouts', label: 'Payouts', icon: Wallet },
        { href: '/organizer/settings', label: 'Settings', icon: Settings },
      ]}
    >
    <RequireAuth
      roles={['organizer']}
      fallback={
        <div className="mx-auto max-w-lg py-8">
          <EmptyState
            icon={<LayoutDashboard className="size-5" />}
            title="Organizer dashboard"
            action={<ButtonLink href="/become-organizer">Apply to sell tickets</ButtonLink>}
          >
            You need an approved organizer account to create events.
          </EmptyState>
        </div>
      }
    >
      {children}
    </RequireAuth>
    </DashboardShell>
  );
}
