import "server-only";
import { db } from "@/lib/db";
import { CourseStatus } from "@/generated/prisma/enums";

export async function getTopLevelCategories() {
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      children: { orderBy: { name: "asc" } },
      _count: { select: { courses: true } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: { orderBy: { name: "asc" } },
    },
  });
}

export async function getPopularCategories(limit = 6) {
  // Liczy kursy w kategorii i jej podkategoriach
  const cats = await db.category.findMany({
    include: {
      _count: {
        select: {
          courses: { where: { course: { status: CourseStatus.PUBLISHED } } },
        },
      },
    },
  });
  return cats
    .filter((c) => c._count.courses > 0)
    .sort((a, b) => b._count.courses - a._count.courses)
    .slice(0, limit);
}
