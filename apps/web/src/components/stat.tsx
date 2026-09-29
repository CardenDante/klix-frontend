import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
  trend,
}: {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  trend?: number | null;
}) {
  return (
    <Card className="flex items-start gap-4 p-5">
      {Icon && (
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="truncate text-2xl font-bold tabular-nums">{value}</p>
        {(hint || (trend !== undefined && trend !== null)) && (
          <p className="mt-0.5 text-xs text-muted">
            {trend !== undefined && trend !== null && (
              <span className={cn('mr-1 font-semibold', trend >= 0 ? 'text-success' : 'text-danger')}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
              </span>
            )}
            {hint}
          </p>
        )}
      </div>
    </Card>
  );
}
