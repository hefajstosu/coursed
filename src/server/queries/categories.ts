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

export async function getCategoriesTree() {
  const cats = await db.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          courses: { where: { course: { status: CourseStatus.PUBLISHED } } },
        },
      },
    },
  });

  type TreeNode = (typeof cats)[number] & { children: TreeNode[]; totalCourses: number };

  const byParent = new Map<string | null, typeof cats>();
  for (const c of cats) {
    const k = c.parentId;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(c);
  }

  const build = (parentId: string | null): TreeNode[] =>
    (byParent.get(parentId) ?? []).map((c) => {
      const children = build(c.id);
      const totalCourses =
        c._count.courses + children.reduce((sum, ch) => sum + ch.totalCourses, 0);
      return { ...c, children, totalCourses };
    });

  return build(null);
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
