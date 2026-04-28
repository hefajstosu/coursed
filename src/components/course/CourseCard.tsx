import Link from "next/link";
import Image from "next/image";
import { RatingBadge } from "./RatingBadge";
import { formatLabels, levelLabels, languageLabel } from "@/lib/format";
import { parseCachedRatings, type CourseCardData } from "@/server/queries/courses";

export function CourseCard({ course }: { course: CourseCardData }) {
  const ratings = parseCachedRatings(course.cachedRatings);

  return (
    <Link
      href={`/kursy/${course.slug}`}
      className="group flex flex-col rounded-lg border border-border bg-card transition-colors hover:border-foreground/20"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-lg bg-muted">
        {course.coverUrl ? (
          <Image
            src={course.coverUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground/40">
            {course.title.charAt(0)}
          </div>
        )}
        <div className="absolute right-2 top-2">
          <RatingBadge ratings={ratings} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          {course.categories.map((c) => (
            <span key={c.category.slug} className="rounded bg-muted px-1.5 py-0.5">
              {c.category.name}
            </span>
          ))}
        </div>
        <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-foreground">
          {course.title}
        </h3>
        {course.shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.shortDescription}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted-foreground">
          <span>{formatLabels[course.format]}</span>
          {course.level && <span>· {levelLabels[course.level]}</span>}
          {course.language && <span>· {languageLabel(course.language)}</span>}
          {course.priceModel && <span>· {course.priceModel}</span>}
        </div>
      </div>
    </Link>
  );
}
