"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { recomputeCourseRatings } from "@/server/ratings-cache";

export type MergeResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
});

/**
 * Scala kurs `source` w `target`:
 *  - przepisuje oceny i opinie z source do target (ignoruje konflikty unique (courseId, userId))
 *  - usuwa zduplikowane Rating/Review w source
 *  - source.status = MERGED, source.mergedIntoId = target.id
 *  - rekompiluje cache ocen w target
 *  - frontend (getCourseBySlug) zwróci permanentRedirect z source.slug → target.slug
 */
export async function mergeCourses(input: { sourceId: string; targetId: string }): Promise<MergeResult> {
  try {
    const actor = await requireRole("ADMIN");
    const data = schema.parse(input);

    if (data.sourceId === data.targetId) {
      return { ok: false, error: "Kurs źródłowy i docelowy są takie same." };
    }

    const [source, target] = await Promise.all([
      db.course.findUnique({ where: { id: data.sourceId }, select: { id: true, slug: true, status: true } }),
      db.course.findUnique({ where: { id: data.targetId }, select: { id: true, slug: true, status: true } }),
    ]);

    if (!source) return { ok: false, error: "Kurs źródłowy nie istnieje." };
    if (!target) return { ok: false, error: "Kurs docelowy nie istnieje." };
    if (source.status === "MERGED") return { ok: false, error: "Kurs źródłowy już scalony." };
    if (target.status === "MERGED") return { ok: false, error: "Kurs docelowy jest scalony." };

    // Ratings: Prisma nie ma natywnego "ON CONFLICT IGNORE" dla update.
    // Strategia: usuń z source te oceny, dla których user ma już ocenę w target.
    // Pozostałe — zaktualizuj courseId na target.
    const sourceRatings = await db.rating.findMany({
      where: { courseId: source.id },
      select: { userId: true, id: true },
    });
    const targetRatingUserIds = new Set(
      (
        await db.rating.findMany({
          where: { courseId: target.id, userId: { in: sourceRatings.map((r) => r.userId) } },
          select: { userId: true },
        })
      ).map((r) => r.userId),
    );

    // Reviews: ten sam pattern
    const sourceReviews = await db.review.findMany({
      where: { courseId: source.id },
      select: { id: true, userId: true },
    });
    const targetReviewUserIds = new Set(
      (
        await db.review.findMany({
          where: { courseId: target.id, userId: { in: sourceReviews.map((r) => r.userId) } },
          select: { userId: true },
        })
      ).map((r) => r.userId),
    );

    const ratingsToDelete = sourceRatings
      .filter((r) => targetRatingUserIds.has(r.userId))
      .map((r) => r.id);
    const ratingsToMove = sourceRatings
      .filter((r) => !targetRatingUserIds.has(r.userId))
      .map((r) => r.id);

    const reviewsToDelete = sourceReviews
      .filter((r) => targetReviewUserIds.has(r.userId))
      .map((r) => r.id);
    const reviewsToMove = sourceReviews
      .filter((r) => !targetReviewUserIds.has(r.userId))
      .map((r) => r.id);

    await db.$transaction(async (tx) => {
      if (ratingsToDelete.length > 0) {
        await tx.rating.deleteMany({ where: { id: { in: ratingsToDelete } } });
      }
      if (ratingsToMove.length > 0) {
        await tx.rating.updateMany({
          where: { id: { in: ratingsToMove } },
          data: { courseId: target.id },
        });
      }
      if (reviewsToDelete.length > 0) {
        await tx.review.deleteMany({ where: { id: { in: reviewsToDelete } } });
      }
      if (reviewsToMove.length > 0) {
        await tx.review.updateMany({
          where: { id: { in: reviewsToMove } },
          data: { courseId: target.id },
        });
      }
      await tx.course.update({
        where: { id: source.id },
        data: {
          status: "MERGED",
          mergedIntoId: target.id,
          ratingsCount: 0,
          avgOverall: null,
          cachedRatings: Prisma.JsonNull,
        },
      });
    });

    // Rekompilacja cache poza transakcją (czytelniej, brak zagnieżdżonego upsertu)
    await recomputeCourseRatings(target.id);

    await logAudit({
      actorId: actor.id,
      action: "course.merge",
      entity: "Course",
      entityId: source.id,
      diff: {
        sourceSlug: source.slug,
        targetId: target.id,
        targetSlug: target.slug,
        ratingsMoved: ratingsToMove.length,
        ratingsDeleted: ratingsToDelete.length,
        reviewsMoved: reviewsToMove.length,
        reviewsDeleted: reviewsToDelete.length,
      },
    });

    revalidatePath("/admin/kursy");
    revalidatePath(`/kursy/${source.slug}`);
    revalidatePath(`/kursy/${target.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
