import type { Metadata } from 'next';
import { CONTACT } from '@/lib/site';

export const metadata: Metadata = { title: 'Privacy Policy' };

const h2 = 'mt-8 mb-4 font-heading text-2xl font-bold text-gray-900';
const p = 'mb-4 font-body leading-relaxed text-gray-700';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-heading text-4xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mb-6 font-body text-gray-600">Last updated: 1 October 2026</p>

      <h2 className={h2}>1. Information We Collect</h2>
      <p className={p}>
        We collect information you provide directly to us when you create an account, purchase tickets, or use our
        services.
      </p>

      <h2 className={h2}>2. How We Use Your Information</h2>
      <p className={p}>
        We use the information we collect to provide, maintain, and improve our services, process transactions, and
        communicate with you.
      </p>

      <h2 className={h2}>3. Information Sharing</h2>
      <p className={p}>
        We do not sell your personal information. We may share your information with event organizers when you purchase
        tickets.
      </p>

      <h2 className={h2}>4. Data Security</h2>
      <p className={p}>
        We implement appropriate security measures to protect your personal information against unauthorized access.
      </p>

      <h2 className={h2}>5. Your Rights</h2>
      <p className={p}>You have the right to access, update, or delete your personal information at any time.</p>

      <h2 className={h2}>6. Contact Us</h2>
      <p className={p}>
        If you have questions about this Privacy Policy, please contact us at{' '}
        <a href={`mailto:${CONTACT.email}`} className="font-semibold text-primary hover:underline">
          {CONTACT.email}
        </a>
        .
      </p>
    </div>
  );
}
