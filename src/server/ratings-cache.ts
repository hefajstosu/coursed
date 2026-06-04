import "server-only";
import { db } from "@/lib/db";
import { computeRatings } from "@/lib/ratings";
import { ContentKind } from "@/generated/prisma/enums";

/**
 * Pobiera wszystkie oceny kursu i zapisuje zaktualizowany cache:
 * cachedRatings (jsonb), avgOverall (denormalizacja dla sortu), ratingsCount.
 */
export async function recomputeCourseRatings(courseId: string) {
  const ratings = await db.rating.findMany({
    where: { courseId },
    select: {
      value: true,
      kind: true,
      valueContent: true,
      valueInstructor: true,
      valueWorth: true,
    },
  });

  const userValues = ratings.filter((r) => r.kind === ContentKind.USER).map((r) => r.value);
  const criticValues = ratings
    .filter((r) => r.kind === ContentKind.CRITIC)
    .map((r) => r.value);

  const notNull = (n: number | null): n is number => n !== null;
  const cached = computeRatings({
    userValues,
    criticValues,
    aspects: {
      content: ratings.map((r) => r.valueContent).filter(notNull),
      instructor: ratings.map((r) => r.valueInstructor).filter(notNull),
      worth: ratings.map((r) => r.valueWorth).filter(notNull),
    },
  });

  await db.course.update({
    where: { id: courseId },
    data: {
      cachedRatings: cached,
      avgOverall: cached.overall,
      ratingsCount: ratings.length,
    },
  });

  return cached;
}
