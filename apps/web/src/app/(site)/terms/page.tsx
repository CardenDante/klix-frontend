import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

const h2 = 'mt-8 mb-4 font-heading text-2xl font-bold text-gray-900';
const p = 'mb-4 font-body leading-relaxed text-gray-700';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-heading text-4xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mb-6 font-body text-gray-600">Last updated: 1 October 2026</p>

      <h2 className={h2}>1. Acceptance of Terms</h2>
      <p className={p}>By accessing and using Klix, you accept and agree to be bound by these Terms of Service.</p>

      <h2 className={h2}>2. User Accounts</h2>
      <p className={p}>You are responsible for maintaining the confidentiality of your account and password.</p>

      <h2 className={h2}>3. Ticket Purchases</h2>
      <p className={p}>All ticket sales are final unless the event is cancelled or rescheduled by the organizer.</p>

      <h2 className={h2}>4. Prohibited Activities</h2>
      <p className={p}>Users must not engage in fraudulent activities, ticket scalping, or unauthorized reselling.</p>

      <h2 className={h2}>5. Limitation of Liability</h2>
      <p className={p}>Klix is not responsible for event cancellations, changes, or issues beyond our control.</p>
    </div>
  );
}
