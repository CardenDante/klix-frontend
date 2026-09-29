import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-white/70">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src="/logo-white.png" alt="Klix" className="h-8 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Kenya&apos;s home for live experiences. Discover events and pay with M-Pesa in seconds.
          </p>
        </div>
        <FooterColumn
          title="Discover"
          links={[
            ['/events', 'All events'],
            ['/events?category=music', 'Music'],
            ['/events?category=conference', 'Conferences'],
            ['/events?category=comedy', 'Comedy'],
          ]}
        />
        <FooterColumn
          title="Organizers"
          links={[
            ['/become-organizer', 'Sell tickets on Klix'],
            ['/organizer', 'Organizer dashboard'],
            ['/staff/scanner', 'Ticket scanner'],
            ['/become-promoter', 'Become a promoter'],
            ['/leaderboard', 'Promoter leaderboard'],
          ]}
        />
        <FooterColumn
          title="Klix"
          links={[
            ['/about', 'About'],
            ['/pricing', 'Pricing'],
            ['/careers', 'Careers'],
            ['/contact', 'Contact & help'],
            ['/safety', 'Safety'],
            ['/terms', 'Terms'],
            ['/privacy', 'Privacy'],
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Klix. All rights reserved.</p>
          <p className="flex items-center gap-2">
            Payments by <img src="/M-PESA.png" alt="M-Pesa" className="h-4 w-auto rounded bg-white px-1" />
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="font-sans text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
