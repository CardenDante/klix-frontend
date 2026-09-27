'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';
import { RequireAuth } from '@/components/require-auth';
import { TicketQR } from '@/components/ticket-qr';
import { ErrorNote, Spinner } from '@/components/ui/misc';
import { ticketsApi } from '@/lib/api/endpoints';

export default function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <RequireAuth>
      <TicketView id={id} />
    </RequireAuth>
  );
}

function TicketView({ id }: { id: string }) {
  const query = useQuery({ queryKey: ['ticket', id], queryFn: () => ticketsApi.get(id) });

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <Link href="/tickets" className="text-sm font-medium text-muted hover:text-ink">
        ← My tickets
      </Link>
      <div className="mt-4">
        {query.isPending ? (
          <Spinner />
        ) : query.isError ? (
          <ErrorNote>{query.error.message}</ErrorNote>
        ) : (
          <>
            <TicketQR ticket={query.data} />
            <p className="mt-4 text-center text-sm text-muted">
              Turn your screen brightness up when scanning. A screenshot works too.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
