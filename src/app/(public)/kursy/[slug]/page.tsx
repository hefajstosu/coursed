import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect, permanentRedirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RatingDisplay } from "@/components/course/RatingDisplay";
import { ReviewItem } from "@/components/course/ReviewItem";
import { RatingForm } from "@/components/course/RatingForm";
import { ReviewForm } from "@/components/course/ReviewForm";
import { EmbedSnippet } from "@/components/course/EmbedSnippet";
import { CourseCard } from "@/components/course/CourseCard";
import { RatingHistogram } from "@/components/course/RatingHistogram";
import { FollowButton } from "@/components/course/FollowButton";
import { ClaimButton } from "@/components/course/ClaimButton";
import { Pagination } from "@/components/site/Pagination";
import {
  getCourseBySlug,
  getCourseReviews,
  getRatingDistribution,
  getSimilarCourses,
  getUserCourseInteraction,
  parseCachedRatings,
  type ReviewSort,
} from "@/server/queries/courses";
import { formatLabels, levelLabels, languageLabel } from "@/lib/format";
import { absoluteUrl, breadcrumbJsonLd, SITE_URL } from "@/lib/seo";
import { auth } from "@/auth";
import type { ContentKind } from "@/generated/prisma/enums";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || course.redirectToSlug) return { title: "Kurs" };

  return {
    title: course.title,
    description: course.shortDescription ?? `Opinie i oceny kursu ${course.title} na coursed.pl`,
    alternates: { canonical: `/kursy/${course.slug}` },
    openGraph: {
      title: course.title,
      description: course.shortDescription ?? undefined,
      type: "article",
      url: `/kursy/${course.slug}`,
    },
  };
}

function parseReviewFilter(raw: string | undefined): keyof typeof ContentKind | undefined {
  if (raw === "user") return "USER";
  if (raw === "critic") return "CRITIC";
  return undefined;
}

