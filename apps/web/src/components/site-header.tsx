'use client';

import {
  ChevronDown,
  CircleUser,
  Compass,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  Megaphone,
  ScanLine,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import type { User } from '@/lib/api/types';
import { hasRole, useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/events', label: 'Events' },
  { href: '/become-organizer', label: 'Sell tickets' },
];

/** The dashboards a user can switch between, most specific first. */
function workspaces(user: User | null) {
  return [
    { href: '/admin', label: 'Admin', icon: ShieldCheck, show: hasRole(user) },
    {
      href: '/organizer',
      label: 'Organizer',
      icon: LayoutDashboard,
      show: hasRole(user, 'organizer'),
    },
    {
      href: '/promoter',
      label: 'Promoter',
      icon: Megaphone,
      show: user?.role === 'promoter',
    },
    {
      href: '/staff/scanner',
      label: 'Scanner',
      icon: ScanLine,
      show: hasRole(user, 'event_staff', 'organizer'),
    },
  ].filter((w) => w.show);
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();
  const spaces = workspaces(user);

  const signOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="flex shrink-0 items-center" aria-label="Klix home">
          <img src="/logo.png" alt="Klix" className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-medium text-ink/70 hover:text-ink',
                pathname.startsWith(item.href) && 'text-ink',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          {hydrated &&
            (user ? (
              <>
                <Link
                  href="/tickets"
                  className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 hover:text-ink md:flex"
                >
                  <Ticket className="size-4" aria-hidden />
                  My tickets
                </Link>
                <AccountMenu user={user} spaces={spaces} onSignOut={signOut} />
              </>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" size="sm" className="hidden sm:inline-flex">
                  Create account
                </ButtonLink>
              </>
            ))}
        </div>
      </div>
    </header>
  );
}

function initials(user: User) {
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0]!.toUpperCase();
}

function AccountMenu({
  user,
  spaces,
  onSignOut,
}: {
  user: User;
  spaces: ReturnType<typeof workspaces>;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  // Remembers the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpenOn(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpenOn(open ? null : pathname)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-ink/5"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user.profile_image_url ? (
          <img src={user.profile_image_url} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
            {initials(user)}
          </span>
        )}
        <span className="hidden max-w-28 truncate text-sm font-medium md:inline">{user.first_name || 'Account'}</span>
        <ChevronDown className="size-4 text-muted" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-white py-2 shadow-xl shadow-ink/10"
        >
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="truncate font-semibold">{user.full_name || user.email}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          {spaces.length > 0 && (
            <div className="border-b border-line py-1">
              <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Dashboards</p>
              {spaces.map(({ href, label, icon: Icon }) => (
                <MenuLink key={href} href={href} icon={Icon} active={pathname.startsWith(href)}>
                  {label}
                </MenuLink>
              ))}
            </div>
          )}
          <div className="py-1">
            <MenuLink href="/tickets" icon={Ticket} active={pathname.startsWith('/tickets')}>
              My tickets
            </MenuLink>
            <MenuLink href="/account" icon={CircleUser} active={pathname.startsWith('/account')}>
              Account &amp; loyalty
            </MenuLink>
            <button
              role="menuitem"
              onClick={onSignOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-ink/80 hover:bg-ink/5 hover:text-ink"
            >
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  active,
  children,
}: {
  href: string;
  icon: typeof Ticket;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      role="menuitem"
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-2 text-sm text-ink/80 hover:bg-ink/5 hover:text-ink',
        active && 'font-semibold text-ink',
      )}
    >
      <Icon className="size-4" aria-hidden /> {children}
    </Link>
  );
}

// Pages with their own bottom action bar, or that need the whole screen.
const NO_BOTTOM_NAV = [/^\/checkout/, /^\/orders\//, /^\/staff\/scanner/, /^\/events\/[^/]+$/];

/** App-style tab bar on phones, so the main destinations are one tap away. */
export function BottomNav() {
  const pathname = usePathname();
  const { user: storedUser, hydrated } = useAuth();
  const user = hydrated ? storedUser : null;
  const spaces = workspaces(user);
  if (NO_BOTTOM_NAV.some((re) => re.test(pathname))) return null;

  const primary = spaces[0];
  const tabs = [
    { href: '/', label: 'Home', icon: Home, exact: true },
    { href: '/events', label: 'Explore', icon: Compass },
    ...(user
      ? [
          { href: '/tickets', label: 'Tickets', icon: Ticket },
          ...(primary ? [{ href: primary.href, label: primary.label, icon: primary.icon }] : []),
          { href: '/account', label: 'Account', icon: CircleUser },
        ]
      : [
          {
            href: `/login?next=${encodeURIComponent(pathname)}`,
            label: 'Sign in',
            icon: LogIn,
          },
        ]),
  ];

  return (
    <>
      <div className="h-16 md:hidden" aria-hidden />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="flex h-16">
          {tabs.map(({ href, label, icon: Icon, ...t }) => {
            const path = href.split('?')[0]!;
            const active = 'exact' in t ? pathname === path : pathname.startsWith(path);
            return (
              <li key={label} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
                    active ? 'text-brand-600' : 'text-ink/60',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
