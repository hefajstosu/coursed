import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    coursesPublished,
    coursesDraft,
    pendingRequests,
    openReports,
    hiddenReviews,
    blogDrafts,
    blogPublished,
    users,
    critics,
  ] = await Promise.all([
    db.course.count({ where: { status: "PUBLISHED" } }),
    db.course.count({ where: { status: "DRAFT" } }),
    db.courseRequest.count({ where: { status: "NEW" } }),
    db.report.count({ where: { status: "OPEN" } }),
    db.review.count({ where: { status: "HIDDEN" } }),
    db.blogPost.count({ where: { status: "DRAFT" } }),
    db.blogPost.count({ where: { status: "PUBLISHED" } }),
    db.user.count(),
    db.user.count({ where: { role: "CRITIC" } }),
  ]);

  const recentAudit = await db.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true, email: true } } },
  });

  const dateFmt = new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stan katalogu i kolejek moderacji.
        </p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <Stat label="Kursy opublikowane" value={coursesPublished} href="/admin/kursy?status=PUBLISHED" />
        <Stat label="Kursy w wersji roboczej" value={coursesDraft} href="/admin/kursy?status=DRAFT" highlight={coursesDraft > 0} />
        <Stat label="Nowe zgłoszenia" value={pendingRequests} href="/admin/zgloszenia" highlight={pendingRequests > 0} />
        <Stat label="Otwarte zgłoszenia opinii" value={openReports} href="/admin/opinie?tab=reports" highlight={openReports > 0} />
        <Stat label="Ukryte opinie" value={hiddenReviews} href="/admin/opinie?status=HIDDEN" />
        <Stat label="Wpisy bloga (draft)" value={blogDrafts} href="/admin/blog?status=DRAFT" />
        <Stat label="Wpisy bloga (publ.)" value={blogPublished} href="/admin/blog?status=PUBLISHED" />
        <Stat label="Użytkownicy / krytycy" value={`${users} / ${critics}`} href="/admin/uzytkownicy" />
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">Ostatnia aktywność</h2>
        {recentAudit.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            Brak zapisanych zdarzeń.
          </p>
        ) : (
          <ul className="rounded-lg border border-border divide-y divide-border bg-card">
            {recentAudit.map((a) => (
              <li key={a.id} className="px-4 py-2.5 text-sm flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="font-mono text-xs text-muted-foreground">{a.action}</span>{" "}
                  <span className="text-muted-foreground">{a.entity}</span>{" "}
                  <span className="font-mono text-xs">{a.entityId.slice(0, 8)}…</span>
                </div>
                <div className="text-xs text-muted-foreground shrink-0">
                  {a.actor.name ?? a.actor.email} · {dateFmt.format(a.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number | string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
        highlight ? "border-primary/60 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
    </Link>
  );
}
