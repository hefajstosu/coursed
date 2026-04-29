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
