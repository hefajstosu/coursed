import { Star } from "lucide-react";
import type { ContentKind, UserRole } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { VoteButtons } from "./VoteButtons";
import { ReportButton } from "./ReportButton";

type ReviewItemProps = {
  reviewId: string;
  body: string;
  createdAt: Date;
  helpfulCount: number;
  unhelpfulCount: number;
  rating: number | null;
  kind: keyof typeof ContentKind;
  user: { name: string | null; image: string | null; role: keyof typeof UserRole };
  vote: 1 | -1 | null;
  isLoggedIn: boolean;
};

export function ReviewItem({
  reviewId,
  body,
  createdAt,
  kind,
  helpfulCount,
  unhelpfulCount,
  rating,
  user,
  vote,
  isLoggedIn,
}: ReviewItemProps) {
  const isCritic = kind === "CRITIC";

  return (
    <article className="rounded-lg border border-border p-4 space-y-3">
      <header className="flex items-start justify-between gap-3 text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name ?? "Użytkownik"}</span>
            {isCritic && (
              <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase text-background">
                Krytyk
              </span>
            )}
          </div>
          {rating !== null && <ReviewStars value={rating} />}
        </div>
        <time className="text-xs text-muted-foreground" dateTime={createdAt.toISOString()}>
          {createdAt.toLocaleDateString("pl-PL", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </header>
      <p className="text-sm leading-relaxed whitespace-pre-line">{body}</p>
      <footer className="flex items-center gap-2">
        <VoteButtons
          reviewId={reviewId}
          initialHelpful={helpfulCount}
          initialUnhelpful={unhelpfulCount}
          initialVote={vote}
          isLoggedIn={isLoggedIn}
        />
        <ReportButton reviewId={reviewId} isLoggedIn={isLoggedIn} />
      </footer>
    </article>
  );
}

function ReviewStars({ value }: { value: number }) {
  // Skala 1–10 → 5 gwiazdek (każda gwiazdka = 2 pkt). Wypełnienie połówkowe.
  const full = Math.floor(value / 2);
  const half = value % 2 === 1;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const isFull = i < full;
          const isHalf = i === full && half;
          return (
            <span key={i} className="relative inline-flex">
              <Star
                className={cn(
                  "size-3.5",
                  isFull ? "fill-primary text-primary" : "text-muted-foreground/40",
                )}
              />
              {isHalf && (
                <Star
                  className="absolute inset-0 size-3.5 fill-primary text-primary"
                  style={{ clipPath: "inset(0 50% 0 0)" }}
                />
              )}
            </span>
          );
        })}
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {value}/10
      </span>
    </div>
  );
}
