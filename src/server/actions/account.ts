"use server";

import { auth, signOut } from "@/auth";
import { db } from "@/lib/db";
import { recomputeCourseRatings } from "@/server/ratings-cache";

export type DeleteAccountResult = { ok: false; error: string };

/**
 * Trwałe usunięcie konta zalogowanego użytkownika (RODO — prawo do bycia
 * zapomnianym). Kaskada bazy usuwa oceny, opinie, głosy, zgłoszenia, sesje i
 * konta OAuth; po usunięciu rekompilujemy cache ocen dotkniętych kursów.
 *
 * Zwraca błąd, gdy operacji nie można wykonać. Przy powodzeniu wylogowuje
 * i przekierowuje (signOut rzuca redirect — dlatego poza try/catch).
 */
export async function deleteAccount(): Promise<DeleteAccountResult | void> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Musisz być zalogowany." };

  const userId = session.user.id;

  // Konta redakcyjne (z dziennikiem audytu / wpisami bloga) usuwa administrator,
  // by nie utracić śladu moderacji ani treści redakcyjnych.
  if (session.user.role === "EDITOR" || session.user.role === "ADMIN") {
    return {
      ok: false,
      error: "Konta redakcyjne usuwa administrator — napisz na kontakt@coursed.pl.",
    };
  }

  // Kursy, których cache ocen trzeba przeliczyć po usunięciu ocen użytkownika.
  const ratings = await db.rating.findMany({
    where: { userId },
    select: { courseId: true },
  });
  const affectedCourseIds = [...new Set(ratings.map((r) => r.courseId))];

  await db.user.delete({ where: { id: userId } });

  for (const courseId of affectedCourseIds) {
    await recomputeCourseRatings(courseId);
  }

  await signOut({ redirectTo: "/" });
}
