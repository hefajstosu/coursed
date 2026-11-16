import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short" });

const TABS = [
  { value: undefined, label: "Wszystkie" },
  { value: "DRAFT", label: "Roboczy" },
  { value: "PUBLISHED", label: "Opublikowany" },
] as const;

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN", "EDITOR");
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;

  const posts = await db.blogPost.findMany({
    where:
      status === "DRAFT" || status === "PUBLISHED"
        ? { status }
        : undefined,
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: {
      author: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">{posts.length} wpis(y).</p>
        </div>
        <Link href="/admin/blog/nowy">
          <Button>+ Nowy wpis</Button>
        </Link>
      </header>

      <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm w-fit">
        {TABS.map((t) => {
          const isActive = (status ?? undefined) === t.value;
          const href = t.value ? `/admin/blog?status=${t.value}` : "/admin/blog";
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

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak wpisów.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Tytuł</Th>
                <Th>Autor</Th>
                <Th>Status</Th>
                <Th>Opublikowano</Th>
                <Th>Edytowano</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((p) => (
                <tr key={p.id} className="bg-card hover:bg-muted/30">
                  <Td>
                    <Link href={`/admin/blog/${p.id}`} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground font-mono">/{p.slug}</div>
                  </Td>
                  <Td className="text-xs">{p.author.name ?? p.author.email}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td className="text-xs text-muted-foreground">
                    {p.publishedAt ? dateFmt.format(p.publishedAt) : "—"}
                  </Td>
                  <Td className="text-xs text-muted-foreground">{dateFmt.format(p.updatedAt)}</Td>
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
      : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300";
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
