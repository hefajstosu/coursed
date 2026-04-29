"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, LIMITS } from "@/lib/rate-limit";
import { ContentKind, UserRole } from "@/generated/prisma/enums";
import { recomputeCourseRatings } from "@/server/ratings-cache";
import {
  rateCourseSchema,
  addReviewSchema,
  voteReviewSchema,
  reportReviewSchema,
} from "@/schemas/courses";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

async function requireAuthUser() {
  const session = await auth();
  if (!session?.user) throw new Error("Musisz być zalogowany.");
  return session.user;
}

function kindFromRole(role: keyof typeof UserRole) {
  return role === UserRole.CRITIC || role === UserRole.EDITOR
    ? ContentKind.CRITIC
    : ContentKind.USER;
}

// ──────────────────────────────────────────────────────────────────────────
// Rate
// ──────────────────────────────────────────────────────────────────────────

export async function rateCourse(input: { courseId: string; value: number }): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();
    const data = rateCourseSchema.parse(input);

    const rl = rateLimit(`rate:${user.id}`, LIMITS.rate);
    if (!rl.ok) return { ok: false, error: "Za dużo ocen w krótkim czasie. Spróbuj później." };

    const course = await db.course.findUnique({
      where: { id: data.courseId },
      select: { id: true, slug: true, status: true },
    });
    if (!course || course.status !== "PUBLISHED") {
      return { ok: false, error: "Kurs niedostępny." };
    }

    const kind = kindFromRole(user.role);

    await db.rating.upsert({
      where: { courseId_userId: { courseId: course.id, userId: user.id } },
      create: { courseId: course.id, userId: user.id, value: data.value, kind },
      update: { value: data.value, kind },
    });

    await recomputeCourseRatings(course.id);
    revalidatePath(`/kursy/${course.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Review
// ──────────────────────────────────────────────────────────────────────────

export async function addReview(input: {
  courseId: string;
  body: string;
  value: number;
}): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();
    const data = addReviewSchema.parse(input);

    const rl = rateLimit(`review:${user.id}`, LIMITS.review);
    if (!rl.ok) return { ok: false, error: "Za dużo opinii w krótkim czasie. Spróbuj później." };

    const course = await db.course.findUnique({
      where: { id: data.courseId },
      select: { id: true, slug: true, status: true },
    });
    if (!course || course.status !== "PUBLISHED") {
      return { ok: false, error: "Kurs niedostępny." };
    }

    const kind = kindFromRole(user.role);

    await db.$transaction([
      db.rating.upsert({
        where: { courseId_userId: { courseId: course.id, userId: user.id } },
        create: { courseId: course.id, userId: user.id, value: data.value, kind },
        update: { value: data.value, kind },
      }),
      db.review.upsert({
        where: { courseId_userId: { courseId: course.id, userId: user.id } },
        create: { courseId: course.id, userId: user.id, body: data.body, kind },
        update: { body: data.body, kind },
      }),
    ]);

    await recomputeCourseRatings(course.id);
    revalidatePath(`/kursy/${course.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Vote helpful
// ──────────────────────────────────────────────────────────────────────────

export async function voteReview(input: {
  reviewId: string;
  value: 1 | -1;
}): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();
    const data = voteReviewSchema.parse(input);

    const rl = rateLimit(`vote:${user.id}`, LIMITS.vote);
    if (!rl.ok) return { ok: false, error: "Za dużo głosów w krótkim czasie." };

    const review = await db.review.findUnique({
      where: { id: data.reviewId },
      select: { id: true, courseId: true, course: { select: { slug: true } } },
    });
    if (!review) return { ok: false, error: "Opinia nie istnieje." };

    const existing = await db.reviewVote.findUnique({
      where: { reviewId_userId: { reviewId: review.id, userId: user.id } },
    });

    if (existing && existing.value === data.value) {
      // Klik tym samym → cofnij głos
      await db.$transaction([
        db.reviewVote.delete({
          where: { reviewId_userId: { reviewId: review.id, userId: user.id } },
        }),
        db.review.update({
          where: { id: review.id },
          data:
            existing.value === 1
              ? { helpfulCount: { decrement: 1 } }
              : { unhelpfulCount: { decrement: 1 } },
        }),
      ]);
    } else if (existing) {
      // Zmiana z like→dislike lub odwrotnie
      await db.$transaction([
        db.reviewVote.update({
          where: { reviewId_userId: { reviewId: review.id, userId: user.id } },
          data: { value: data.value },
        }),
        db.review.update({
          where: { id: review.id },
          data:
            data.value === 1
              ? { helpfulCount: { increment: 1 }, unhelpfulCount: { decrement: 1 } }
              : { helpfulCount: { decrement: 1 }, unhelpfulCount: { increment: 1 } },
        }),
      ]);
    } else {
      await db.$transaction([
        db.reviewVote.create({
          data: { reviewId: review.id, userId: user.id, value: data.value },
        }),
        db.review.update({
          where: { id: review.id },
          data:
            data.value === 1
              ? { helpfulCount: { increment: 1 } }
              : { unhelpfulCount: { increment: 1 } },
        }),
      ]);
    }

    revalidatePath(`/kursy/${review.course.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Report review
// ──────────────────────────────────────────────────────────────────────────

export async function reportReview(input: {
  reviewId: string;
  reason?: string;
}): Promise<ActionResult> {
  try {
    const user = await requireAuthUser();
    const data = reportReviewSchema.parse(input);

    const rl = rateLimit(`report:${user.id}`, LIMITS.report);
    if (!rl.ok) return { ok: false, error: "Za dużo zgłoszeń w krótkim czasie." };

    const review = await db.review.findUnique({
      where: { id: data.reviewId },
      select: { id: true },
    });
    if (!review) return { ok: false, error: "Opinia nie istnieje." };

    await db.report.create({
      data: { reviewId: review.id, reporterId: user.id, reason: data.reason ?? null },
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
