import Link from "next/link";

export function Pagination({
  page,
  total,
  perPage,
  basePath,
  searchParams,
}: {
  page: number;
  total: number;
  perPage: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v) params.set(k, v);
    }
    if (p > 1) params.set("page", String(p));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const prev = page > 1 ? buildHref(page - 1) : null;
  const next = page < totalPages ? buildHref(page + 1) : null;

  return (
    <nav className="flex items-center justify-between border-t border-border pt-4 text-sm">
      <div className="text-muted-foreground">
        Strona {page} z {totalPages}
      </div>
      <div className="flex items-center gap-2">
        {prev ? (
          <Link
            href={prev}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            ← Poprzednia
          </Link>
        ) : (
          <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground">
            ← Poprzednia
          </span>
        )}
        {next ? (
          <Link
            href={next}
            className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
          >
            Następna →
          </Link>
        ) : (
          <span className="rounded-md border border-border px-3 py-1.5 text-muted-foreground">
            Następna →
          </span>
        )}
      </div>
    </nav>
  );
}
