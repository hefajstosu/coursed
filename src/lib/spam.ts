import "server-only";
import { db } from "@/lib/db";

const URL_REGEX = /\bhttps?:\/\/\S+/gi;
const MAX_URLS = 2;
const MIN_LETTERS_FOR_CAPS_CHECK = 30;
const MAX_CAPS_RATIO = 0.6;

export type SpamCheckResult =
  | { ok: true }
  | { ok: false; reason: string };

export function spamHeuristics(body: string): SpamCheckResult {
  const urls = body.match(URL_REGEX) ?? [];
  if (urls.length > MAX_URLS) {
    return {
      ok: false,
      reason: `Opinia może zawierać maksymalnie ${MAX_URLS} linki.`,
    };
  }

  const letters = body.replace(/[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, "");
  if (letters.length >= MIN_LETTERS_FOR_CAPS_CHECK) {
    const upper = letters.replace(/[^A-ZĄĆĘŁŃÓŚŹŻ]/g, "");
    const ratio = upper.length / letters.length;
    if (ratio > MAX_CAPS_RATIO) {
      return {
        ok: false,
        reason: "Opinia ma zbyt dużo wielkich liter — używaj zwykłej pisowni.",
      };
    }
  }

  return { ok: true };
}

/**
 * Wykrywa duplikat opinii: ten sam user wkleił identyczną treść do innego kursu.
 * Trim + lowercase, ignorujemy bieżący kurs.
 */
export async function isCrossCourseDuplicate(
  userId: string,
  courseId: string,
  body: string,
): Promise<boolean> {
  const normalized = body.trim().toLowerCase();
  if (normalized.length < 30) return false;

  const existing = await db.review.findFirst({
    where: {
      userId,
      courseId: { not: courseId },
      body: { equals: body, mode: "insensitive" },
    },
    select: { id: true },
  });
  return existing !== null;
}
