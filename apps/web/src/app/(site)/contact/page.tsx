import { Mail, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { ContentPage, Faq, Section } from '@/components/content-page';

export const metadata: Metadata = { title: 'Contact', description: 'Get in touch with the Klix team.' };

export default function ContactPage() {
  return (
    <ContentPage title="Get in touch" intro="How can we help you?">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Phone, label: 'Call', value: '+254 796 280 700', href: 'tel:+254796280700' },
          { icon: Mail, label: 'Email', value: 'support@chach-a.com', href: 'mailto:support@chach-a.com' },
          { icon: MapPin, label: 'Visit', value: 'Thika, Kiambu County, Kenya' },
        ].map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="rounded-card border border-line bg-white p-5">
            <Icon className="size-5 text-brand-600" />
            <p className="mt-3 text-sm text-muted">{label}</p>
            {href ? (
              <a href={href} className="font-semibold hover:text-brand-600">
                {value}
              </a>
            ) : (
              <p className="font-semibold">{value}</p>
            )}
          </div>
        ))}
      </div>
      <Section title="Frequently asked questions">
        <Faq
          items={[
            ['How do I get a refund for my ticket?', 'Refund policies are set by the event organizer for each event. Contact the organizer, or email us with your order link and we will help you reach them. If an event is cancelled, you will be contacted about a refund.'],
            ['Can I change the name or details on my ticket?', 'For most events, ticket details like the attendee name cannot be changed after purchase for security reasons. Please contact the event organizer directly to ask about their policy on ticket transfers.'],
            ['How do I become an event organizer or promoter?', "We'd love to have you! Apply from the Sell tickets or Become a promoter pages. Our team reviews applications within 48 hours."],
            ["I haven't received my ticket email. What should I do?", "First, check your spam or junk folder. Your tickets are always on the order page linked from checkout, and if you bought while signed in, under My tickets."],
          ]}
        />
      </Section>
    </ContentPage>
  );
}
