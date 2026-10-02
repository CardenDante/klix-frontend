import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

/** Layout for simple text pages (legal, about, help). */
export function ContentPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-4xl font-bold">{title}</h1>
      {intro && <p className="mt-4 text-lg text-muted">{intro}</p>}
      <div className="mt-10 space-y-8">{children}</div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-sans text-xl font-bold">{title}</h2>
      <div className="mt-2 space-y-3 leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}

export function Faq({ items }: { items: [string, string][] }) {
  return (
    <div className="w-full">
      {items.map(([q, a]) => (
        <details key={q} className="group border-b border-gray-200">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-heading text-lg font-semibold text-gray-800 transition-colors marker:hidden hover:text-primary [&::-webkit-details-marker]:hidden">
            {q}
            <ChevronDown className="size-5 shrink-0 text-gray-500 transition-transform duration-200 group-open:rotate-180" aria-hidden />
          </summary>
          <p className="pb-4 font-body leading-relaxed text-gray-600">{a}</p>
        </details>
      ))}
    </div>
  );
}
