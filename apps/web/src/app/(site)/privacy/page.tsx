import type { Metadata } from 'next';
import { ContentPage, Section } from '@/components/content-page';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <ContentPage title="Privacy Policy">
      <Section title="1. Information we collect">
        <p>We collect information you provide directly to us when you create an account, purchase tickets, or use our services.</p>
      </Section>
      <Section title="2. How we use your information">
        <p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>
      </Section>
      <Section title="3. Information sharing">
        <p>We do not sell your personal information. We may share your information with event organizers when you purchase tickets.</p>
      </Section>
      <Section title="4. Data security">
        <p>We implement appropriate security measures to protect your personal information against unauthorized access.</p>
      </Section>
      <Section title="5. Your rights">
        <p>You have the right to access, update, or delete your personal information at any time.</p>
      </Section>
      <Section title="6. Contact us">
        <p>
          If you have questions about this Privacy Policy, please contact us at{' '}
          <a href="mailto:support@chach-a.com" className="text-brand-600 underline">support@chach-a.com</a>.
        </p>
      </Section>
    </ContentPage>
  );
}
