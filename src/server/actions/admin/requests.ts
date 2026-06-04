"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/slug";
import { sendEmail, courseRequestDecisionEmail } from "@/lib/mailer";

export type RequestActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: string };

const idSchema = z.object({ requestId: z.string().min(1) });

export async function acceptCourseRequest(input: { requestId: string }): Promise<RequestActionResult> {
  try {
    const actor = await requireRole("ADMIN", "EDITOR");
    const data = idSchema.parse(input);

    const req = await db.courseRequest.findUnique({ where: { id: data.requestId } });
    if (!req) return { ok: false, error: "Zgłoszenie nie istnieje." };
    if (req.status !== "NEW") return { ok: false, error: "Zgłoszenie zostało już rozpatrzone." };

    // Wygeneruj unikalny slug
    const base = slugify(req.title) || `kurs-${req.id.slice(0, 6)}`;
    let slug = base;
    let n = 1;
    while (await db.course.findUnique({ where: { slug }, select: { id: true } })) {
      n += 1;
      slug = `${base}-${n}`;
      if (n > 50) {
        slug = `${base}-${req.id.slice(0, 6)}`;
        break;
      }
    }

    const created = await db.$transaction(async (tx) => {
      const c = await tx.course.create({
        data: {
          title: req.title,
          slug,
          officialUrl: req.url ?? null,
          status: "DRAFT",
          format: "ONLINE",
        },
      });
      await tx.courseRequest.update({
        where: { id: req.id },
        data: { status: "ACCEPTED" },
      });
      return c;
    });

    await logAudit({
      actorId: actor.id,
      action: "course_request.accept",
      entity: "CourseRequest",
      entityId: req.id,
      diff: { courseId: created.id, slug: created.slug },
    });

    if (req.submitterEmail) {
      const mail = courseRequestDecisionEmail({ title: req.title, decision: "ACCEPTED" });
      await sendEmail({ to: req.submitterEmail, ...mail });
    }

    revalidatePath("/admin/zgloszenia");
    revalidatePath("/admin/kursy");
    return { ok: true, redirectTo: `/admin/kursy/${created.id}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}

export async function rejectCourseRequest(input: { requestId: string }): Promise<RequestActionResult> {
  try {
    const actor = await requireRole("ADMIN", "EDITOR");
    const data = idSchema.parse(input);

    const req = await db.courseRequest.findUnique({ where: { id: data.requestId } });
    if (!req) return { ok: false, error: "Zgłoszenie nie istnieje." };
    if (req.status !== "NEW") return { ok: false, error: "Zgłoszenie zostało już rozpatrzone." };

    await db.courseRequest.update({
      where: { id: req.id },
      data: { status: "REJECTED" },
    });

    await logAudit({
      actorId: actor.id,
      action: "course_request.reject",
      entity: "CourseRequest",
      entityId: req.id,
    });

    if (req.submitterEmail) {
      const mail = courseRequestDecisionEmail({ title: req.title, decision: "REJECTED" });
      await sendEmail({ to: req.submitterEmail, ...mail });
    }

    revalidatePath("/admin/zgloszenia");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
