import type { Metadata } from 'next';
import { ContentPage, Section } from '@/components/content-page';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Careers', description: 'Help us connect people through unforgettable experiences.' };

const OPENINGS = [
  { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Thika, Kenya', type: 'Full-time' },
  { title: 'Marketing Manager', department: 'Marketing', location: 'Nairobi, Kenya', type: 'Full-time' },
  { title: 'Customer Support Specialist', department: 'Support', location: 'Remote', type: 'Contract' },
];

export default function CareersPage() {
  return (
    <ContentPage
      title="Build the future of events"
      intro="Join our passionate team and help us connect people through unforgettable experiences."
    >
      <Section title="Current openings">
        <div className="divide-y divide-line rounded-card border border-line bg-white">
          {OPENINGS.map((job) => (
            <div key={job.title} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-semibold text-ink">{job.title}</p>
                <p className="text-sm text-muted">
                  {job.department} · {job.location} · {job.type}
                </p>
              </div>
              <ButtonLink href={`mailto:support@chach-a.com?subject=${encodeURIComponent(`Application: ${job.title}`)}`} size="sm" variant="secondary">
                Apply
              </ButtonLink>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Don't see your role?">
        <p>We&apos;re always looking for passionate people. Send us your CV and tell us why you&apos;d be a great fit for the Klix team.</p>
        <ButtonLink href="mailto:support@chach-a.com?subject=Working%20at%20Klix">Get in touch</ButtonLink>
      </Section>
    </ContentPage>
  );
}
