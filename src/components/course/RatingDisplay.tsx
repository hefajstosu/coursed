import type { ComputedRatings } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import { pluralPl } from "@/lib/format";

export function RatingDisplay({ ratings }: { ratings: ComputedRatings | null }) {
  if (!ratings || ratings.flags.noRatings) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
        Ten kurs nie ma jeszcze ocen. Bądź pierwszą osobą, która oceni go po zalogowaniu.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <RatingCell
          label="Ogólna"
          value={ratings.overall}
          accent
          subline={
            ratings.flags.singleSourceOnly
              ? "tylko jeden typ ocen"
              : "średnia 50/50"
          }
        />
        <RatingCell
          label="Użytkownicy"
          value={ratings.user.avg}
          count={ratings.user.count}
          tooFew={ratings.flags.userTooFew}
        />
        <RatingCell
          label="Krytycy"
          value={ratings.critic.avg}
          count={ratings.critic.count}
          tooFew={ratings.flags.criticTooFew}
        />
      </div>

      {(ratings.flags.userTooFew || ratings.flags.criticTooFew) && (
        <p className="text-xs text-muted-foreground">
          Niektóre średnie nie są wyświetlane, ponieważ liczba ocen jest zbyt mała.
        </p>
      )}

      {ratings.aspects &&
        (ratings.aspects.content !== null ||
          ratings.aspects.instructor !== null ||
          ratings.aspects.worth !== null) && (
          <div className="space-y-2 border-t border-border pt-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Oceny szczegółowe
            </div>
            <AspectRow label="Treść" value={ratings.aspects.content} />
            <AspectRow label="Prowadzący" value={ratings.aspects.instructor} />
            <AspectRow label="Cena / jakość" value={ratings.aspects.worth} />
          </div>
        )}
    </div>
  );
}

function AspectRow({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary/70" style={{ width: `${value * 10}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-medium tabular-nums">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function RatingCell({
  label,
  value,
  count,
  accent,
  subline,
  tooFew,
}: {
  label: string;
  value: number | null;
  count?: number;
  accent?: boolean;
  subline?: string;
  tooFew?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", accent && "border-l border-border pl-3 sm:border-l-0 sm:pl-0")}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            "font-semibold tabular-nums",
            accent ? "text-3xl" : "text-xl",
            value === null && "text-muted-foreground",
          )}
        >
          {value === null ? "—" : value.toFixed(1)}
        </span>
        {value !== null && (
          <span className="text-xs text-muted-foreground">/10</span>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {tooFew
          ? `${count} ocen — za mało`
          : count !== undefined
            ? `${count} ${pluralPl(count, ["ocena", "oceny", "ocen"])}`
            : subline}
      </div>
    </div>
  );
}
