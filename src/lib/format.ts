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
