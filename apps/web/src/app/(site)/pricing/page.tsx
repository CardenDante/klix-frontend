import { Check } from 'lucide-react';
import type { Metadata } from 'next';
import { ContentPage, Faq, Section } from '@/components/content-page';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Pricing', description: 'Free to start. 2.5% per paid ticket.' };

const INCLUDED = [
  'Unlimited events and ticket types',
  'M-Pesa checkout for your buyers',
  'QR tickets and door scanning with your staff',
  'Promoter programme with tracked codes',
  'Live sales and check-in analytics',
  'Get paid into your own paybill or till',
];

export default function PricingPage() {
  return (
    <ContentPage title="Simple pricing" intro="No setup fees, no monthly costs. We only make money when you sell a ticket.">
      <div className="rounded-3xl border border-line bg-white p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Pay as you go</p>
        <p className="mt-2 font-display text-6xl font-bold">2.5%</p>
        <p className="mt-2 text-muted">per paid ticket · free events are free</p>
        <ButtonLink href="/become-organizer" size="lg" className="mt-6">
          Start selling
        </ButtonLink>
      </div>
      <Section title="Everything you need is included">
        <ul className="grid gap-2 sm:grid-cols-2">
          {INCLUDED.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success" /> {item}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Questions, answered">
        <Faq
          items={[
            ['Are there any setup fees or monthly costs?', 'Absolutely not. Klix is completely free to get started with. There are no monthly subscriptions, setup fees, or hidden charges. We only make money when you successfully sell a ticket.'],
            ['What payment methods are supported?', "We support M-Pesa, Kenya's most popular mobile payment service, for all transactions. This ensures a fast, secure, and convenient checkout experience for your attendees."],
            ['How and when do I get paid?', 'Connect your own M-Pesa paybill or till and buyers pay you directly. Otherwise, Klix collects the payments and pays you out after your event ends. You can track your earnings in real time from your organizer dashboard.'],
            ['Can I use Klix for free events?', 'Yes! Creating listings and managing RSVPs for free events is 100% free on Klix. Our platform fee only applies to paid tickets.'],
          ]}
        />
      </Section>
    </ContentPage>
  );
}
