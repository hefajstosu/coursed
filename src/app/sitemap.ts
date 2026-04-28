import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, categories, blogPosts] = await Promise.all([
    db.course.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({ select: { slug: true, updatedAt: true } }),
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, publishedAt: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/kursy`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/zglos-kurs`, changeFrequency: "monthly", priority: 0.4 },
  ];

  return [
    ...staticRoutes,
    ...courses.map((c) => ({
      url: `${BASE_URL}/kursy/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...categories.map((c) => ({
      url: `${BASE_URL}/kategoria/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...blogPosts.map((p) => ({
      url: `${BASE_URL}/blog/${p.slug}`,
      lastModified: p.publishedAt ?? p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
