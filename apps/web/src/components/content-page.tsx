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
    <div className="divide-y divide-line rounded-card border border-line bg-white">
      {items.map(([q, a]) => (
        <details key={q} className="group px-5 py-4">
          <summary className="cursor-pointer list-none font-semibold marker:hidden">
            <span className="flex items-center justify-between gap-4">
              {q}
              <span className="text-muted transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
        </details>
      ))}
    </div>
  );
}
