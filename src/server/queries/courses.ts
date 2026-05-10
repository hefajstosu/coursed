import "server-only";
import { db } from "@/lib/db";
import {
  CourseStatus,
  CourseFormat,
  CourseLevel,
  ContentKind,
} from "@/generated/prisma/enums";
import type { ComputedRatings } from "@/lib/ratings";

export type CourseListFilters = {
  categorySlug?: string;
  categorySlugs?: string[];
  format?: keyof typeof CourseFormat;
  language?: string;
  level?: keyof typeof CourseLevel;
};

export type CourseSort = "newest" | "top-rated" | "popular";

const PER_PAGE = 20;
const SEARCH_MIN_LEN = 2;

const courseCardSelect = {
  id: true,
  slug: true,
  title: true,
  coverUrl: true,
  shortDescription: true,
  format: true,
  level: true,
  language: true,
  authorName: true,
  platformName: true,
  priceModel: true,
  cachedRatings: true,
  avgOverall: true,
  ratingsCount: true,
  categories: {
    select: {
      category: { select: { slug: true, name: true } },
    },
    take: 2,
  },
} as const;

export type CourseCardData = Awaited<ReturnType<typeof getFeaturedCourses>>[number];

export async function listCourses(
  filters: CourseListFilters,
  sort: CourseSort = "newest",
  page = 1,
) {
  const where = {
    status: CourseStatus.PUBLISHED,
    ...(filters.format && { format: filters.format }),
    ...(filters.language && { language: filters.language }),
    ...(filters.level && { level: filters.level }),
    ...(filters.categorySlugs && filters.categorySlugs.length > 0
      ? {
          categories: {
            some: { category: { slug: { in: filters.categorySlugs } } },
          },
        }
      : filters.categorySlug && {
          categories: {
            some: { category: { slug: filters.categorySlug } },
          },
        }),
  };

  const orderBy =
    sort === "top-rated"
      ? [{ avgOverall: "desc" as const }, { ratingsCount: "desc" as const }]
      : sort === "popular"
        ? [{ ratingsCount: "desc" as const }, { createdAt: "desc" as const }]
        : [{ createdAt: "desc" as const }];

  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: courseCardSelect,
    }),
    db.course.count({ where }),
  ]);

  return { courses, total, page, perPage: PER_PAGE };
}

type SearchHit = {
  id: string;
  rank: number;
  snippet: string | null;
};

