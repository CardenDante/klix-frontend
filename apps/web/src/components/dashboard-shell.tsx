'use client';

import {
  ArrowLeft,
  CircleUser,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ScanLine,
  ShieldCheck,
  Ticket,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import type { User } from '@/lib/api/types';
import { hasRole, useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  attendee: 'Attendee',
  organizer: 'Organizer',
  promoter: 'Promoter',
  event_staff: 'Event Staff',
  admin: 'Admin',
};

/** Every dashboard this user can open, for the "switch to" list. */
function workspaces(user: User | null) {
  return [
    { href: '/admin', label: 'Admin', icon: ShieldCheck, show: hasRole(user) },
    { href: '/organizer', label: 'Organizer', icon: LayoutDashboard, show: hasRole(user, 'organizer') },
    { href: '/promoter', label: 'Promoter', icon: Megaphone, show: user?.role === 'promoter' },
    { href: '/staff/scanner', label: 'Ticket scanner', icon: ScanLine, show: hasRole(user, 'event_staff', 'organizer') },
    { href: '/tickets', label: 'My tickets', icon: Ticket, show: !!user },
    { href: '/account', label: 'Account', icon: CircleUser, show: !!user },
  ].filter((w) => w.show);
}

function isActive(pathname: string, item: { href: string; exact?: boolean }) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * The dashboard app shell from the original Klix design: a white sidebar with
 * the logo, who is signed in and the section's menu, over a gray canvas.
 */
export function DashboardShell({
  title,
  items,
  children,
  width = 'max-w-6xl',
}: {
  title: string;
  items: DashboardNavItem[];
  children: ReactNode;
  width?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  // Remembers the page the drawer was opened on, so navigating closes it.
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const drawerOpen = drawerOn === pathname;

  const others = workspaces(user).filter((w) => !items.some((i) => i.href === w.href));

  const signOut = async () => {
    await logout();
    router.push('/');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-20 shrink-0 items-center justify-between border-b border-gray-100 px-6">
        <Link href="/" aria-label="Klix home">
          <img src="/logo.png" alt="Klix" className="h-9 w-auto" />
        </Link>
        <button
          onClick={() => setDrawerOn(null)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>

      {user && (
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          {user.profile_image_url ? (
            <img src={user.profile_image_url} alt="" className="size-10 rounded-full object-cover" />
          ) : (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-white">
              {(user.first_name?.[0] ?? user.email[0] ?? '?').toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold text-gray-900">{user.full_name || user.first_name || user.email}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</p>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <NavLink item={item} active={isActive(pathname, item)} />
            </li>
          ))}
        </ul>

        {others.length > 0 && (
          <>
            <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Switch to</p>
            <ul className="space-y-1">
              {others.map((item) => (
                <li key={item.href}>
                  <NavLink item={item} active={false} />
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      <div className="space-y-1 border-t border-gray-100 p-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-orange-50 hover:text-primary"
        >
          <ArrowLeft className="size-5" aria-hidden /> Back to site
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="size-5" aria-hidden /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 bg-white lg:block">{sidebar}</aside>

      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
        <Link href="/" aria-label="Klix home">
          <img src="/logo.png" alt="Klix" className="h-8 w-auto" />
        </Link>
        <button
          onClick={() => setDrawerOn(pathname)}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
        >
          <Menu className="size-6" />
        </button>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOn(null)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">{sidebar}</aside>
        </div>
      )}

      <main className="lg:ml-64">
        <div className={cn('mx-auto px-4 py-8 sm:px-6 lg:px-8 lg:py-10', width)}>{children}</div>
      </main>
    </div>
  );
}

function NavLink({ item, active }: { item: DashboardNavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
        active ? 'bg-primary text-white shadow-md' : 'text-gray-700 hover:bg-orange-50 hover:text-primary',
      )}
    >
      <Icon className="size-5" aria-hidden />
      {item.label}
    </Link>
  );
}
