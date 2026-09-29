'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, Megaphone, Percent, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Card, Spinner } from '@/components/ui/misc';
import { ApiError } from '@/lib/api/client';
import { promoterApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { isKenyanPhone, normalizePhone } from '@/lib/format';

export default function BecomePromoterPage() {
  const { user, hydrated } = useAuth();
  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-12 lg:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold leading-tight">Earn by promoting events</h1>
        <p className="mt-4 text-lg text-muted">
          Share your own code with your audience. Your followers get a discount, and you earn a commission on every ticket.
        </p>
        <ul className="mt-8 space-y-5">
          {[
            { icon: Megaphone, title: 'Pick events you love', body: 'Request to promote any live event. Organizers set your terms.' },
            { icon: Percent, title: 'Your own codes and links', body: 'Track clicks, sales and conversion for every code.' },
            { icon: Wallet, title: 'Paid to M-Pesa', body: 'Withdraw your commission once the event has happened.' },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="size-5" aria-hidden />
              </div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div>
        {!hydrated ? (
          <Spinner />
        ) : user ? (
          <Application />
        ) : (
          <Card className="p-8 text-center">
            <h2 className="text-xl font-bold">Start with a Klix account</h2>
            <div className="mt-6 flex justify-center gap-3">
              <ButtonLink href="/register?next=/become-promoter">Create account</ButtonLink>
              <ButtonLink href="/login?next=/become-promoter" variant="secondary">
                Sign in
              </ButtonLink>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Application() {
  const queryClient = useQueryClient();
  const refreshUser = useAuth((s) => s.refreshUser);
  const [form, setForm] = useState({ display_name: '', bio: '', social_links: '', experience: '', payout_phone: '' });

  const existing = useQuery({
    queryKey: ['promoter-me'],
    queryFn: () =>
      promoterApi.me().catch((e) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }),
  });

  const apply = useMutation({
    mutationFn: () =>
      promoterApi.apply({
        ...form,
        payout_phone: form.payout_phone ? normalizePhone(form.payout_phone) : undefined,
      }),
    onSuccess: async () => {
      toast.success('Application sent');
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['promoter-me'] });
    },
    onError: (e) => toast.error(e.message),
  });

  if (existing.isPending) return <Spinner />;

  const profile = existing.data;
  if (profile) {
    const states = {
      pending: { icon: Clock, tone: 'bg-amber-100 text-amber-600', title: 'Application under review', body: "We'll let you know by email." },
      approved: { icon: CheckCircle2, tone: 'bg-green-100 text-green-700', title: "You're a Klix promoter", body: 'Find events to promote from your dashboard.' },
      rejected: { icon: XCircle, tone: 'bg-red-100 text-red-600', title: 'Application not approved', body: profile.rejection_reason ?? '' },
      suspended: { icon: XCircle, tone: 'bg-red-100 text-red-600', title: 'Account suspended', body: profile.rejection_reason ?? '' },
    } as const;
    const s = states[profile.status];
    const Icon = s.icon;
    return (
      <Card className="p-8 text-center">
        <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${s.tone}`}>
          <Icon className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold">{s.title}</h2>
        <p className="mt-2 text-muted">{s.body}</p>
        {profile.status === 'approved' && (
          <ButtonLink href="/promoter" className="mt-6">
            Open promoter dashboard
          </ButtonLink>
        )}
      </Card>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-xl font-bold">Apply to promote</h2>
      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (form.display_name.trim().length < 2) return toast.error('Enter a display name');
          if (form.payout_phone && !isKenyanPhone(form.payout_phone)) return toast.error('Enter a valid M-Pesa number');
          apply.mutate();
        }}
      >
        <Field label="Display name" htmlFor="display_name" hint="Shown to organizers and on the leaderboard.">
          <Input id="display_name" value={form.display_name} onChange={set('display_name')} />
        </Field>
        <Field label="Where's your audience?" htmlFor="social_links" hint="Instagram, TikTok, X, WhatsApp groups…">
          <Textarea id="social_links" rows={3} value={form.social_links} onChange={set('social_links')} />
        </Field>
        <Field label="Experience (optional)" htmlFor="experience">
          <Textarea id="experience" rows={3} value={form.experience} onChange={set('experience')} />
        </Field>
        <Field label="M-Pesa number for payouts" htmlFor="payout_phone">
          <Input id="payout_phone" type="tel" placeholder="0712 345 678" value={form.payout_phone} onChange={set('payout_phone')} />
        </Field>
        <Button type="submit" block size="lg" loading={apply.isPending}>
          Submit application
        </Button>
      </form>
    </Card>
  );
}
