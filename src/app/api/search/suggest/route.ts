import { db } from "@/lib/db";

/** #17 Lekkie podpowiedzi do wyszukiwarki (prefix/contains po tytule i platformie). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json([]);

  const courses = await db.course.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { platformName: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ ratingsCount: "desc" }, { avgOverall: "desc" }],
    take: 6,
    select: { slug: true, title: true, platformName: true },
  });

  return Response.json(courses, { headers: { "Cache-Control": "no-store" } });
}
