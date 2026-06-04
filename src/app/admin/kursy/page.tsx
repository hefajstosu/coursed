import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { listAdminCourses } from "@/server/queries/admin";
import { FeaturedToggle } from "@/components/admin/FeaturedToggle";
import { formatLabels, pluralPl } from "@/lib/format";

export const metadata: Metadata = { title: "Kursy" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short" });

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const courses = await listAdminCourses({
    status: status === "DRAFT" || status === "PUBLISHED" || status === "MERGED" ? status : undefined,
    q: q || undefined,
  });

  const tabs = [
    { value: undefined, label: "Wszystkie" },
    { value: "DRAFT", label: "Roboczy" },
    { value: "PUBLISHED", label: "Opublikowany" },
    { value: "MERGED", label: "Scalone" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kursy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {courses.length} {pluralPl(courses.length, ["wynik", "wyniki", "wyników"])}
            {status && ` · status: ${status}`}
            {q && ` · „${q}”`}.
          </p>
        </div>
        <Link href="/admin/kursy/nowy">
          <Button>+ Nowy kurs</Button>
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm">
          {tabs.map((t) => {
            const isActive = (status ?? undefined) === t.value;
            const params = new URLSearchParams();
            if (t.value) params.set("status", t.value);
            if (q) params.set("q", q);
            const href = `/admin/kursy${params.toString() ? `?${params.toString()}` : ""}`;
            return (
              <Link
                key={t.label}
                href={href}
                className={`rounded px-3 py-1 transition-colors ${
                  isActive ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        <form action="/admin/kursy" className="flex gap-2 ml-auto">
          {status && <input type="hidden" name="status" value={status} />}
          <input
            name="q"
            defaultValue={q}
            placeholder="Szukaj po tytule lub slug…"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
          <button
            type="submit"
            className="h-9 rounded-md border border-input px-3 text-sm hover:bg-muted"
          >
            Szukaj
          </button>
        </form>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak kursów spełniających kryteria.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Tytuł</Th>
                <Th>Status</Th>
                <Th>Forma</Th>
                <Th>Ocena</Th>
                <Th>Opinie</Th>
                <Th>Polecane</Th>
                <Th>Zaktualizowany</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {courses.map((c) => (
                <tr key={c.id} className="bg-card hover:bg-muted/30">
                  <Td>
                    <Link href={`/admin/kursy/${c.id}`} className="font-medium hover:underline">
                      {c.title}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono">/{c.slug}</div>
                  </Td>
                  <Td>
                    <StatusBadge status={c.status} />
                  </Td>
                  <Td className="text-xs">{formatLabels[c.format]}</Td>
                  <Td className="tabular-nums text-xs">
                    {c.avgOverall !== null ? `${c.avgOverall.toFixed(1)} / 10` : "—"}
                  </Td>
                  <Td className="tabular-nums text-xs">{c._count.reviews}</Td>
                  <Td>
                    <FeaturedToggle courseId={c.id} initial={c.featured} />
                  </Td>
                  <Td className="text-xs text-muted-foreground">{dateFmt.format(c.updatedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "PUBLISHED"
      ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300"
      : status === "DRAFT"
        ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium px-4 py-2.5">{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 align-middle ${className ?? ""}`}>{children}</td>;
}
