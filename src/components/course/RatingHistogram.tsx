import { Star } from "lucide-react";

type Bucket = { value: number; count: number };

/** #6 Rozkład ocen 1–10 — poziome słupki z udziałem procentowym. */
export function RatingHistogram({ distribution }: { distribution: Bucket[] }) {
  const total = distribution.reduce((sum, b) => sum + b.count, 0);
  if (total === 0) return null;

  const max = Math.max(...distribution.map((b) => b.count), 1);

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">Rozkład ocen</h3>
        <span className="text-xs text-muted-foreground tabular-nums">{total}</span>
      </div>
      <ul className="space-y-1.5">
        {distribution.map((b) => {
          const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
          const barWidth = (b.count / max) * 100;
          return (
            <li key={b.value} className="flex items-center gap-2 text-xs">
              <span className="inline-flex w-9 shrink-0 items-center gap-0.5 tabular-nums text-muted-foreground">
                {b.value}
                <Star className="size-3 fill-muted-foreground/50 text-muted-foreground/50" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
