'use client';

import type { ReactNode } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/misc';
import { LayoutDashboard } from 'lucide-react';

export default function OrganizerLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth
      roles={['organizer']}
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16">
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
      <div className="mx-auto max-w-6xl px-4 py-10">{children}</div>
    </RequireAuth>
  );
}
