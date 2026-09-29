'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Share2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ButtonLink } from '@/components/ui/button';
import { Badge, Card, EmptyState, ErrorNote, Spinner } from '@/components/ui/misc';
import { promoterApi } from '@/lib/api/endpoints';
import type { PromoterCode } from '@/lib/api/types';
import { formatKES } from '@/lib/format';
import { SITE_URL } from '@/lib/utils';

export default function PromoterCodesPage() {
  const codes = useQuery({ queryKey: ['promoter-codes'], queryFn: promoterApi.codes });

  return (
    <div>
      <h1 className="text-3xl font-bold">My codes</h1>
      <p className="mt-1 text-muted">Share the link — the code is applied automatically for your followers.</p>
      <div className="mt-6 space-y-4">
        {codes.isPending ? (
          <Spinner />
        ) : codes.isError ? (
          <ErrorNote>{codes.error.message}</ErrorNote>
        ) : codes.data.length === 0 ? (
          <EmptyState icon={<Tag className="size-5" />} title="No codes yet" action={<ButtonLink href="/promoter/events">Find events</ButtonLink>}>
            Once an organizer approves you for an event, create a code for it.
          </EmptyState>
        ) : (
          codes.data.map((code) => <CodeCard key={code.id} code={code} />)
        )}
      </div>
    </div>
  );
}

function CodeCard({ code }: { code: PromoterCode }) {
  const queryClient = useQueryClient();
  const link = code.event ? `${SITE_URL}/events/${code.event.slug}?ref=${code.code}` : '';

  const deactivate = useMutation({
    mutationFn: () => promoterApi.deactivateCode(code.id),
    onSuccess: () => {
      toast.success('Code switched off');
      void queryClient.invalidateQueries({ queryKey: ['promoter-codes'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const copy = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: code.event?.title, text: `Get tickets with my code ${code.code}`, url: link }).catch(() => undefined);
    } else {
      await copy(link, 'Link');
    }
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <button onClick={() => copy(code.code, 'Code')} className="flex items-center gap-1.5 font-mono text-lg font-bold tracking-wider hover:text-brand-600">
              {code.code} <Copy className="size-4" />
            </button>
            {code.is_active ? <Badge tone="success">Active</Badge> : <Badge>Off</Badge>}
          </div>
          <p className="text-sm text-muted">
            {code.event?.title} · {Number(code.commission_percentage ?? 0)}% commission
            {code.code_type === 'discount' && ` · ${Number(code.discount_percentage)}% off`}
          </p>
        </div>
        {code.is_active && (
          <div className="flex gap-2">
            <Button size="sm" onClick={share}>
              <Share2 className="size-4" /> Share link
            </Button>
            <Button size="sm" variant="ghost" onClick={() => deactivate.mutate()} loading={deactivate.isPending}>
              Switch off
            </Button>
          </div>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-5">
        {[
          ['Clicks', code.clicks],
          ['Orders', code.times_used],
          ['Tickets', code.tickets_sold],
          ['Conversion', code.conversion_rate === null ? '–' : `${code.conversion_rate}%`],
          ['Earned', formatKES(code.total_commission_earned)],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
