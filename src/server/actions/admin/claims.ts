"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";

export type ClaimActionResult = { ok: true } | { ok: false; error: string };

const idSchema = z.object({ claimId: z.string().min(1) });

export async function approveCourseClaim(input: { claimId: string }): Promise<ClaimActionResult> {
  try {
    const actor = await requireRole("ADMIN", "EDITOR");
    const { claimId } = idSchema.parse(input);

    const claim = await db.courseClaim.findUnique({
      where: { id: claimId },
      select: { courseId: true, userId: true, status: true, course: { select: { slug: true, ownerId: true } } },
    });
    if (!claim) return { ok: false, error: "Zgłoszenie nie istnieje." };
    if (claim.status !== "NEW") return { ok: false, error: "Zgłoszenie zostało już rozpatrzone." };
    if (claim.course.ownerId) return { ok: false, error: "Kurs ma już właściciela." };

    await db.$transaction([
      db.course.update({ where: { id: claim.courseId }, data: { ownerId: claim.userId } }),
      db.courseClaim.update({ where: { id: claimId }, data: { status: "APPROVED" } }),
    ]);

    await logAudit({
      actorId: actor.id,
      action: "course.claim.approve",
      entity: "Course",
      entityId: claim.courseId,
      diff: { ownerId: claim.userId },
    });

    revalidatePath("/admin/przejecia");
    revalidatePath(`/kursy/${claim.course.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

export async function rejectCourseClaim(input: { claimId: string }): Promise<ClaimActionResult> {
  try {
    const actor = await requireRole("ADMIN", "EDITOR");
    const { claimId } = idSchema.parse(input);

    const claim = await db.courseClaim.findUnique({
      where: { id: claimId },
      select: { courseId: true, status: true },
    });
    if (!claim) return { ok: false, error: "Zgłoszenie nie istnieje." };
    if (claim.status !== "NEW") return { ok: false, error: "Zgłoszenie zostało już rozpatrzone." };

    await db.courseClaim.update({ where: { id: claimId }, data: { status: "REJECTED" } });

    await logAudit({
      actorId: actor.id,
      action: "course.claim.reject",
      entity: "CourseClaim",
      entityId: claimId,
    });

    revalidatePath("/admin/przejecia");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
