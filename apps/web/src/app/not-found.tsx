import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-bold text-brand-500">404</p>
      <h1 className="mt-4 text-2xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">The event may have ended or the link might be wrong.</p>
      <Link href="/events" className="mt-6 rounded-full bg-brand-500 px-5 py-2.5 font-semibold text-white hover:bg-brand-600">
        Browse events
      </Link>
    </div>
  );
}
