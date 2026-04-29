import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  await requireRole("ADMIN", "EDITOR");

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const exclude = url.searchParams.get("exclude") ?? "";

  if (q.length < 2) return NextResponse.json([]);

  const courses = await db.course.findMany({
    where: {
      AND: [
        { id: { not: exclude || undefined } },
        { status: { not: "MERGED" } },
        {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: { id: true, title: true, slug: true, status: true },
  });

  return NextResponse.json(courses);
}
