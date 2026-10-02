'use client';

import { ArrowRight, DollarSign, Share2, Sparkles, TrendingUp, Trophy } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { SectionBadge, SectionTitle } from './section-title';

const BENEFITS = [
  { icon: DollarSign, title: 'Earn Commission', description: 'Get paid a commission on every ticket sold through your code.' },
  { icon: Share2, title: 'Easy Sharing', description: 'One-click sharing to all social media.' },
  { icon: TrendingUp, title: 'Live Tracking', description: 'Monitor your clicks, sales and earnings in real-time.' },
  { icon: Trophy, title: 'Compete & Win', description: 'Climb the leaderboard and get noticed by organizers.' },
];

export function PromotersSection() {
  const { user, hydrated } = useAuth();
  const isPromoter = hydrated && user?.role === 'promoter';

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <SectionBadge icon={<Sparkles className="size-5" aria-hidden />}>Turn Events Into Income</SectionBadge>
          <SectionTitle accent="Promoter">Become a</SectionTitle>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-600">
            Share events you love and earn commission on every ticket sold through your unique code.
          </p>
        </div>

        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-6 text-primary" aria-hidden />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-gray-900">{title}</h3>
                  <p className="font-body text-gray-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="relative order-first h-96 w-full overflow-hidden rounded-2xl shadow-2xl lg:order-last lg:h-full lg:min-h-[28rem]">
            <img src="/hero/hero1.jpg" alt="Fans at a Klix event" loading="lazy" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>

        <div className="mt-16 text-center">
          <ButtonLink
            href={isPromoter ? '/promoter' : '/become-promoter'}
            size="lg"
            className="rounded-md px-10 text-lg font-bold"
          >
            {isPromoter ? 'Go to Your Dashboard' : 'Become a Promoter Today'} <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
          <p className="mt-3 font-body text-gray-600">
            {isPromoter ? 'Manage your codes and track your earnings' : 'Join over 5,000 promoters earning with Klix'}
          </p>
        </div>
      </div>
    </section>
  );
}
