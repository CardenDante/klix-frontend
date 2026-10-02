'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Clock, DollarSign, Mail, Share2, TrendingUp, Trophy, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Pattern, SectionTitle } from '@/components/landing/section-title';
import { Button, ButtonLink, buttonVariants } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Card, Spinner } from '@/components/ui/misc';
import { ApiError } from '@/lib/api/client';
import { promoterApi } from '@/lib/api/endpoints';
import { useAuth } from '@/lib/auth';
import { formatDate, isKenyanPhone, normalizePhone } from '@/lib/format';

const STEPS = [
  { step: '01', title: 'Find an Event', description: 'Browse our marketplace for events you’re passionate about.' },
  { step: '02', title: 'Share Your Code', description: 'Generate a unique promoter code and share it with your network.' },
  {
    step: '03',
    title: 'Get Paid',
    description: 'Earn a commission for every ticket sold with your code, paid out directly to M-Pesa.',
  },
];

const BENEFITS = [
  {
    icon: DollarSign,
    title: 'Generous Commissions',
    description: 'Earn a commission on every single ticket you help sell. Organizers set the rate for each event.',
  },
  {
    icon: TrendingUp,
    title: 'Real-Time Dashboard',
    description: 'Track your clicks, sales, and earnings with a simple, powerful analytics dashboard.',
  },
  {
    icon: Share2,
    title: 'Effortless Sharing',
    description: 'Get unique, shareable links and codes that are easy to post anywhere.',
  },
  {
    icon: Trophy,
    title: 'Leaderboard & Bonuses',
    description: 'Compete with other promoters for top spots and earn bonus rewards.',
  },
];

