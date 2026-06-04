import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";
import { getPublicProfile } from "@/server/queries/users";
import { pluralPl } from "@/lib/format";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) return { title: "Profil" };
  const name = profile.user.name ?? "Użytkownik";
  return {
    title: `${name} — profil`,
    description: `Opinie i oceny użytkownika ${name} na coursed.pl.`,
    alternates: { canonical: `/u/${slug}` },
  };
}

const dateFmt = new Intl.DateTimeFormat("pl-PL", { year: "numeric", month: "long" });

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);
  if (!profile) notFound();

  const { user, reviews, avgGiven, ratingsCount } = profile;
  const isCritic = user.role === "CRITIC" || user.role === "EDITOR" || user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <header className="flex items-center gap-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
          {user.image ? (
            <Image src={user.image} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground/40">
              {(user.name ?? "U").charAt(0)}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {user.name ?? "Użytkownik"}
            </h1>
            {isCritic && (
              <span className="inline-flex items-center gap-1 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold uppercase text-background">
                <BadgeCheck className="size-3" />
                Krytyk
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            W coursed.pl od {dateFmt.format(user.createdAt)}
            {avgGiven !== null && (
              <>
                {" · "}
                średnia ocena {avgGiven.toFixed(1)}/10 ·{" "}
                {ratingsCount} {pluralPl(ratingsCount, ["ocena", "oceny", "ocen"])}
              </>
            )}
          </p>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">
          Opinie {reviews.length > 0 && <span className="font-normal text-muted-foreground">({reviews.length})</span>}
        </h2>

        {reviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Ten użytkownik nie opublikował jeszcze żadnej opinii.
          </div>
        ) : (
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/kursy/${r.course.slug}`}
                    className="font-medium hover:underline"
                  >
                    {r.course.title}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {r.verified && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                        <BadgeCheck className="size-3" /> Zweryfikowana
                      </span>
                    )}
                    {r.rating !== null && (
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <Star className="size-3.5 fill-primary text-primary" />
                        {r.rating}/10
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85 line-clamp-4">
                  {r.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
