import { CircleUser, Coins, Ticket } from 'lucide-react';
import type { DashboardNavItem } from '@/components/dashboard-shell';

/** Sidebar menu shared by the account and tickets areas. */
export const ACCOUNT_NAV: DashboardNavItem[] = [
  { href: '/tickets', label: 'My Tickets', icon: Ticket },
  { href: '/account', label: 'Profile & Settings', icon: CircleUser, exact: true },
  { href: '/account/loyalty', label: 'Loyalty Credits', icon: Coins },
];
