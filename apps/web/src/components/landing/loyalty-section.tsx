'use client';

import { ArrowRight, CalendarClock, Check, Coins, Gift, Percent, ShoppingCart, Sparkles } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Pattern, SectionBadge, SectionTitle } from './section-title';

const STEPS = [
  { icon: ShoppingCart, title: 'Buy Tickets', description: 'Earn credits for every purchase you make.' },
  { icon: Sparkles, title: 'Collect Credits', description: 'The more you attend, the more you earn.' },
  { icon: Gift, title: 'Get Rewards', description: 'Redeem credits for discounts at checkout.' },
];

// Matches the API's loyalty settings (apps/api/config/config.exs).
const RULES = [
  {
    icon: Coins,
    title: 'Earn',
    color: 'text-amber-600',
    points: ['1 credit for every KES 100 spent', 'Credits added as soon as you pay', 'Earn on every event'],
  },
  {
    icon: Percent,
    title: 'Redeem',
    color: 'text-primary',
    points: ['1 credit = KES 1 off', 'Pay up to 50% of an order', 'Use them at checkout'],
  },
  {
    icon: CalendarClock,
    title: 'Keep',
    color: 'text-yellow-500',
    points: ['Credits last a full year', 'Track your balance anytime', 'Free to join, always'],
  },
];

export function LoyaltySection() {
  const { user, hydrated } = useAuth();
  const signedIn = hydrated && !!user;

  return (
    <section className="relative overflow-hidden bg-orange-50/50 py-20">
      <Pattern className="right-0 top-0 h-full w-2/3 bg-right-top opacity-15" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <SectionBadge icon={<Gift className="size-5" aria-hidden />}>Klix Rewards</SectionBadge>
          <SectionTitle accent="Every Event">Get Rewarded for</SectionTitle>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-600">
            Join the Klix Loyalty Program and turn every ticket into a treat.
          </p>
        </div>

        <div className="mx-auto mb-16 grid max-w-4xl grid-cols-3 gap-4 md:gap-8">
          {STEPS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full border bg-white shadow-md">
                <Icon className="size-8 text-primary" aria-hidden />
              </div>
              <h3 className="mb-2 font-heading text-base font-bold text-gray-800 md:text-lg">{title}</h3>
              <p className="font-body text-xs text-gray-600 md:text-sm">{description}</p>
            </div>
          ))}
        </div>

        <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {RULES.map(({ icon: Icon, title, color, points }, i) => (
            <div
              key={title}
              className={`rounded-2xl border bg-white p-8 text-center shadow-xl transition-transform duration-300 hover:-translate-y-2 ${
                i === 2 ? 'border-yellow-400' : 'border-gray-200'
              }`}
            >
              <div className="mx-auto mb-4 inline-flex size-16 items-center justify-center rounded-full bg-primary/10">
                <Icon className={`size-8 ${color}`} aria-hidden />
              </div>
              <h3 className={`font-heading text-2xl font-bold ${color}`}>{title}</h3>
              <ul className="mt-6 space-y-3 text-left">
                {points.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <Check className="size-5 shrink-0 text-green-500" aria-hidden />
                    <span className="font-body text-gray-700">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center">
          <ButtonLink
            href={signedIn ? '/account/loyalty' : '/register'}
            size="lg"
            className="rounded-md px-10 text-lg font-bold"
          >
            {signedIn ? 'View My Rewards' : 'Join For Free'} <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
          <p className="mt-3 font-body text-gray-600">Start earning credits with your very first purchase.</p>
        </div>
      </div>
    </section>
  );
}
