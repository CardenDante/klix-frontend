'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState, Spinner } from '@/components/ui/misc';
import type { UserRole } from '@/lib/api/types';
import { hasRole, useAuth } from '@/lib/auth';
import { Lock } from 'lucide-react';

/** Renders children only for signed-in users (optionally with one of `roles`). */
export function RequireAuth({
  roles,
  children,
  fallback,
}: {
  roles?: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, hydrated } = useAuth();

  useEffect(() => {
    if (hydrated && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, user, router, pathname]);

  if (!hydrated || !user) return <Spinner className="py-32" />;

  if (roles && !hasRole(user, ...roles)) {
    return (
      fallback ?? (
        <div className="mx-auto max-w-lg px-4 py-16">
          <EmptyState
            icon={<Lock className="size-5" />}
            title="You don't have access to this page"
            action={<ButtonLink href="/">Go home</ButtonLink>}
          />
        </div>
      )
    );
  }

  return children;
}

/** Only allow same-site relative redirects after sign-in. */
export function safeNext(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}
