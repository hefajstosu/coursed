import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Eksport danych użytkownika (RODO — prawo dostępu / przenoszenia).
 * Zwraca komplet danych konta jako plik JSON do pobrania.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const course = { select: { slug: true, title: true } } as const;

  const [user, ratings, reviews, reviewResponses, votes, reports, courseRequests, follows, claims] =
    await Promise.all([
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          slug: true,
          role: true,
          createdAt: true,
        },
      }),
      db.rating.findMany({
        where: { userId },
        select: {
          value: true,
          valueContent: true,
          valueInstructor: true,
          valueWorth: true,
          kind: true,
          createdAt: true,
          updatedAt: true,
          course,
        },
      }),
      db.review.findMany({
        where: { userId },
        select: {
          body: true,
          kind: true,
          status: true,
          verified: true,
          helpfulCount: true,
          unhelpfulCount: true,
          createdAt: true,
          updatedAt: true,
          course,
        },
      }),
      db.reviewResponse.findMany({
        where: { authorId: userId },
        select: { body: true, createdAt: true, updatedAt: true, reviewId: true },
      }),
      db.reviewVote.findMany({
        where: { userId },
        select: { value: true, createdAt: true, reviewId: true },
      }),
      db.report.findMany({
        where: { reporterId: userId },
        select: { reason: true, status: true, createdAt: true, reviewId: true },
      }),
      db.courseRequest.findMany({
        where: { createdById: userId },
        select: { title: true, url: true, status: true, createdAt: true },
      }),
      db.courseFollow.findMany({
        where: { userId },
        select: { createdAt: true, course },
      }),
      db.courseClaim.findMany({
        where: { userId },
        select: { note: true, status: true, createdAt: true, course },
      }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user,
    ratings,
    reviews,
    reviewResponses,
    reviewVotes: votes,
    reports,
    courseRequests,
    followedCourses: follows,
    courseClaims: claims,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="coursed-moje-dane-${userId}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
