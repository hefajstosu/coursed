export const SITE_URL = process.env.AUTH_URL ?? "http://localhost:3000";

export function absoluteUrl(path: string) {
  if (!path.startsWith("/")) return `${SITE_URL}/${path}`;
  return `${SITE_URL}${path}`;
}

/**
 * Bezpieczna serializacja danych do `<script type="application/ld+json">`.
 * JSON.stringify nie escape'uje `<`, więc wartość zawierająca `</script>`
 * pozwoliłaby wyjść z kontekstu skryptu (stored XSS). Escapujemy znaki
 * domykające tag — wynik pozostaje poprawnym JSON-em.
 */
export function jsonLdSafe(data: unknown): string {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

type Crumb = { name: string; path?: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.path ? { item: absoluteUrl(c.path) } : {}),
    })),
  };
}
