import { BadgeCheck, CreditCard, Flag, ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/content-page';

export const metadata: Metadata = { title: 'Safety & Security' };

const ITEMS = [
  { icon: CreditCard, title: 'Secure payments', body: 'All transactions are encrypted and processed through secure M-Pesa integration.' },
  { icon: BadgeCheck, title: 'Verified organizers', body: 'All event organizers go through a verification process before hosting events on our platform.' },
  { icon: ShieldAlert, title: 'Fraud prevention', body: 'Every ticket carries a signed QR code and can only be scanned in once, and we monitor for suspicious activity.' },
  { icon: Flag, title: 'Report issues', body: 'If you encounter any safety concerns, contact us immediately at support@chach-a.com.' },
];

export default function SafetyPage() {
  return (
    <ContentPage title="Your safety is our priority" intro="At Klix, we're committed to providing a safe and secure platform for all users.">
      <div className="grid gap-4 sm:grid-cols-2">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-card border border-line bg-white p-6">
            <Icon className="size-6 text-brand-600" />
            <p className="mt-3 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </div>
        ))}
      </div>
    </ContentPage>
  );
}
