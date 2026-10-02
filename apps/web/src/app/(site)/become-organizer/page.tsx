'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Shield,
  Ticket,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Pattern, SectionTitle } from '@/components/landing/section-title';
import { Button, ButtonLink, buttonVariants } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Card, Spinner } from '@/components/ui/misc';
import { ApiError } from '@/lib/api/client';
import { organizerApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/format';

const schema = z.object({
  business_name: z.string().trim().min(2, 'Enter your business or brand name'),
  business_registration: z.string().trim().optional(),
  website: z.union([z.literal(''), z.url('Enter a full URL, e.g. https://example.com')]).optional(),
  description: z.string().trim().max(5000).optional(),
});

type Values = z.infer<typeof schema>;

const FEATURES = [
  { icon: BarChart3, title: 'Real-Time Analytics', description: 'Track sales, revenue, and attendee data instantly.' },
  { icon: Ticket, title: 'Easy Ticket Setup', description: 'Create multiple ticket types and pricing tiers in minutes.' },
  { icon: Users, title: 'Staff Management', description: 'Assign roles with granular permissions for check-ins.' },
  { icon: DollarSign, title: 'Instant Payouts', description: 'Direct M-Pesa integration with transparent, low fees.' },
  { icon: Shield, title: 'Secure Payments', description: 'Bank-grade security and fraud prevention for all transactions.' },
  { icon: Zap, title: 'Quick Setup', description: "Publish your first event in under 5 minutes. It's that simple." },
];

const STEPS = [
  { step: '01', title: 'Create Your Account', description: 'Sign up for free and tell us a bit about your events.' },
  { step: '02', title: 'Publish Your Event', description: 'Use our simple tools to set up your event page and ticket types.' },
  { step: '03', title: 'Start Selling', description: 'Share your event and watch the sales roll in with real-time analytics.' },
];

export default function BecomeOrganizerPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative flex h-[60vh] min-h-[450px] items-center justify-center overflow-hidden text-center text-white">
        <img src="/hero/hero2.jpg" alt="" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/bckpattern3.webp')" }}
        />
        <div className="relative z-10 p-4">
          <h1 className="animate-fade-in-up font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Host Your Next Great
            <br />
            <span className="gradient-text mt-2 inline-block pr-4 font-playful font-normal">Event</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-3xl animate-fade-in-up font-body text-lg text-gray-200"
            style={{ animationDelay: '0.2s' }}
          >
            Powerful tools, transparent pricing, and local support to help you create unforgettable experiences.
          </p>
          <ButtonLink
            href="#apply"
            size="lg"
            className="mt-8 animate-fade-in-up px-8 text-lg font-bold"
            style={{ animationDelay: '0.4s' }}
          >
            Get Started For Free
            <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <SectionTitle accent="3 Easy Steps">Get Started in</SectionTitle>
          </div>
          <div className="grid gap-8 text-center md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="p-6">
                <div className="gradient-text mb-4 font-heading text-6xl font-bold">{s.step}</div>
                <h3 className="mb-2 font-heading text-xl font-bold text-gray-900">{s.title}</h3>
                <p className="font-body text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative overflow-hidden bg-orange-50/50 py-20">
        <Pattern variant={2} className="left-0 top-0 h-full w-1/2 bg-left-top opacity-30" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <SectionTitle accent="Succeed">Tools to Help You</SectionTitle>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="relative rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-primary p-0.5 shadow-lg"
              >
                <div className="h-full rounded-[15px] bg-white/90 p-6 backdrop-blur-sm">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-6 text-primary" aria-hidden />
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-bold text-gray-900">{title}</h3>
                  <p className="font-body text-sm text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-white px-4 py-20">
        <div className="mx-auto grid max-w-4xl items-center gap-8 text-center md:grid-cols-2 md:text-left">
          <div>
            <SectionTitle accent="Pricing">Simple, Transparent</SectionTitle>
            <p className="mt-4 font-body text-lg text-gray-600">
              No setup fees, no monthly costs. We only make money when you do.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-gray-50 p-8">
            <p className="font-body text-lg text-gray-600">Pay-as-you-go</p>
            <div className="my-2 font-heading text-5xl font-bold text-gray-900">2.5%</div>
            <p className="font-body text-gray-600">Per ticket sold</p>
          </div>
        </div>
      </section>

      {/* Application */}
      <section id="apply" className="relative scroll-mt-24 overflow-hidden bg-gray-50 px-4 py-20">
        <Pattern variant={3} className="right-0 top-0 h-full w-1/2 bg-right-top opacity-20" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <SectionTitle accent="Organizer">Become an</SectionTitle>
            <p className="mt-4 font-body text-lg text-gray-600">
              Tell us about your events. We usually review applications within 24-48 hours.
            </p>
          </div>
          <ApplySection />
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gray-900 p-12 text-center">
          <div
            aria-hidden
            className="absolute inset-0 bg-center opacity-10"
            style={{ backgroundImage: "url('/bckpattern1.webp')", backgroundSize: '200%' }}
          />
          <div className="relative z-10">
            <h2 className="mb-4 font-heading text-3xl font-bold text-white">Ready to Create an Event?</h2>
            <p className="mx-auto mb-8 max-w-2xl font-body text-gray-300">
              Join hundreds of successful organizers and start selling tickets in minutes.
            </p>
            <ButtonLink href="#apply" size="lg" className="px-8 text-lg font-bold">
              Start Organizing Today
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function ApplySection() {
  const { user, hydrated } = useAuth();
  if (!hydrated) return <Spinner />;
  if (user) return <Application />;
  return (
    <Card className="p-8 text-center">
      <h2 className="font-heading text-xl font-bold">Start with a Klix account</h2>
      <p className="mt-2 text-muted">Create an account or sign in, then tell us about your events.</p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href="/register?next=/become-organizer">Create account</ButtonLink>
        <ButtonLink href="/login?next=/become-organizer" variant="secondary">
          Sign in
        </ButtonLink>
      </div>
    </Card>
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
      pending: {
        icon: Clock,
        tone: 'text-amber-600 bg-amber-100',
        title: 'Application under review',
        body: "We're reviewing your application, usually within 24-48 hours. You'll be able to create events once approved.",
      },
      approved: {
        icon: CheckCircle2,
        tone: 'text-green-700 bg-green-100',
        title: "Congratulations! You're an Organizer",
        body: 'Your application has been approved. You can now create events, manage tickets, and grow your audience.',
      },
      rejected: {
        icon: XCircle,
        tone: 'text-red-600 bg-red-100',
        title: 'Application not approved',
        body: organizer.rejection_reason || 'No specific reason provided. Contact support for details.',
      },
      suspended: {
        icon: XCircle,
        tone: 'text-red-600 bg-red-100',
        title: 'Account suspended',
        body:
          organizer.rejection_reason ||
          'Your organizer account has been temporarily suspended. Please contact support for more information.',
      },
    } as const;
    const state = states[organizer.status];
    const Icon = state.icon;
    return (
      <Card className="p-6 sm:p-8">
        <div className="text-center">
          <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${state.tone}`}>
            <Icon className="size-7" aria-hidden />
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold">{state.title}</h2>
          <p className="mt-2 text-muted">{state.body}</p>
        </div>

        {organizer.status === 'approved' && (
          <div className="mt-6 rounded-xl bg-gray-50 p-5">
            <p className="font-semibold">What&apos;s next?</p>
            <ul className="mt-3 space-y-2 font-body text-gray-600">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-hidden />
                <span>Set up your M-Pesa payment credentials to get paid.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-hidden />
                <span>Create your first event and start selling tickets.</span>
              </li>
            </ul>
          </div>
        )}

        <div className="mt-6 border-t border-line pt-6">
          <h3 className="font-heading font-bold">Your Application</h3>
          <p className="text-sm text-muted">Submitted on {formatDate(organizer.created_at)}</p>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm font-semibold text-gray-500">Business Name</dt>
              <dd className="text-gray-900">{organizer.business_name}</dd>
            </div>
            {organizer.business_registration && (
              <div>
                <dt className="text-sm font-semibold text-gray-500">Registration Number</dt>
                <dd className="text-gray-900">{organizer.business_registration}</dd>
              </div>
            )}
            {organizer.website && (
              <div>
                <dt className="text-sm font-semibold text-gray-500">Website</dt>
                <dd>
                  <a
                    href={organizer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-primary hover:underline"
                  >
                    {organizer.website}
                  </a>
                </dd>
              </div>
            )}
            {organizer.description && (
              <div>
                <dt className="text-sm font-semibold text-gray-500">Description</dt>
                <dd className="whitespace-pre-wrap text-gray-700">{organizer.description}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {organizer.status === 'approved' && (
            <>
              <ButtonLink href="/organizer">
                Go to Organizer Dashboard
                <ArrowRight className="size-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/organizer/settings" variant="secondary">
                Set up M-Pesa
              </ButtonLink>
            </>
          )}
          <a href="mailto:support@chach-a.com" className={buttonClass}>
            <Mail className="size-4" aria-hidden />
            Contact Support
          </a>
        </div>
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
      <h2 className="font-heading text-xl font-bold">Tell us about you</h2>
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

const buttonClass = buttonVariants({ variant: 'secondary' });
