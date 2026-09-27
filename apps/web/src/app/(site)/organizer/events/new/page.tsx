'use client';

import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/misc';
import { organizerApi } from '@/lib/api/endpoints';
import { EventForm } from '../../event-form';

export default function NewEventPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/organizer" className="text-sm font-medium text-muted hover:text-ink">
        ← Your events
      </Link>
      <h1 className="mt-2 text-3xl font-bold">New event</h1>
      <p className="mt-1 text-muted">It stays a draft until you add tickets and publish.</p>
      <Card className="mt-8 p-6 sm:p-8">
        <EventForm
          submitLabel="Create draft"
          onSubmit={async (input) => {
            try {
              const event = await organizerApi.createEvent(input);
              await queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
              toast.success('Draft created — now add ticket types');
              router.push(`/organizer/events/${event.id}`);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      </Card>
    </div>
  );
}
