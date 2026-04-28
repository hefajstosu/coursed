import type { ContentKind, UserRole } from "@/generated/prisma/enums";
import { HelpfulButton } from "./HelpfulButton";
import { ReportButton } from "./ReportButton";

type ReviewItemProps = {
  reviewId: string;
  body: string;
  createdAt: Date;
  helpfulCount: number;
  kind: keyof typeof ContentKind;
  user: { name: string | null; image: string | null; role: keyof typeof UserRole };
  voted: boolean;
  isLoggedIn: boolean;
};

export function ReviewItem({
  reviewId,
  body,
  createdAt,
  kind,
  helpfulCount,
  user,
  voted,
  isLoggedIn,
}: ReviewItemProps) {
  const isCritic = kind === "CRITIC";

  return (
    <article className="rounded-lg border border-border p-4 space-y-3">
      <header className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{user.name ?? "Użytkownik"}</span>
          {isCritic && (
            <span className="rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase text-background">
              Krytyk
            </span>
          )}
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
        <HelpfulButton
          reviewId={reviewId}
          initialCount={helpfulCount}
          initialVoted={voted}
          isLoggedIn={isLoggedIn}
        />
        <ReportButton reviewId={reviewId} isLoggedIn={isLoggedIn} />
      </footer>
    </article>
  );
}
