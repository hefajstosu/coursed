import "server-only";
import { db } from "@/lib/db";
import { BlogPostStatus } from "@/generated/prisma/enums";

const blogCardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverUrl: true,
  publishedAt: true,
  author: { select: { name: true, image: true } },
} as const;

export async function listPublishedBlogPosts(limit = 50) {
  return db.blogPost.findMany({
    where: { status: BlogPostStatus.PUBLISHED, publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: blogCardSelect,
  });
}

export async function getBlogPostBySlug(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, status: BlogPostStatus.PUBLISHED, publishedAt: { not: null } },
    include: {
      author: { select: { name: true, image: true } },
    },
  });
}

export type BlogCardData = Awaited<ReturnType<typeof listPublishedBlogPosts>>[number];