export async function searchCourses(
  rawQuery: string,
  filters: CourseListFilters = {},
  page = 1,
) {
  const q = rawQuery.trim();
  if (q.length < SEARCH_MIN_LEN) {
    return { courses: [], total: 0, page, perPage: PER_PAGE, snippets: new Map<string, string>() };
  }

  const tsQuery = q
    .split(/\s+/)
    .map((tok) => tok.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((tok) => tok.length > 0)
    .map((tok) => `${tok}:*`)
    .join(" & ");

  if (!tsQuery) {
    return { courses: [], total: 0, page, perPage: PER_PAGE, snippets: new Map<string, string>() };
  }

  const offset = (page - 1) * PER_PAGE;
  const categorySlug = filters.categorySlug ?? null;
  const categorySlugs =
    filters.categorySlugs && filters.categorySlugs.length > 0 ? filters.categorySlugs : null;
  const format = filters.format ?? null;
  const language = filters.language ?? null;
  const level = filters.level ?? null;

  const hits = await db.$queryRaw<SearchHit[]>`
    SELECT
      c.id,
      ts_rank(c."searchVector", q) AS rank,
      ts_headline(
        'simple',
        coalesce(c."shortDescription", c."description", ''),
        q,
        'StartSel=«««,StopSel=»»»,MaxFragments=1,MaxWords=24,MinWords=8,ShortWord=2'
      ) AS snippet
    FROM "Course" c, to_tsquery('simple', ${tsQuery}) q
    WHERE c.status = 'PUBLISHED'
      AND c."searchVector" @@ q
      AND (${format}::text IS NULL OR c.format::text = ${format}::text)
      AND (${language}::text IS NULL OR c.language = ${language}::text)
      AND (${level}::text IS NULL OR c.level::text = ${level}::text)
      AND (
        ${categorySlugs}::text[] IS NULL
        OR EXISTS (
          SELECT 1 FROM "CourseCategory" cc
          JOIN "Category" cat ON cat.id = cc."categoryId"
          WHERE cc."courseId" = c.id AND cat.slug = ANY(${categorySlugs}::text[])
        )
      )
      AND (
        ${categorySlug}::text IS NULL
        OR EXISTS (
          SELECT 1 FROM "CourseCategory" cc
          JOIN "Category" cat ON cat.id = cc."categoryId"
          WHERE cc."courseId" = c.id AND cat.slug = ${categorySlug}::text
        )
      )
    ORDER BY rank DESC, c."ratingsCount" DESC, c."createdAt" DESC
    LIMIT ${PER_PAGE} OFFSET ${offset}
  `;

  const totalRows = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT count(*)::bigint AS count
    FROM "Course" c, to_tsquery('simple', ${tsQuery}) q
    WHERE c.status = 'PUBLISHED'
      AND c."searchVector" @@ q
      AND (${format}::text IS NULL OR c.format::text = ${format}::text)
      AND (${language}::text IS NULL OR c.language = ${language}::text)
      AND (${level}::text IS NULL OR c.level::text = ${level}::text)
      AND (
        ${categorySlugs}::text[] IS NULL
        OR EXISTS (
          SELECT 1 FROM "CourseCategory" cc
          JOIN "Category" cat ON cat.id = cc."categoryId"
          WHERE cc."courseId" = c.id AND cat.slug = ANY(${categorySlugs}::text[])
        )
      )
      AND (
        ${categorySlug}::text IS NULL
        OR EXISTS (
          SELECT 1 FROM "CourseCategory" cc
          JOIN "Category" cat ON cat.id = cc."categoryId"
          WHERE cc."courseId" = c.id AND cat.slug = ${categorySlug}::text
        )
      )
  `;

  const total = Number(totalRows[0]?.count ?? 0);

  if (hits.length === 0) {
    return { courses: [], total, page, perPage: PER_PAGE, snippets: new Map<string, string>() };
  }

  const ids = hits.map((h) => h.id);
  const found = await db.course.findMany({
    where: { id: { in: ids } },
    select: courseCardSelect,
  });

  const byId = new Map(found.map((c) => [c.id, c]));
  const courses = ids.map((id) => byId.get(id)).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const snippets = new Map(hits.map((h) => [h.id, h.snippet ?? ""]));

  return { courses, total, page, perPage: PER_PAGE, snippets };
}

export async function getFeaturedCourses(limit = 6) {
  return db.course.findMany({
    where: { status: CourseStatus.PUBLISHED, avgOverall: { not: null } },
    orderBy: [{ avgOverall: "desc" }, { ratingsCount: "desc" }],
    take: limit,
    select: courseCardSelect,
  });
}

export async function getRecentCourses(limit = 6) {
  return db.course.findMany({
    where: { status: CourseStatus.PUBLISHED },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: courseCardSelect,
  });
}

export async function getCourseBySlug(slug: string) {
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      categories: { include: { category: true } },
      ratings: { select: { value: true, kind: true } },
    },
  });

  if (!course) return null;

  // Jeśli kurs scalony — zwróć z flagą redirect
  if (course.status === CourseStatus.MERGED && course.mergedIntoId) {
    const target = await db.course.findUnique({
      where: { id: course.mergedIntoId },
      select: { slug: true },
    });
    return { ...course, redirectToSlug: target?.slug ?? null };
  }

  return { ...course, redirectToSlug: null as string | null };
}

export async function getCourseReviews(
  courseId: string,
  kind?: keyof typeof ContentKind,
) {
  const reviews = await db.review.findMany({
    where: {
      courseId,
      status: "VISIBLE",
      ...(kind && { kind }),
    },
    orderBy: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, image: true, role: true } },
    },
  });

  if (reviews.length === 0) return [];

  const ratings = await db.rating.findMany({
    where: {
      courseId,
      userId: { in: reviews.map((r) => r.userId) },
    },
    select: { userId: true, value: true },
  });
  const ratingByUser = new Map(ratings.map((r) => [r.userId, r.value]));

  return reviews.map((r) => ({
    ...r,
    rating: ratingByUser.get(r.userId) ?? null,
  }));
}

export function parseCachedRatings(raw: unknown): ComputedRatings | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as ComputedRatings;
}

export async function getCourseEmbed(slug: string) {
  return db.course.findFirst({
    where: { slug, status: CourseStatus.PUBLISHED },
    select: {
      slug: true,
      title: true,
      cachedRatings: true,
      avgOverall: true,
      ratingsCount: true,
    },
  });
}

export async function getUserCourseInteraction(courseId: string, userId: string) {
  const [rating, review, votes] = await Promise.all([
    db.rating.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: { value: true },
    }),
    db.review.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: { body: true, status: true },
    }),
    db.reviewVote.findMany({
      where: { userId, review: { courseId } },
      select: { reviewId: true, value: true },
    }),
  ]);

  return {
    userRating: rating?.value ?? null,
    userReviewBody: review?.body ?? null,
    userReviewStatus: review?.status ?? null,
    voteByReview: new Map(votes.map((v) => [v.reviewId, v.value])),
  };
}
