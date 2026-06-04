import "server-only";
import { db } from "@/lib/db";

/** #13 Dane publicznego profilu użytkownika po slug. */
export async function getPublicProfile(slug: string) {
  const user = await db.user.findUnique({
    where: { slug },
    select: { id: true, name: true, image: true, role: true, createdAt: true },
  });
  if (!user) return null;

  const [reviews, ratingAgg] = await Promise.all([
    db.review.findMany({
      where: { userId: user.id, status: "VISIBLE" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        body: true,
        kind: true,
        verified: true,
        createdAt: true,
        helpfulCount: true,
        course: { select: { slug: true, title: true } },
      },
    }),
    db.rating.aggregate({
      where: { userId: user.id },
      _avg: { value: true },
      _count: { value: true },
    }),
  ]);

  // Dopnij ocenę użytkownika do każdej opinii (po kursie).
  const courseSlugs = reviews.map((r) => r.course.slug);
  const ratings =
    courseSlugs.length > 0
      ? await db.rating.findMany({
          where: { userId: user.id, course: { slug: { in: courseSlugs } } },
          select: { value: true, course: { select: { slug: true } } },
        })
      : [];
  const ratingBySlug = new Map(ratings.map((r) => [r.course.slug, r.value]));

  return {
    user,
    reviews: reviews.map((r) => ({ ...r, rating: ratingBySlug.get(r.course.slug) ?? null })),
    avgGiven: ratingAgg._avg.value,
    ratingsCount: ratingAgg._count.value,
  };
}
