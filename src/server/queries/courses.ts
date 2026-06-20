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

/** #19 Kursy oznaczone jako polecane przez redakcję. */
export async function getEditorialPicks(limit = 6) {
  return db.course.findMany({
    where: { status: CourseStatus.PUBLISHED, featured: true },
    orderBy: [{ avgOverall: "desc" }, { updatedAt: "desc" }],
    take: limit,
    select: courseCardSelect,
  });
}

/** #19 Najgorętsze opinie — widoczne, z treścią, wg pomocności. */
export async function getHotReviews(limit = 4) {
  return db.review.findMany({
    where: {
      status: "VISIBLE",
      course: { status: CourseStatus.PUBLISHED },
      body: { not: "" },
    },
    orderBy: [{ helpfulCount: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: {
      id: true,
      body: true,
      helpfulCount: true,
      createdAt: true,
      kind: true,
      user: { select: { name: true, slug: true } },
      course: { select: { slug: true, title: true } },
    },
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

export type ReviewSort = "helpful" | "newest";
export const REVIEWS_PER_PAGE = 10;

export async function getCourseReviews(
  courseId: string,
  opts: { kind?: keyof typeof ContentKind; sort?: ReviewSort; page?: number } = {},
) {
  const { kind, sort = "helpful", page = 1 } = opts;
  const where = {
    courseId,
    status: "VISIBLE" as const,
    body: { not: "" }, // oceny bez tekstu nie pojawiają się jako puste opinie
    ...(kind && { kind }),
  };

  const orderBy =
    sort === "newest"
      ? [{ createdAt: "desc" as const }]
      : [{ helpfulCount: "desc" as const }, { createdAt: "desc" as const }];

  const [reviews, total] = await Promise.all([
    db.review.findMany({
      where,
      orderBy,
      skip: (page - 1) * REVIEWS_PER_PAGE,
      take: REVIEWS_PER_PAGE,
      include: {
        user: { select: { name: true, image: true, role: true, slug: true } },
        response: {
          select: { body: true, createdAt: true, author: { select: { name: true } } },
        },
      },
    }),
    db.review.count({ where }),
  ]);

  if (reviews.length === 0) {
    return { reviews: [], total, page, perPage: REVIEWS_PER_PAGE };
  }

  const ratings = await db.rating.findMany({
    where: { courseId, userId: { in: reviews.map((r) => r.userId) } },
    select: { userId: true, value: true },
  });
  const ratingByUser = new Map(ratings.map((r) => [r.userId, r.value]));

  return {
    reviews: reviews.map((r) => ({ ...r, rating: ratingByUser.get(r.userId) ?? null })),
    total,
    page,
    perPage: REVIEWS_PER_PAGE,
  };
}

/** #6 Rozkład ocen: liczba ocen dla każdej wartości 10..1. */
export async function getRatingDistribution(courseId: string) {
  const rows = await db.rating.groupBy({
    by: ["value"],
    where: { courseId },
    _count: { value: true },
  });
  const counts = new Map(rows.map((r) => [r.value, r._count.value]));
  return Array.from({ length: 10 }, (_, i) => {
    const value = 10 - i;
    return { value, count: counts.get(value) ?? 0 };
  });
}

export function parseCachedRatings(raw: unknown): ComputedRatings | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as ComputedRatings;
}

export async function getSimilarCourses(params: {
  courseId: string;
  categoryIds: string[];
  format: keyof typeof CourseFormat;
  level: keyof typeof CourseLevel | null;
  limit?: number;
}): Promise<CourseCardData[]> {
  const { courseId, categoryIds, format, level, limit = 6 } = params;
  if (categoryIds.length === 0) return [];

  const candidates = await db.course.findMany({
    where: {
      status: CourseStatus.PUBLISHED,
      id: { not: courseId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    orderBy: [{ avgOverall: "desc" }, { ratingsCount: "desc" }],
    take: 30,
    select: {
      ...courseCardSelect,
      categories: {
        select: {
          category: { select: { id: true, slug: true, name: true } },
        },
      },
    },
  });

  const catSet = new Set(categoryIds);
  const scored = candidates.map((c) => {
    const overlap = c.categories.filter((cc) => catSet.has(cc.category.id)).length;
    let score = overlap * 10;
    if (c.format === format) score += 3;
    if (level && c.level === level) score += 2;
    score += Math.min(2, (c.ratingsCount ?? 0) / 10);
    return { c, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ c }) => ({
    ...c,
    categories: c.categories.slice(0, 2).map((cc) => ({
      category: { slug: cc.category.slug, name: cc.category.name },
    })),
  }));
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

export type UserActivityItem = {
  course: { id: string; slug: string; title: string; coverUrl: string | null };
  rating: { value: number; createdAt: Date } | null;
  review:
    | {
        id: string;
        body: string;
        status: "VISIBLE" | "HIDDEN" | "REMOVED" | "PENDING";
        createdAt: Date;
        helpfulCount: number;
        unhelpfulCount: number;
        courseId: string;
      }
    | null;
};

export async function getUserActivity(userId: string): Promise<UserActivityItem[]> {
  const [ratings, reviews] = await Promise.all([
    db.rating.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        value: true,
        createdAt: true,
        course: {
          select: { id: true, slug: true, title: true, coverUrl: true },
        },
      },
    }),
    db.review.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        body: true,
        status: true,
        createdAt: true,
        helpfulCount: true,
        unhelpfulCount: true,
        courseId: true,
      },
    }),
  ]);

  const reviewByCourse = new Map(reviews.map((r) => [r.courseId, r]));

  const items: UserActivityItem[] = ratings.map((r) => ({
    course: r.course,
    rating: { value: r.value, createdAt: r.createdAt },
    review: reviewByCourse.get(r.course.id) ?? null,
  }));

  const ratedCourseIds = new Set(ratings.map((r) => r.course.id));
  const orphanReviews = reviews.filter((rv) => !ratedCourseIds.has(rv.courseId));
  if (orphanReviews.length > 0) {
    const orphanCourses = await db.course.findMany({
      where: { id: { in: orphanReviews.map((rv) => rv.courseId) } },
      select: { id: true, slug: true, title: true, coverUrl: true },
    });
    const courseById = new Map(orphanCourses.map((c) => [c.id, c]));
    for (const rv of orphanReviews) {
      const course = courseById.get(rv.courseId);
      if (!course) continue;
      items.push({ course, rating: null, review: rv });
    }
  }

  return items.sort((a, b) => {
    const dateA = a.rating?.createdAt ?? a.review?.createdAt ?? new Date(0);
    const dateB = b.rating?.createdAt ?? b.review?.createdAt ?? new Date(0);
    return dateB.getTime() - dateA.getTime();
  });
}

export async function getFollowedCourses(userId: string) {
  const rows = await db.courseFollow.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          coverUrl: true,
          avgOverall: true,
          ratingsCount: true,
        },
      },
    },
  });
  return rows.map((r) => r.course);
}

export async function getUserCourseInteraction(courseId: string, userId: string) {
  const [rating, review, votes, follow] = await Promise.all([
    db.rating.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: {
        value: true,
        valueContent: true,
        valueInstructor: true,
        valueWorth: true,
      },
    }),
    db.review.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: { body: true, status: true },
    }),
    db.reviewVote.findMany({
      where: { userId, review: { courseId } },
      select: { reviewId: true, value: true },
    }),
    db.courseFollow.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { courseId: true },
    }),
  ]);

  return {
    userRating: rating?.value ?? null,
    userAspects: {
      content: rating?.valueContent ?? null,
      instructor: rating?.valueInstructor ?? null,
      worth: rating?.valueWorth ?? null,
    },
    isFollowing: follow !== null,
    userReviewBody: review?.body ?? null,
    userReviewStatus: review?.status ?? null,
    voteByReview: new Map(votes.map((v) => [v.reviewId, v.value])),
  };
}
