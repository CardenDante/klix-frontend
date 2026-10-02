import { ArrowRight, BarChart3, DollarSign, Shield, Ticket, Users, Zap } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { Pattern, SectionTitle } from './section-title';

const FEATURES = [
  { icon: BarChart3, title: 'Real-Time Analytics', description: 'Track sales, revenue, and attendee data instantly.' },
  { icon: Ticket, title: 'Easy Ticket Setup', description: 'Create multiple ticket types and pricing tiers in minutes.' },
  { icon: Users, title: 'Staff Management', description: 'Add door staff who can scan and check in guests.' },
  { icon: DollarSign, title: 'Instant Payouts', description: 'Direct M-Pesa integration with transparent, low fees.' },
  { icon: Shield, title: 'Secure Payments', description: 'Signed QR tickets and fraud prevention on every sale.' },
  { icon: Zap, title: 'Quick Setup', description: "Publish your first event in under 5 minutes. It's that simple." },
];

const STATS = [
  { value: '2.5%', label: 'Platform Fee', subtext: 'Industry-leading low cost' },
  { value: '24/7', label: 'Support', subtext: 'Always available to help' },
  { value: '99.9%', label: 'Uptime', subtext: 'A reliable platform' },
];

export function OrganizersSection() {
  return (
    <section className="relative overflow-hidden bg-orange-50/50 py-20">
      <Pattern className="left-0 top-0 h-full w-1/2 bg-left-top opacity-25" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <SectionTitle accent="Organizers">Built for Event</SectionTitle>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-600">
            Everything you need to create, manage, and grow successful events.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="relative rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-primary p-0.5 shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="flex h-full flex-col rounded-[15px] bg-white/95 p-4 backdrop-blur-sm sm:p-6">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="size-6 text-primary" aria-hidden />
                </div>
                <h3 className="mb-2 font-heading text-base font-bold text-gray-900 sm:text-lg">{title}</h3>
                <p className="font-body text-xs text-gray-600 sm:text-sm">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-12 grid grid-cols-3 gap-4 text-center md:gap-8">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="gradient-text mb-1 font-heading text-4xl font-bold md:text-5xl">{s.value}</div>
              <div className="font-body text-sm font-semibold text-gray-900 md:text-lg">{s.label}</div>
              <div className="font-body text-xs text-gray-500 md:text-sm">{s.subtext}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <ButtonLink href="/become-organizer" size="lg" className="rounded-md px-10 text-lg font-bold">
            Start Organizing Events <ArrowRight className="size-5" aria-hidden />
          </ButtonLink>
          <p className="mt-3 font-body text-gray-600">Free to start • No credit card required</p>
        </div>
      </div>
    </section>
  );
}
