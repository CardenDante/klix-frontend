import type { Metadata } from 'next';
import { ContentPage, Section } from '@/components/content-page';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <ContentPage title="Terms of Service">
      <Section title="1. Acceptance of terms">
        <p>By accessing and using Klix, you accept and agree to be bound by these Terms of Service.</p>
      </Section>
      <Section title="2. User accounts">
        <p>You are responsible for maintaining the confidentiality of your account and password.</p>
      </Section>
      <Section title="3. Ticket purchases">
        <p>All ticket sales are final unless the event is cancelled or rescheduled by the organizer.</p>
      </Section>
      <Section title="4. Prohibited activities">
        <p>Users must not engage in fraudulent activities, ticket scalping, or unauthorized reselling.</p>
      </Section>
      <Section title="5. Limitation of liability">
        <p>Klix is not responsible for event cancellations, changes, or issues beyond our control.</p>
      </Section>
    </ContentPage>
  );
}