export default async function CoursePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  if (course.redirectToSlug) {
    permanentRedirect(`/kursy/${course.redirectToSlug}`);
  }

  if (course.status !== "PUBLISHED") {
    redirect("/kursy");
  }

  const reviewFilterRaw = typeof sp.reviews === "string" ? sp.reviews : undefined;
  const reviewKind = parseReviewFilter(reviewFilterRaw);
  const reviewSort: ReviewSort = sp.sort === "newest" ? "newest" : "helpful";
  const reviewPage = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  const [reviewData, session, similar, distribution] = await Promise.all([
    getCourseReviews(course.id, { kind: reviewKind, sort: reviewSort, page: reviewPage }),
    auth(),
    getSimilarCourses({
      courseId: course.id,
      categoryIds: course.categories.map((cc) => cc.category.id),
      format: course.format,
      level: course.level,
      limit: 6,
    }),
    getRatingDistribution(course.id),
  ]);
  const { reviews, total: reviewsTotal, perPage: reviewsPerPage } = reviewData;

  const isLoggedIn = !!session?.user;
  const isOwner = !!session?.user && course.ownerId === session.user.id;
  const canRespond =
    session?.user?.role === "EDITOR" || session?.user?.role === "ADMIN" || isOwner;
  const interaction = isLoggedIn
    ? await getUserCourseInteraction(course.id, session.user.id)
    : null;

  const ratings = parseCachedRatings(course.cachedRatings);

  const topReviews = reviews
    .filter((r) => r.body && r.body.trim().length > 0)
    .slice(0, 3)
    .map((r) => ({
      "@type": "Review" as const,
      author: { "@type": "Person", name: r.user.name ?? "Anonimowy" },
      datePublished: r.createdAt.toISOString(),
      reviewBody: r.body,
      ...(r.rating !== null
        ? {
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 10,
              worstRating: 1,
            },
          }
        : {}),
    }));

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.shortDescription ?? course.description ?? undefined,
    provider: course.platformName
      ? { "@type": "Organization", name: course.platformName }
      : undefined,
    aggregateRating:
      ratings && ratings.overall !== null
        ? {
            "@type": "AggregateRating",
            ratingValue: ratings.overall,
            bestRating: 10,
            worstRating: 1,
            ratingCount:
              (ratings.user.count ?? 0) + (ratings.critic.count ?? 0),
          }
        : undefined,
    ...(topReviews.length > 0 ? { review: topReviews } : {}),
  };

  const similarItemList =
    similar.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Podobne kursy do: ${course.title}`,
          itemListElement: similar.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(`/kursy/${s.slug}`),
            name: s.title,
          })),
        }
      : null;

  const primaryCategory = course.categories[0]?.category;
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Strona główna", path: "/" },
    { name: "Kursy", path: "/kursy" },
    ...(primaryCategory
      ? [{ name: primaryCategory.name, path: `/kategoria/${primaryCategory.slug}` }]
      : []),
    { name: course.title },
  ]);

  return (
    <article className="mx-auto max-w-6xl px-4 py-10 grid gap-8 lg:grid-cols-[1fr_320px]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {similarItemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(similarItemList) }}
        />
      )}

      <div className="space-y-8">
        <header className="space-y-4">
          <nav className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {course.categories.map((cc) => (
              <Link
                key={cc.category.slug}
                href={`/kategoria/${cc.category.slug}`}
                className="rounded bg-muted px-2 py-0.5 hover:text-foreground"
              >
                {cc.category.name}
              </Link>
            ))}
          </nav>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            {course.title}
          </h1>
          {course.shortDescription && (
            <p className="text-lg text-muted-foreground">{course.shortDescription}</p>
          )}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
            <Field label="Forma" value={formatLabels[course.format]} />
            {course.level && <Field label="Poziom" value={levelLabels[course.level]} />}
            {course.language && (
              <Field label="Język" value={languageLabel(course.language) ?? ""} />
            )}
            {course.platformName && <Field label="Platforma" value={course.platformName} />}
            {course.authorName && <Field label="Autor" value={course.authorName} />}
            {course.priceModel && <Field label="Cena" value={course.priceModel} />}
            {course.location && <Field label="Lokalizacja" value={course.location} />}
            <Field label="Certyfikat" value={course.hasCertificate ? "Tak" : "Nie"} />
          </dl>
        </header>

        {course.coverUrl && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted">
            <Image
              src={course.coverUrl}
              alt={course.title}
              fill
              sizes="(max-width: 1024px) 100vw, 800px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {course.description && (
          <section className="prose prose-zinc dark:prose-invert max-w-none">
            <h2 className="text-xl font-semibold tracking-tight not-prose">Opis kursu</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90 mt-3">
              {course.description}
            </p>
          </section>
        )}

        <section id="opinie" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Opinie {reviewsTotal > 0 && <span className="text-muted-foreground font-normal">({reviewsTotal})</span>}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <ReviewSortTabs slug={slug} kind={reviewFilterRaw} active={reviewSort} />
              <ReviewFilterTabs slug={slug} active={reviewFilterRaw} sort={reviewSort} />
            </div>
          </div>
          <ReviewForm
            courseId={course.id}
            initialBody={interaction?.userReviewBody ?? null}
            initialRating={interaction?.userRating ?? null}
            initialAspects={interaction?.userAspects}
            isLoggedIn={isLoggedIn}
          />

          {reviewsTotal === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
              Brak opinii spełniających wybrany filtr.
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {reviews.map((r) => {
                  const v = interaction?.voteByReview.get(r.id);
                  return (
                    <ReviewItem
                      key={r.id}
                      reviewId={r.id}
                      body={r.body}
                      createdAt={r.createdAt}
                      updatedAt={r.updatedAt}
                      helpfulCount={r.helpfulCount}
                      unhelpfulCount={r.unhelpfulCount}
                      rating={r.rating}
                      kind={r.kind}
                      verified={r.verified}
                      response={r.response}
                      canRespond={canRespond}
                      user={r.user}
                      vote={v === 1 ? 1 : v === -1 ? -1 : null}
                      isLoggedIn={isLoggedIn}
                    />
                  );
                })}
              </div>
              <Pagination
                page={reviewPage}
                total={reviewsTotal}
                perPage={reviewsPerPage}
                basePath={`/kursy/${slug}`}
                searchParams={{
                  reviews: reviewFilterRaw,
                  sort: reviewSort === "helpful" ? undefined : reviewSort,
                }}
              />
            </>
          )}
        </section>

        {similar.length > 0 && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight">Podobne kursy</h2>
              {primaryCategory && (
                <Link
                  href={`/kategoria/${primaryCategory.slug}`}
                  className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Wszystkie w „{primaryCategory.name}” →
                </Link>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {similar.map((s) => (
                <CourseCard key={s.id} course={s} />
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <RatingDisplay ratings={ratings} />

        <RatingHistogram distribution={distribution} />

        <div className="rounded-lg border border-border p-4">
          <RatingForm
            courseId={course.id}
            initialValue={interaction?.userRating ?? null}
            isLoggedIn={isLoggedIn}
          />
        </div>

        <FollowButton
          courseId={course.id}
          initialFollowing={interaction?.isFollowing ?? false}
          isLoggedIn={isLoggedIn}
        />

        {isLoggedIn && !course.ownerId && <ClaimButton courseId={course.id} />}

        {course.officialUrl && (
          <a
            href={course.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg" }), "w-full")}
          >
            Przejdź do kursu →
          </a>
        )}

        <EmbedSnippet slug={course.slug} siteUrl={SITE_URL} />
      </aside>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function reviewsHref(
  slug: string,
  params: { reviews?: string; sort?: ReviewSort },
) {
  const sp = new URLSearchParams();
  if (params.reviews) sp.set("reviews", params.reviews);
  if (params.sort && params.sort !== "helpful") sp.set("sort", params.sort);
  const qs = sp.toString();
  return qs ? `/kursy/${slug}?${qs}#opinie` : `/kursy/${slug}#opinie`;
}

function ReviewFilterTabs({
  slug,
  active,
  sort,
}: {
  slug: string;
  active: string | undefined;
  sort: ReviewSort;
}) {
  const tabs = [
    { value: undefined, label: "Wszystkie" },
    { value: "user", label: "Użytkownicy" },
    { value: "critic", label: "Krytycy" },
  ];
  return (
    <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm">
      {tabs.map((t) => {
        const isActive = (active ?? undefined) === t.value;
        return (
          <Link
            key={t.label}
            href={reviewsHref(slug, { reviews: t.value, sort })}
            className={`rounded px-3 py-1 transition-colors ${
              isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
            scroll={false}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

function ReviewSortTabs({
  slug,
  kind,
  active,
}: {
  slug: string;
  kind: string | undefined;
  active: ReviewSort;
}) {
  const tabs: { value: ReviewSort; label: string }[] = [
    { value: "helpful", label: "Najtrafniejsze" },
    { value: "newest", label: "Najnowsze" },
  ];
  return (
    <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm">
      {tabs.map((t) => {
        const isActive = active === t.value;
        return (
          <Link
            key={t.value}
            href={reviewsHref(slug, { reviews: kind, sort: t.value })}
            className={`rounded px-3 py-1 transition-colors ${
              isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
            scroll={false}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
