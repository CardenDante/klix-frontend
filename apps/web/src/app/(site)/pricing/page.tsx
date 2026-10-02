import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { Faq } from '@/components/content-page';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Pricing', description: 'Free to start. 2.5% per paid ticket.' };

const INCLUDED = [
  'Unlimited Events',
  'Multiple Ticket Types',
  'Real-time Analytics Dashboard',
  'Secure M-Pesa Payments',
  'Get Paid into Your Own Paybill or Till',
  'Customizable Event Page',
  'Promoter & Staff Management Tools',
  'Attendee Check-in System',
  '24/7 Customer Support',
];

const FAQ: [string, string][] = [
  [
    'Are there any setup fees or monthly costs?',
    'Absolutely not. Klix is completely free to get started with. There are no monthly subscriptions, setup fees, or hidden charges. We only make money when you successfully sell a ticket.',
  ],
  [
    'What payment methods are supported?',
    "We proudly support M-Pesa, Kenya's most popular mobile payment service, for all transactions. This ensures a fast, secure, and convenient checkout experience for your attendees.",
  ],
  [
    'How and when do I get paid?',
    'Connect your own M-Pesa paybill or till and buyers pay you directly. Otherwise, Klix collects the payments and pays you out after your event ends. You can track your earnings in real time from your organizer dashboard.',
  ],
  [
    'Can I use Klix for free events?',
    'Yes! Creating listings and managing RSVPs for free events is 100% free on Klix. Our platform fee only applies to paid tickets.',
  ],
];

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-orange-50/50 pt-16 pb-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: "url('/bckpattern2.webp')" }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
            Simple, Transparent <span className="gradient-text pr-2 font-playful font-normal">Pricing</span>
          </h1>
          <p className="mx-auto mt-4 max-w-3xl font-body text-lg text-gray-600">
            No setup fees. No monthly costs. No surprises. We only succeed when your event does.
          </p>
        </div>
      </section>

      {/* Pricing & features */}
      <section className="px-4 py-20">
        <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-2">
          <div className="lg:sticky lg:top-28">
            <div className="rounded-2xl bg-gray-900 p-8 text-center text-white shadow-2xl">
              <p className="font-body text-lg font-semibold text-primary">PAY-AS-YOU-GO</p>
              <div className="my-4">
                <span className="gradient-text font-heading text-7xl font-bold sm:text-8xl">2.5%</span>
              </div>
              <p className="font-body text-lg text-gray-300">Per ticket sold – no setup costs.</p>
              <ButtonLink
                href="/become-organizer"
                size="lg"
                block
                className="mt-8 bg-primary text-lg font-bold hover:bg-primary-dark"
              >
                Get Started For Free
              </ButtonLink>
            </div>
          </div>

          <div>
            <h2 className="mb-6 font-heading text-3xl font-bold text-gray-900">Everything You Need is Included</h2>
            <ul className="space-y-4">
              {INCLUDED.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 size-6 shrink-0 text-green-500" />
                  <span className="font-body text-lg text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
              Your Questions, <span className="gradient-text pr-2 font-playful font-normal">Answered</span>
            </h2>
          </div>
          <Faq items={FAQ} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white px-4 py-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-gray-900 p-12 text-center">
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-10"
            style={{ backgroundImage: "url('/bckpattern1.webp')", backgroundSize: '200%' }}
          />
          <div className="relative z-10">
            <h2 className="mb-4 font-heading text-3xl font-bold text-white">Ready to Start Selling?</h2>
            <p className="mx-auto mb-8 max-w-2xl font-body text-gray-300">
              Create your event and start selling tickets in minutes. It&apos;s free to join!
            </p>
            <ButtonLink
              href="/become-organizer"
              size="lg"
              className="bg-primary px-8 text-lg font-bold hover:bg-primary-dark"
            >
              Create Your Event Now
              <ArrowRight className="size-5" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
