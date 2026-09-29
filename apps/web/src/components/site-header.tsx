'use client';

import { CircleUser, LayoutDashboard, LogOut, Megaphone, Menu, ScanLine, ShieldCheck, Ticket, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { hasRole, useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/events', label: 'Events' },
  { href: '/become-organizer', label: 'Sell tickets' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, hydrated, logout } = useAuth();
  // The menu remembers which page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  const accountLinks = [
    { href: '/tickets', label: 'My tickets', icon: Ticket, show: !!user },
    { href: '/promoter', label: 'Promoter', icon: Megaphone, show: user?.role === 'promoter' },
    { href: '/organizer', label: 'Organizer', icon: LayoutDashboard, show: hasRole(user, 'organizer') },
    { href: '/staff/scanner', label: 'Scanner', icon: ScanLine, show: hasRole(user, 'event_staff', 'organizer') },
    { href: '/admin', label: 'Admin', icon: ShieldCheck, show: hasRole(user) },
    { href: '/account', label: 'Account', icon: CircleUser, show: !!user },
  ].filter((l) => l.show);

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

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {hydrated &&
            (user ? (
              <>
                {accountLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-ink/70 hover:bg-ink/5 hover:text-ink"
                  >
                    <Icon className="size-4" aria-hidden />
                    {label}
                  </Link>
                ))}
                <button
                  onClick={signOut}
                  className="rounded-full p-2 text-ink/60 hover:bg-ink/5 hover:text-ink"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register" size="sm">
                  Create account
                </ButtonLink>
              </>
            ))}
        </div>

        <button
          className="ml-auto rounded-full p-2 md:hidden"
          onClick={() => setOpenOn(open ? null : pathname)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col py-2">
            {[...NAV, ...accountLinks].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-2 py-3 font-medium">
                {item.label}
              </Link>
            ))}
          </nav>
          {hydrated &&
            (user ? (
              <button onClick={signOut} className="w-full rounded-full border border-line py-2.5 text-sm font-semibold">
                Sign out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <ButtonLink href="/login" variant="secondary">
                  Sign in
                </ButtonLink>
                <ButtonLink href="/register">Create account</ButtonLink>
              </div>
            ))}
        </div>
      )}
    </header>
  );
}
