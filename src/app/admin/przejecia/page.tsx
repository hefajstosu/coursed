import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ClaimActions } from "@/components/admin/ClaimActions";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Przejęcia listingów" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" });

const TABS = [
  { value: "NEW", label: "Nowe" },
  { value: "APPROVED", label: "Zatwierdzone" },
  { value: "REJECTED", label: "Odrzucone" },
] as const;

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("ADMIN", "EDITOR");
  const sp = await searchParams;
  const status =
    typeof sp.status === "string" && TABS.some((t) => t.value === sp.status)
      ? (sp.status as "NEW" | "APPROVED" | "REJECTED")
      : "NEW";

  const claims = await db.courseClaim.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      note: true,
      createdAt: true,
      course: { select: { slug: true, title: true, ownerId: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Przejęcia listingów</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Zgłoszenia twórców/platform o przypisanie własności kursu.
        </p>
      </header>

      <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm w-fit">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/przejecia?status=${t.value}`}
            className={`rounded px-3 py-1 transition-colors ${
              status === t.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {claims.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak zgłoszeń w tej kolejce.
        </div>
      ) : (
        <ul className="space-y-3">
          {claims.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link href={`/kursy/${c.course.slug}`} className="font-medium hover:underline">
                    {c.course.title}
                  </Link>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {c.user.name ?? c.user.email}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{dateFmt.format(c.createdAt)}</span>
                  {c.course.ownerId && (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-400">
                      kurs ma już właściciela
                    </span>
                  )}
                </div>
                {status === "NEW" && <ClaimActions claimId={c.id} />}
              </div>
              {c.note && (
                <p className="rounded border-l-2 border-border bg-muted/40 p-2 text-sm text-foreground/85 whitespace-pre-line">
                  {c.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
