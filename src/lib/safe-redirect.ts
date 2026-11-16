/**
 * Akceptuje tylko ścieżki wewnętrzne — ochrona przed open-redirect.
 * Odrzuca adresy absolutne (`https://…`), protocol-relative (`//evil.com`)
 * oraz warianty z backslashem (`/\evil.com`), które przeglądarki normalizują do `//`.
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  const v = typeof value === "string" ? value : "";
  if (v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\")) return v;
  return fallback;
}
