import { cn } from '@/lib/utils';

/**
 * A small dependency-free column chart. Values are plotted on a shared
 * scale; labels are shown under every column (keep series short).
 */
export function ColumnChart({
  data,
  format = (n) => n.toLocaleString(),
  height = 160,
  className,
}: {
  data: { label: string; value: number }[];
  format?: (n: number) => string;
  height?: number;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label="Column chart">
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full flex-1 flex-col justify-end">
            <div
              className="min-h-[2px] rounded-t-md bg-brand-400 transition-colors group-hover:bg-brand-600"
              style={{ height: `${(d.value / max) * 100}%` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-0.5 text-xs text-white group-hover:block">
              {format(d.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d) => (
          <span key={d.label} className="flex-1 truncate text-center text-[11px] text-muted">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal share bars, e.g. sales by ticket type. */
export function ShareBars({ rows }: { rows: { label: string; value: number; detail?: string }[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">{r.label}</span>
            <span className="text-muted">{r.detail ?? r.value.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full bg-ink/5">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(r.value / total) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
