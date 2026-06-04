import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { auth } from "@/auth";
import { getUserActivity, getFollowedCourses } from "@/server/queries/courses";
import {
  DeleteRatingButton,
  DeleteReviewButton,
} from "@/components/profile/ActivityActions";
import { AccountActions } from "@/components/profile/AccountActions";
import { cn } from "@/lib/utils";
import { pluralPl } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mój profil",
  description: "Twoje oceny i opinie wystawione na coursed.pl",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  VISIBLE: { label: "Widoczna", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  HIDDEN: { label: "Ukryta", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  REMOVED: { label: "Usunięta", tone: "bg-destructive/15 text-destructive" },
  PENDING: { label: "Oczekuje", tone: "bg-muted text-muted-foreground" },
};

export default async function ProfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/profil");

  const [items, followed] = await Promise.all([
    getUserActivity(session.user.id),
    getFollowedCourses(session.user.id),
  ]);

  const ratingCount = items.filter((it) => it.rating).length;
  const reviewCount = items.filter((it) => it.review).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Konto
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {session.user.name ?? "Mój profil"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {session.user.email} · {ratingCount} {pluralPl(ratingCount, ["ocena", "oceny", "ocen"])} ·{" "}
          {reviewCount} {pluralPl(reviewCount, ["opinia", "opinie", "opinii"])}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nie wystawiłeś jeszcze żadnej oceny ani opinii.{" "}
          <Link href="/kursy" className="text-foreground underline-offset-4 hover:underline">
            Przeglądaj kursy →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((it) => (
            <li
              key={it.course.id}
              className="rounded-lg border border-border bg-card p-4 space-y-3"
            >
              <div className="flex items-start gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded bg-muted">
                  {it.course.coverUrl ? (
                    <Image
                      src={it.course.coverUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-muted-foreground/40">
                      {it.course.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <Link
                    href={`/kursy/${it.course.slug}`}
                    className="font-medium hover:underline"
                  >
                    {it.course.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {it.rating && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-primary text-primary" />
                        <span className="tabular-nums font-semibold text-foreground">
                          {it.rating.value}/10
                        </span>
                        <span>· {formatDate(it.rating.createdAt)}</span>
                      </span>
                    )}
                    {it.review && (
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                          STATUS_LABEL[it.review.status]?.tone ?? "bg-muted",
                        )}
                      >
                        {STATUS_LABEL[it.review.status]?.label ?? it.review.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {it.review && (
                <p className="rounded border-l-2 border-border bg-muted/40 p-3 text-sm text-foreground/85 whitespace-pre-line line-clamp-4">
                  {it.review.body}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs">
                <Link
                  href={`/kursy/${it.course.slug}#opinie`}
                  className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Edytuj na stronie kursu →
                </Link>
                <div className="flex items-center gap-4">
                  {it.rating && <DeleteRatingButton courseId={it.course.id} />}
                  {it.review && <DeleteReviewButton reviewId={it.review.id} />}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {followed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Obserwowane kursy</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {followed.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kursy/${c.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-foreground/40"
                >
                  <div className="relative size-12 shrink-0 overflow-hidden rounded bg-muted">
                    {c.coverUrl ? (
                      <Image src={c.coverUrl} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground/40">
                        {c.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.title}</div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {c.avgOverall !== null
                        ? `${c.avgOverall.toFixed(1)}/10 · ${c.ratingsCount} ${pluralPl(c.ratingsCount, ["ocena", "oceny", "ocen"])}`
                        : "Brak ocen"}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3 rounded-lg border border-border p-5">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">Konto i dane</h2>
          <p className="text-sm text-muted-foreground">
            Zgodnie z RODO możesz pobrać kopię swoich danych lub trwale usunąć
            konto wraz z całą aktywnością.
          </p>
        </div>
        <AccountActions />
      </section>
    </div>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
