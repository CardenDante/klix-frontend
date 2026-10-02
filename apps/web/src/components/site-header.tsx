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
  Menu,
  ScanLine,
  ShieldCheck,
  Ticket,
  X,
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
  { href: '/about', label: 'About Us' },
  { href: '/become-organizer', label: 'For Organizers' },
  { href: '/become-promoter', label: 'For Promoters' },
  { href: '/contact', label: 'Contact' },
];

/** True once the page has scrolled past the top. */
function useScrolled(threshold = 20) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

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
  const scrolled = useScrolled();
  // Remembers the page the mobile menu was opened on, so navigating closes it.
  const [menuOn, setMenuOn] = useState<string | null>(null);
  const menuOpen = menuOn === pathname;

  // The home page hero runs under a see-through header until you scroll.
  const overHero = pathname === '/';
  const clear = overHero && !scrolled && !menuOpen;

  const signOut = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <header
        className={cn(
          'top-0 z-40 w-full transition-all duration-300',
          overHero ? 'fixed' : 'sticky',
          clear ? 'bg-black/20' : 'bg-white/95 shadow-lg backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center transition-transform hover:scale-105" aria-label="Klix home">
            <img src={clear ? '/logo-white.png' : '/logo.png'} alt="Klix" className="h-9 w-auto" />
          </Link>

          <nav className="mx-auto hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative py-1 font-medium transition-colors',
                  clear ? 'text-white hover:text-primary-light' : 'text-gray-700 hover:text-primary',
                  pathname.startsWith(item.href) && (clear ? 'text-primary-light' : 'text-primary'),
                )}
              >
                {item.label}
                <span
                  className={cn(
                    'absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full',
                    pathname.startsWith(item.href) ? 'w-full' : 'w-0',
                  )}
                />
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {hydrated &&
              (user ? (
                <>
                  <Link
                    href="/tickets"
                    className={cn(
                      'hidden items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium md:flex',
                      clear ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-orange-50 hover:text-primary',
                    )}
                  >
                    <Ticket className="size-4" aria-hidden />
                    My tickets
                  </Link>
                  <AccountMenu user={user} spaces={spaces} onSignOut={signOut} light={clear} />
                </>
              ) : (
                <>
                  <ButtonLink
                    href="/login"
                    variant="secondary"
                    size="sm"
                    className={cn(
                      'rounded-md border-primary font-semibold',
                      clear ? 'bg-transparent text-white hover:bg-white/10' : 'text-primary hover:bg-primary hover:text-white',
                    )}
                  >
                    Login
                  </ButtonLink>
                  <ButtonLink href="/register" size="sm" className="hidden rounded-md sm:inline-flex">
                    Sign Up
                  </ButtonLink>
                </>
              ))}
            <button
              onClick={() => setMenuOn(menuOpen ? null : pathname)}
              className={cn('rounded-lg p-2 lg:hidden', clear ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100')}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-gray-100 bg-white px-4 pb-4 shadow-lg lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'block rounded-lg px-3 py-3 font-medium text-gray-700 hover:bg-orange-50 hover:text-primary',
                  pathname.startsWith(item.href) && 'bg-orange-50 text-primary',
                )}
              >
                {item.label}
              </Link>
            ))}
            {hydrated && !user && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ButtonLink href="/login" variant="secondary" className="rounded-md border-primary text-primary">
                  Login
                </ButtonLink>
                <ButtonLink href="/register" className="rounded-md">
                  Sign Up
                </ButtonLink>
              </div>
            )}
          </nav>
        )}
      </header>
    </>
  );
}

function initials(user: User) {
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() || user.email[0]!.toUpperCase();
}

function AccountMenu({
  user,
  spaces,
  onSignOut,
  light = false,
}: {
  user: User;
  spaces: ReturnType<typeof workspaces>;
  onSignOut: () => void;
  light?: boolean;
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
        className={cn(
          'flex items-center gap-2 rounded-full py-1 pl-1 pr-2',
          light ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-orange-50',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        {user.profile_image_url ? (
          <img src={user.profile_image_url} alt="" className="size-8 rounded-full object-cover" />
        ) : (
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials(user)}
          </span>
        )}
        <span className="hidden max-w-28 truncate text-sm font-medium md:inline">{user.first_name || 'Account'}</span>
        <ChevronDown className={cn('size-4', light ? 'text-white/80' : 'text-muted')} aria-hidden />
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
                    active ? 'text-primary' : 'text-gray-500 hover:text-primary',
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
