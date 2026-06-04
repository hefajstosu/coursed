"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type FollowResult =
  | { ok: true; following: boolean }
  | { ok: false; error: string };

/** #11 Przełącz obserwowanie kursu przez zalogowanego użytkownika. */
export async function toggleFollow(input: { courseId: string }): Promise<FollowResult> {
  try {
    const session = await auth();
    if (!session?.user) return { ok: false, error: "Musisz być zalogowany." };
    if (session.user.banned) return { ok: false, error: "Twoje konto zostało zawieszone." };

    const courseId = String(input?.courseId ?? "");
    if (!courseId) return { ok: false, error: "Brak kursu." };

    const userId = session.user.id;
    const existing = await db.courseFollow.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { courseId: true },
    });

    let following: boolean;
    if (existing) {
      await db.courseFollow.delete({ where: { userId_courseId: { userId, courseId } } });
      following = false;
    } else {
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { status: true },
      });
      if (!course || course.status !== "PUBLISHED") {
        return { ok: false, error: "Kurs niedostępny." };
      }
      await db.courseFollow.create({ data: { userId, courseId } });
      following = true;
    }

    revalidatePath("/profil");
    return { ok: true, following };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Nieznany błąd" };
  }
}