export default function BecomePromoterPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative flex h-[60vh] min-h-[450px] items-center justify-center overflow-hidden text-center text-white">
        <img src="/hero/hero4.jpg" alt="" className="absolute inset-0 size-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: "url('/bckpattern3.webp')" }}
        />
        <div className="relative z-10 p-4">
          <h1 className="animate-fade-in-up font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Share Events,
            <br />
            <span className="gradient-text mt-2 inline-block pr-4 font-playful font-normal">Earn Rewards</span>
          </h1>
          <p
            className="mx-auto mt-6 max-w-3xl animate-fade-in-up font-body text-lg text-gray-200"
            style={{ animationDelay: '0.2s' }}
          >
            Join the Klix promoter network and turn your influence into income by sharing events you love.
          </p>
          <ButtonLink
            href="#apply"
            size="lg"
            className="mt-8 animate-fade-in-up px-8 text-lg font-bold"
            style={{ animationDelay: '0.4s' }}
          >
            Start Earning Now
            <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <SectionTitle accent="Minutes">Start Earning in</SectionTitle>
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

      {/* Benefits */}
      <section className="relative overflow-hidden bg-orange-50/50 py-20">
        <Pattern variant={2} className="right-0 top-0 h-full w-1/2 bg-right-top opacity-30" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative h-80 w-full overflow-hidden rounded-2xl shadow-2xl lg:h-[450px]">
              <img
                src="/hero/hero1.jpg"
                alt="Promoter sharing an event on a phone"
                className="absolute inset-0 size-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="flex flex-col justify-center">
              <SectionTitle accent="Promoter" className="mb-8">
                Perks of being a
              </SectionTitle>
              <div className="space-y-6">
                {BENEFITS.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-md backdrop-blur-sm">
                      <Icon className="size-6 text-primary" aria-hidden />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-gray-900">{title}</h3>
                      <p className="font-body text-gray-600">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application */}
      <section id="apply" className="relative scroll-mt-24 overflow-hidden bg-gray-50 px-4 py-20">
        <Pattern variant={3} className="left-0 top-0 h-full w-1/2 bg-left-top opacity-20" />
        <div className="relative z-10 mx-auto max-w-2xl">
          <div className="mb-10 text-center">
            <SectionTitle accent="Promoter">Become a</SectionTitle>
            <p className="mt-4 font-body text-lg text-gray-600">
              Apply in minutes. We usually review applications within 24-48 hours.
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
            <h2 className="mb-4 font-heading text-3xl font-bold text-white">Ready to Start Earning?</h2>
            <p className="mx-auto mb-8 max-w-2xl font-body text-gray-300">
              Apply in minutes and start promoting events today. It&apos;s free to join!
            </p>
            <ButtonLink href="#apply" size="lg" className="px-8 text-lg font-bold">
              Apply Now
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
      <p className="mt-2 text-muted">Create an account or sign in, then apply to promote.</p>
      <div className="mt-6 flex justify-center gap-3">
        <ButtonLink href="/register?next=/become-promoter">Create account</ButtonLink>
        <ButtonLink href="/login?next=/become-promoter" variant="secondary">
          Sign in
        </ButtonLink>
      </div>
    </Card>
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
      pending: {
        icon: Clock,
        tone: 'bg-amber-100 text-amber-600',
        title: 'Application under review',
        body: "We're reviewing your application, usually within 24-48 hours. We'll let you know by email.",
      },
      approved: {
        icon: CheckCircle2,
        tone: 'bg-green-100 text-green-700',
        title: 'Welcome to the Promoter Program!',
        body: 'Your application is approved! You can now generate unique promo codes and start earning commissions.',
      },
      rejected: {
        icon: XCircle,
        tone: 'bg-red-100 text-red-600',
        title: 'Application not approved',
        body: profile.rejection_reason || 'No specific reason provided. Contact support for details.',
      },
      suspended: {
        icon: XCircle,
        tone: 'bg-red-100 text-red-600',
        title: 'Account suspended',
        body:
          profile.rejection_reason ||
          'Your promoter account has been temporarily suspended. Please contact support for more information.',
      },
    } as const;
    const s = states[profile.status];
    const Icon = s.icon;
    return (
      <Card className="p-6 sm:p-8">
        <div className="text-center">
          <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${s.tone}`}>
            <Icon className="size-7" aria-hidden />
          </div>
          <h2 className="mt-4 font-heading text-xl font-bold">{s.title}</h2>
          <p className="mt-2 text-muted">{s.body}</p>
        </div>

        {profile.status === 'approved' && (
          <div className="mt-6 rounded-xl bg-gray-50 p-5">
            <p className="font-semibold">What&apos;s next?</p>
            <ul className="mt-3 space-y-2 font-body text-gray-600">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-hidden />
                <span>Generate your first promo code for an event.</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="size-5 shrink-0 text-green-500" aria-hidden />
                <span>Share your code and track your earnings.</span>
              </li>
            </ul>
          </div>
        )}

        <div className="mt-6 border-t border-line pt-6">
          <h3 className="font-heading font-bold">Your Application</h3>
          <p className="text-sm text-muted">Submitted on {formatDate(profile.created_at)}</p>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-sm font-semibold text-gray-500">Display Name</dt>
              <dd className="text-gray-900">{profile.display_name}</dd>
            </div>
            {profile.social_links && (
              <div>
                <dt className="text-sm font-semibold text-gray-500">Social Media / Audience</dt>
                <dd className="whitespace-pre-wrap break-words text-gray-700">{profile.social_links}</dd>
              </div>
            )}
            {profile.bio && (
              <div>
                <dt className="text-sm font-semibold text-gray-500">Bio</dt>
                <dd className="whitespace-pre-wrap text-gray-700">{profile.bio}</dd>
              </div>
            )}
            {profile.experience && (
              <div>
                <dt className="text-sm font-semibold text-gray-500">Experience</dt>
                <dd className="whitespace-pre-wrap text-gray-700">{profile.experience}</dd>
              </div>
            )}
            {profile.payout_phone && (
              <div>
                <dt className="text-sm font-semibold text-gray-500">M-Pesa Payout Number</dt>
                <dd className="text-gray-900">{profile.payout_phone}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {profile.status === 'approved' && (
            <ButtonLink href="/promoter">
              Go to Promoter Dashboard
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          )}
          <a href="mailto:support@chach-a.com" className={buttonVariants({ variant: 'secondary' })}>
            <Mail className="size-4" aria-hidden />
            Contact Support
          </a>
        </div>
      </Card>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="font-heading text-xl font-bold">Apply to promote</h2>
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
          <Input
            id="payout_phone"
            type="tel"
            placeholder="0712 345 678"
            value={form.payout_phone}
            onChange={set('payout_phone')}
          />
        </Field>
        <Button type="submit" block size="lg" loading={apply.isPending}>
          Submit application
        </Button>
      </form>
    </Card>
  );
}
