'use client';

import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { DashboardShell } from '@/components/dashboard-shell';
import { Building2, CalendarDays, FileText, LayoutDashboard, Megaphone, Users, Wallet } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardShell
      title="Admin"
      items={[
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/organizers', label: 'Organizers', icon: Building2 },
        { href: '/admin/promoters', label: 'Promoters', icon: Megaphone },
        { href: '/admin/events', label: 'Events', icon: CalendarDays },
        { href: '/admin/payouts', label: 'Payouts', icon: Wallet },
        { href: '/admin/audit', label: 'Audit Logs', icon: FileText },
      ]}
    >
      <RequireAuth roles={['admin']}>{children}</RequireAuth>
    </DashboardShell>
  );
}
