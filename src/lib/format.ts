import type { CourseFormat, CourseLevel, ContentKind } from "@/generated/prisma/enums";

export const formatLabels: Record<keyof typeof CourseFormat, string> = {
  ONLINE: "Online",
  OFFLINE: "Stacjonarny",
  HYBRID: "Hybrydowy",
};

export const levelLabels: Record<keyof typeof CourseLevel, string> = {
  BEGINNER: "Początkujący",
  INTERMEDIATE: "Średniozaawansowany",
  ADVANCED: "Zaawansowany",
};

export const languageLabels: Record<string, string> = {
  pl: "polski",
  en: "angielski",
  es: "hiszpański",
  de: "niemiecki",
};

export const kindLabels: Record<keyof typeof ContentKind, string> = {
  USER: "użytkownik",
  CRITIC: "krytyk",
};

export function languageLabel(code: string | null | undefined) {
  if (!code) return null;
  return languageLabels[code] ?? code;
}

/**
 * Polska pluralizacja: [mianownik l.poj., l.mn. 2–4, l.mn. 5+].
 * Reguła: 1 → [0]; końcówka 2–4 (poza 12–14) → [1]; reszta → [2].
 * np. pluralPl(n, ["ocena", "oceny", "ocen"]).
 */
export function pluralPl(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (abs === 1) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
