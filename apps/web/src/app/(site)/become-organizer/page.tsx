'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, CheckCircle2, Clock, QrCode, Wallet, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button, ButtonLink } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Card, Spinner } from '@/components/ui/misc';
import { ApiError } from '@/lib/api/client';
import { organizerApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';

const schema = z.object({
  business_name: z.string().trim().min(2, 'Enter your business or brand name'),
  business_registration: z.string().trim().optional(),
  website: z.union([z.literal(''), z.url('Enter a full URL, e.g. https://example.com')]).optional(),
  description: z.string().trim().max(5000).optional(),
});

type Values = z.infer<typeof schema>;

export default function BecomeOrganizerPage() {
  const { user, hydrated } = useAuth();

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-4 py-12 lg:grid-cols-2">
      <div>
        <h1 className="text-4xl font-bold leading-tight">Sell tickets on Klix</h1>
        <p className="mt-4 text-lg text-muted">
          Publish your event in minutes, take payments through M-Pesa and check guests in with your phone.
        </p>
        <ul className="mt-8 space-y-5">
          {[
            { icon: Wallet, title: 'M-Pesa built in', body: 'Buyers pay with an STK prompt — no cards, no friction.' },
            { icon: QrCode, title: 'Door scanning', body: 'Add staff and scan signed QR tickets from any phone.' },
            { icon: BarChart3, title: 'Live sales', body: 'See tickets sold and check-ins in real time.' },
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
            <p className="mt-2 text-muted">Create an account or sign in, then tell us about your events.</p>
            <div className="mt-6 flex justify-center gap-3">
              <ButtonLink href="/register?next=/become-organizer">Create account</ButtonLink>
              <ButtonLink href="/login?next=/become-organizer" variant="secondary">
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
  const existing = useQuery({
    queryKey: ['organizer-me'],
    queryFn: () =>
      organizerApi.me().catch((e) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }),
  });

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { business_name: '', website: '' } });

  if (existing.isPending) return <Spinner />;

  const organizer = existing.data;
  if (organizer) {
    const states = {
      pending: { icon: Clock, tone: 'text-amber-600 bg-amber-100', title: 'Application under review', body: "We'll review your application shortly. You'll be able to create events once approved." },
      approved: { icon: CheckCircle2, tone: 'text-green-700 bg-green-100', title: "You're approved!", body: 'Head to your dashboard to create your first event.' },
      rejected: { icon: XCircle, tone: 'text-red-600 bg-red-100', title: 'Application not approved', body: organizer.rejection_reason ?? 'Contact support@chach-a.com for details.' },
      suspended: { icon: XCircle, tone: 'text-red-600 bg-red-100', title: 'Account suspended', body: organizer.rejection_reason ?? 'Contact support@chach-a.com for details.' },
    } as const;
    const state = states[organizer.status];
    const Icon = state.icon;
    return (
      <Card className="p-8 text-center">
        <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${state.tone}`}>
          <Icon className="size-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold">{state.title}</h2>
        <p className="mt-2 text-muted">{state.body}</p>
        <p className="mt-4 text-sm font-semibold">{organizer.business_name}</p>
        {organizer.status === 'approved' && (
          <ButtonLink href="/organizer" className="mt-6">
            Open dashboard
          </ButtonLink>
        )}
      </Card>
    );
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await organizerApi.apply({ ...values, website: values.website || undefined });
      toast.success('Application submitted');
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ['organizer-me'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  const errors = form.formState.errors;
  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-xl font-bold">Tell us about you</h2>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label="Business or brand name" htmlFor="business_name" error={errors.business_name?.message}>
          <Input id="business_name" {...form.register('business_name')} />
        </Field>
        <Field label="Business registration no. (optional)" htmlFor="business_registration">
          <Input id="business_registration" {...form.register('business_registration')} />
        </Field>
        <Field label="Website or social link (optional)" htmlFor="website" error={errors.website?.message}>
          <Input id="website" type="url" placeholder="https://" {...form.register('website')} />
        </Field>
        <Field label="What kind of events do you run?" htmlFor="description">
          <Textarea id="description" {...form.register('description')} />
        </Field>
        <Button type="submit" block size="lg" loading={form.formState.isSubmitting}>
          Submit application
        </Button>
      </form>
    </Card>
  );
}
