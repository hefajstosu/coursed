"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

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
      select: { status: true, course: { select: { slug: true } } },
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
