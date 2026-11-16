"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { sendEmail, reviewModeratedEmail } from "@/lib/mailer";

/** Odpowiadać na opinię może redakcja (ADMIN/EDITOR) lub właściciel kursu (#15). */
async function ensureCanRespond(
  reviewId: string,
): Promise<{ ok: true; userId: string; slug: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Musisz być zalogowany." };
  if (session.user.banned) return { ok: false, error: "Twoje konto zostało zawieszone." };
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { course: { select: { slug: true, ownerId: true } } },
  });
  if (!review) return { ok: false, error: "Opinia nie istnieje." };
  const isStaff = session.user.role === "ADMIN" || session.user.role === "EDITOR";
  const isOwner = review.course.ownerId === session.user.id;
  if (!isStaff && !isOwner) return { ok: false, error: "Brak uprawnień do odpowiedzi." };
  return { ok: true, userId: session.user.id, slug: review.course.slug };
}

export type ReviewActionResult = { ok: true } | { ok: false; error: string };

const setStatusSchema = z.object({
  reviewId: z.string().min(1),
  status: z.enum(["VISIBLE", "HIDDEN", "REMOVED"]),
});

const resolveReportSchema = z.object({
  reportId: z.string().min(1),
  status: z.enum(["RESOLVED", "REJECTED"]),
});

export async function setReviewStatus(input: {
  reviewId: string;
  status: "VISIBLE" | "HIDDEN" | "REMOVED";
}): Promise<ReviewActionResult> {
  try {
    const actor = await requireRole("ADMIN", "EDITOR");
    const data = setStatusSchema.parse(input);

    const before = await db.review.findUnique({
      where: { id: data.reviewId },
      select: {
        status: true,
        user: { select: { email: true } },
        course: { select: { slug: true, title: true } },
      },
    });
    if (!before) return { ok: false, error: "Opinia nie istnieje." };
    if (before.status === data.status) return { ok: true };

    await db.review.update({
      where: { id: data.reviewId },
      data: { status: data.status },
    });

    await logAudit({
      actorId: actor.id,
      action: `review.${data.status.toLowerCase()}`,
      entity: "Review",
      entityId: data.reviewId,
      diff: { from: before.status, to: data.status },
    });

    // #10 powiadom autora o ukryciu/usunięciu opinii
    if ((data.status === "HIDDEN" || data.status === "REMOVED") && before.user.email) {
      const mail = reviewModeratedEmail({
        courseTitle: before.course.title,
        courseSlug: before.course.slug,
        status: data.status,
      });
      await sendEmail({ to: before.user.email, ...mail });
    }

    revalidatePath("/admin/opinie");
    revalidatePath(`/kursy/${before.course.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

export async function resolveReport(input: {
  reportId: string;
  status: "RESOLVED" | "REJECTED";
}): Promise<ReviewActionResult> {
  try {
    const actor = await requireRole("ADMIN", "EDITOR");
    const data = resolveReportSchema.parse(input);

    const report = await db.report.findUnique({ where: { id: data.reportId } });
    if (!report) return { ok: false, error: "Zgłoszenie nie istnieje." };

    await db.report.update({
      where: { id: report.id },
      data: { status: data.status },
    });

    await logAudit({
      actorId: actor.id,
      action: `report.${data.status.toLowerCase()}`,
      entity: "Report",
      entityId: report.id,
    });

    revalidatePath("/admin/opinie");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

// ── #5 Zweryfikowana opinia ────────────────────────────────────────────────

const setVerifiedSchema = z.object({
  reviewId: z.string().min(1),
  verified: z.boolean(),
});

export async function setReviewVerified(input: {
  reviewId: string;
  verified: boolean;
}): Promise<ReviewActionResult> {
  try {
    const actor = await requireRole("ADMIN", "EDITOR");
    const data = setVerifiedSchema.parse(input);

    const before = await db.review.findUnique({
      where: { id: data.reviewId },
      select: { verified: true, course: { select: { slug: true } } },
    });
    if (!before) return { ok: false, error: "Opinia nie istnieje." };
    if (before.verified === data.verified) return { ok: true };

    await db.review.update({
      where: { id: data.reviewId },
      data: { verified: data.verified, verifiedAt: data.verified ? new Date() : null },
    });

    await logAudit({
      actorId: actor.id,
      action: data.verified ? "review.verify" : "review.unverify",
      entity: "Review",
      entityId: data.reviewId,
    });

    revalidatePath("/admin/opinie");
    revalidatePath(`/kursy/${before.course.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

// ── #8 Odpowiedź redakcji/platformy ─────────────────────────────────────────

const responseSchema = z.object({
  reviewId: z.string().min(1),
  body: z.string().min(1, "Treść nie może być pusta").max(2000),
});

export async function upsertReviewResponse(input: {
  reviewId: string;
  body: string;
}): Promise<ReviewActionResult> {
  try {
    const data = responseSchema.parse({ reviewId: input.reviewId, body: input.body?.trim() });

    const perm = await ensureCanRespond(data.reviewId);
    if (!perm.ok) return perm;

    await db.reviewResponse.upsert({
      where: { reviewId: data.reviewId },
      create: { reviewId: data.reviewId, authorId: perm.userId, body: data.body },
      update: { body: data.body, authorId: perm.userId },
    });

    await logAudit({
      actorId: perm.userId,
      action: "review.respond",
      entity: "Review",
      entityId: data.reviewId,
    });

    revalidatePath(`/kursy/${perm.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

export async function deleteReviewResponse(input: {
  reviewId: string;
}): Promise<ReviewActionResult> {
  try {
    const reviewId = String(input?.reviewId ?? "");
    if (!reviewId) return { ok: false, error: "Brak opinii." };

    const perm = await ensureCanRespond(reviewId);
    if (!perm.ok) return perm;

    const existing = await db.reviewResponse.findUnique({
      where: { reviewId },
      select: { reviewId: true },
    });
    if (!existing) return { ok: false, error: "Brak odpowiedzi." };

    await db.reviewResponse.delete({ where: { reviewId } });

    await logAudit({
      actorId: perm.userId,
      action: "review.respond.delete",
      entity: "Review",
      entityId: reviewId,
    });

    revalidatePath(`/kursy/${perm.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
