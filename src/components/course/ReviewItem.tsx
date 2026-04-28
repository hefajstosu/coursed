import type { ContentKind, UserRole } from "@/generated/prisma/enums";

type ReviewItemProps = {
  body: string;
  createdAt: Date;
  helpfulCount: number;
  kind: keyof typeof ContentKind;
  user: { name: string | null; image: string | null; role: keyof typeof UserRole };
};

export function ReviewItem({ body, createdAt, kind, helpfulCount, user }: ReviewItemProps) {
  const isCritic = kind === "CRITIC";

  return (
    <article className="rounded-lg border border-border p-4 space-y-2">
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
      {helpfulCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Pomocna dla {helpfulCount} {helpfulCount === 1 ? "osoby" : "osób"}
        </p>
      )}
    </article>
  );
}
