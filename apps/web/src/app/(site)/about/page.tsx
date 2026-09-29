import type { Metadata } from 'next';
import { ContentPage, Section } from '@/components/content-page';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'About', description: 'Connecting people through experiences.' };

const VALUES = [
  ['Simplicity', 'We believe technology should be intuitive. Our platform is designed to be easy for everyone, from first-time ticket buyers to seasoned event organizers.'],
  ['Trust', 'Security and transparency are at our core. We protect your data, ensure secure payments, and maintain honest communication with our community.'],
  ['Community', "We're building a platform for everyone. We support diverse voices and celebrate the unique experiences that bring people together."],
];

export default function AboutPage() {
  return (
    <ContentPage
      title="Connecting people through experiences"
      intro="Klix was founded with a simple vision: to bridge the gap between amazing events and the people who want to experience them."
    >
      <img src="/about.jpg" alt="Happy people at an event" className="aspect-[16/8] w-full rounded-3xl object-cover" />
      <Section title="Our mission">
        <p>
          We&apos;re building more than just a ticketing platform – we&apos;re creating a community where organizers can thrive,
          promoters can succeed, and attendees can discover unforgettable moments.
        </p>
        <p>
          <strong>For attendees:</strong> to make finding and attending events simple, secure, and rewarding.
        </p>
        <p>
          <strong>For organizers:</strong> to provide powerful, easy-to-use tools that help events of all sizes succeed.
        </p>
      </Section>
      <Section title="Our core values">
        <div className="grid gap-4 sm:grid-cols-3">
          {VALUES.map(([title, body]) => (
            <div key={title} className="rounded-card border border-line bg-white p-5">
              <p className="font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Join our journey">
        <p>
          We&apos;re a passionate team building the future of event experiences in Kenya. If you&apos;re excited by our mission,
          we&apos;d love to hear from you.
        </p>
        <ButtonLink href="/careers" variant="secondary">
          View open positions
        </ButtonLink>
      </Section>
    </ContentPage>
  );
}
