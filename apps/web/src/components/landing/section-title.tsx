import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Section heading in the Klix style: Comfortaa text with one orange script word. */
export function SectionTitle({
  children,
  accent,
  as: Tag = 'h2',
  className,
}: {
  children?: ReactNode;
  accent: string;
  as?: 'h1' | 'h2';
  className?: string;
}) {
  return (
    <Tag className={cn('font-heading text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl', className)}>
      {children}
      {children ? ' ' : null}
      <span className="gradient-text pr-2 font-playful font-normal">{accent}</span>
    </Tag>
  );
}

/** Small orange pill above a section title. */
export function SectionBadge({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-semibold text-primary">
      {icon}
      {children}
    </div>
  );
}

/** One of the brand texture images, faded behind a section. */
export function Pattern({ variant = 2, className }: { variant?: 1 | 2 | 3; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute bg-contain bg-no-repeat', className)}
      style={{ backgroundImage: `url('/bckpattern${variant}.webp')` }}
    />
  );
}
