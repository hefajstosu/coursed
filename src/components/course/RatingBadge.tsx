import { cn } from "@/lib/utils";
import type { ComputedRatings } from "@/lib/ratings";

export function RatingBadge({
  ratings,
  size = "md",
}: {
  ratings: ComputedRatings | null;
  size?: "sm" | "md" | "lg";
}) {
  if (!ratings || ratings.flags.noRatings || ratings.overall === null) {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-md border border-dashed border-border text-muted-foreground",
          size === "sm" && "px-1.5 py-0.5 text-xs",
          size === "md" && "px-2 py-1 text-sm",
          size === "lg" && "px-3 py-1.5 text-base",
        )}
      >
        Brak ocen
      </div>
    );
  }

  const tone =
    ratings.overall >= 8
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
      : ratings.overall >= 6
        ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
        : "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100";

  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-1 rounded-md font-semibold tabular-nums",
        tone,
        size === "sm" && "px-1.5 py-0.5 text-xs",
        size === "md" && "px-2 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base",
      )}
      title={
        ratings.flags.singleSourceOnly
          ? "Ocena tylko z jednego źródła (użytkownicy lub krytycy)"
          : "Średnia 50/50 użytkownicy + krytycy"
      }
    >
      <span>{ratings.overall.toFixed(1)}</span>
      <span className="text-[0.7em] opacity-70">/10</span>
    </div>
  );
}
