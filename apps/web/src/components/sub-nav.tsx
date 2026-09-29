'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/** Tab-style navigation for dashboard sections. */
export function SubNav({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 mb-8 flex gap-1 overflow-x-auto border-b border-line px-4 [scrollbar-width:none]">
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold',
              active ? 'border-brand-500 text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
