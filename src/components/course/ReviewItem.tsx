import Link from "next/link";
import { Star, BadgeCheck } from "lucide-react";
import type { ContentKind, UserRole } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { VoteButtons } from "./VoteButtons";
import { ReportButton } from "./ReportButton";
import { ReviewResponseForm } from "./ReviewResponseForm";

type ReviewItemProps = {
  reviewId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  helpfulCount: number;
  unhelpfulCount: number;
  rating: number | null;
  kind: keyof typeof ContentKind;
  verified: boolean;
  response: { body: string; createdAt: Date; author: { name: string | null } } | null;
  canRespond: boolean;
  user: { name: string | null; image: string | null; role: keyof typeof UserRole; slug: string | null };
  vote: 1 | -1 | null;
  isLoggedIn: boolean;
};

export function ReviewItem({
  reviewId,
  body,
  createdAt,
  updatedAt,
  kind,
  helpfulCount,
  unhelpfulCount,
  rating,
  verified,
  response,
  canRespond,
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
            {user.slug ? (
              <Link href={`/u/${user.slug}`} className="font-medium hover:underline">
                {user.name ?? "Użytkownik"}
              </Link>
            ) : (
              <span className="font-medium">{user.name ?? "Użytkownik"}</span>
            )}
            {isCritic && (
              <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase text-background">
                Krytyk
              </span>
            )}
            {verified && (
              <span
                title="Opinia zweryfikowana przez redakcję"
                className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400"
              >
                <BadgeCheck className="size-3" />
                Zweryfikowana
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
          {updatedAt.getTime() - createdAt.getTime() > 60_000 && (
            <span className="ml-1 italic">· edytowano</span>
          )}
        </time>
      </header>
      <p className="text-sm leading-relaxed whitespace-pre-line">{body}</p>
      {response && (
        <div className="rounded-md border-l-2 border-primary/50 bg-muted/40 p-3">
          <div className="mb-1 text-xs font-semibold text-foreground">
            Odpowiedź{response.author.name ? ` · ${response.author.name}` : ""}
            <time
              className="ml-2 font-normal text-muted-foreground"
              dateTime={response.createdAt.toISOString()}
            >
              {response.createdAt.toLocaleDateString("pl-PL", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
            {response.body}
          </p>
        </div>
      )}

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

      {canRespond && (
        <div className="border-t border-border pt-3">
          <ReviewResponseForm reviewId={reviewId} initialBody={response?.body ?? null} />
        </div>
      )}
    </article>
  );
}

function ReviewStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => {
          const isFull = i < value;
          return (
            <Star
              key={i}
              className={cn(
                "size-3.5",
                isFull ? "fill-primary text-primary" : "text-muted-foreground/40",
              )}
            />
          );
        })}
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {value}/10
      </span>
    </div>
  );
}
