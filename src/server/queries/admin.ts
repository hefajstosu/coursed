import "server-only";
import { db } from "@/lib/db";

export async function listAdminCourses(filter: { status?: "DRAFT" | "PUBLISHED" | "MERGED"; q?: string }) {
  return db.course.findMany({
    where: {
      ...(filter.status && { status: filter.status }),
      ...(filter.q && {
        OR: [
          { title: { contains: filter.q, mode: "insensitive" } },
          { slug: { contains: filter.q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      featured: true,
      format: true,
      coverUrl: true,
      avgOverall: true,
      ratingsCount: true,
      updatedAt: true,
      _count: { select: { reviews: true } },
    },
  });
}

export async function getAdminCourse(id: string) {
  return db.course.findUnique({
    where: { id },
    include: {
      categories: { select: { categoryId: true } },
    },
  });
}

export async function listFlatCategories() {
  const cats = await db.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    include: { parent: { select: { name: true } } },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    parentName: c.parent?.name ?? null,
  }));
}
