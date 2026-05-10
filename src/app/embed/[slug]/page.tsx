import { notFound } from "next/navigation";
import { getCourseEmbed, parseCachedRatings } from "@/server/queries/courses";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

type PageProps = { params: Promise<{ slug: string }> };

export const metadata = {
  robots: { index: false, follow: false },
};

function fmt(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1).replace(".", ",");
}

export default async function EmbedBadgePage({ params }: PageProps) {
  const { slug } = await params;
  const course = await getCourseEmbed(slug);
  if (!course) notFound();

  const ratings = parseCachedRatings(course.cachedRatings);
  const url = absoluteUrl(`/kursy/${course.slug}`);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener"
      className="block h-full w-full bg-background p-3 no-underline"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <div className="flex h-full items-center gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:border-foreground/40">
        <div className="flex shrink-0 flex-col items-center justify-center rounded-md bg-foreground px-3 py-2 text-background">
          <span className="text-2xl font-semibold leading-none tabular-nums">
            {fmt(ratings?.overall ?? null)}
          </span>
          <span className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">/ 10</span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-foreground">
            {course.title}
          </span>
          <span className="mt-0.5 text-xs text-muted-foreground">
            {course.ratingsCount} {course.ratingsCount === 1 ? "ocena" : course.ratingsCount >= 2 && course.ratingsCount <= 4 ? "oceny" : "ocen"}
            {ratings?.user.avg !== null && ratings?.user.avg !== undefined && (
              <> · użytkownicy {fmt(ratings.user.avg)}</>
            )}
            {ratings?.critic.avg !== null && ratings?.critic.avg !== undefined && (
              <> · krytycy {fmt(ratings.critic.avg)}</>
            )}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            coursed.pl
          </span>
        </div>
      </div>
    </a>
  );
}
