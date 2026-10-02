import type { Metadata } from 'next';
import { CONTACT } from '@/lib/site';

export const metadata: Metadata = { title: 'Safety & Security' };

const h2 = 'mt-8 mb-4 font-heading text-2xl font-bold text-gray-900';
const p = 'mb-4 font-body leading-relaxed text-gray-700';

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 font-heading text-4xl font-bold text-gray-900">Safety &amp; Security</h1>

      <h2 className={h2}>Your Safety is Our Priority</h2>
      <p className={p}>At Klix, we&apos;re committed to providing a safe and secure platform for all users.</p>

      <h2 className={h2}>Secure Payments</h2>
      <p className={p}>All transactions are encrypted and processed through secure M-Pesa integration.</p>

      <h2 className={h2}>Verified Organizers</h2>
      <p className={p}>
        All event organizers go through a verification process before hosting events on our platform.
      </p>

      <h2 className={h2}>Fraud Prevention</h2>
      <p className={p}>
        Every ticket carries a signed QR code and can only be scanned in once, and we actively monitor for suspicious
        activity to prevent ticket fraud.
      </p>

      <h2 className={h2}>Report Issues</h2>
      <p className={p}>
        If you encounter any safety concerns, please contact us immediately at{' '}
        <a href={`mailto:${CONTACT.email}`} className="font-semibold text-primary hover:underline">
          {CONTACT.email}
        </a>
        .
      </p>
    </div>
  );
}
