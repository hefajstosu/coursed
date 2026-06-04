"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { rateLimit, LIMITS } from "@/lib/rate-limit";

const schema = z.object({
  courseId: z.string().min(1),
  note: z.string().max(1000).optional(),
});

/** #15 Zgłoszenie przejęcia listingu kursu przez twórcę/platformę. */
export async function submitCourseClaim(input: {
  courseId: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Musisz być zalogowany." };
    if (session.user.banned) return { ok: false, error: "Twoje konto zostało zawieszone." };

    const rl = await rateLimit(`claim:${session.user.id}`, LIMITS.courseRequest);
    if (!rl.ok) return { ok: false, error: "Za dużo zgłoszeń. Spróbuj później." };

    const data = schema.parse({
      courseId: input.courseId,
      note: input.note?.trim() || undefined,
    });

    const course = await db.course.findUnique({
      where: { id: data.courseId },
      select: { ownerId: true, slug: true },
    });
    if (!course) return { ok: false, error: "Kurs nie istnieje." };
    if (course.ownerId) {
      return { ok: false, error: "Ten kurs ma już przypisanego właściciela." };
    }

    await db.courseClaim.upsert({
      where: { courseId_userId: { courseId: data.courseId, userId: session.user.id } },
      create: {
        courseId: data.courseId,
        userId: session.user.id,
        note: data.note ?? null,
        status: "NEW",
      },
      update: { note: data.note ?? null, status: "NEW" },
    });

    revalidatePath(`/kursy/${course.slug}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
