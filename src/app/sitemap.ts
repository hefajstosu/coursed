import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, categories, blogPosts] = await Promise.all([
    db.course.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        updatedAt: true,
        avgOverall: true,
        ratingsCount: true,
      },
    }),
    db.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
        _count: {
          select: {
            courses: { where: { course: { status: "PUBLISHED" } } },
          },
        },
      },
    }),
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, publishedAt: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/kursy`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/kategorie`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/zglos-kurs`, changeFrequency: "monthly", priority: 0.4 },
  ];

  return [
    ...staticRoutes,
    ...courses.map((c) => ({
      url: `${BASE_URL}/kursy/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: coursePriority(c).changeFrequency,
      priority: coursePriority(c).priority,
    })),
    ...categories.map((c) => ({
      url: `${BASE_URL}/kategoria/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: c._count.courses > 0 ? ("weekly" as const) : ("monthly" as const),
      priority: c._count.courses === 0 ? 0.3 : c._count.courses >= 5 ? 0.7 : 0.5,
    })),
    ...blogPosts.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.publishedAt ?? p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}

function coursePriority(c: { avgOverall: number | null; ratingsCount: number }) {
  const hasRating = c.avgOverall !== null && c.ratingsCount > 0;
  const hot = hasRating && c.ratingsCount >= 5 && (c.avgOverall ?? 0) >= 7;
  if (hot) return { priority: 0.9, changeFrequency: "daily" as const };
  if (hasRating) return { priority: 0.75, changeFrequency: "weekly" as const };
  return { priority: 0.55, changeFrequency: "monthly" as const };
}
