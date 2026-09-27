import Link from 'next/link';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Link href="/" aria-label="Klix home">
          <img src="/logo.png" alt="Klix" className="h-8 w-auto" />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img src="/hero.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent" />
        <p className="absolute bottom-12 left-12 right-12 font-display text-3xl font-bold leading-snug text-white">
          Your next unforgettable night is one tap away.
        </p>
      </div>
    </div>
  );
}
