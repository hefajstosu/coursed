import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { ReviewStatusActions, ReportActions, VerifyButton } from "@/components/admin/ReviewActions";
import { kindLabels } from "@/lib/format";

export const metadata: Metadata = { title: "Opinie" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" });

const REVIEW_TABS = [
  { value: "VISIBLE", label: "Widoczne" },
  { value: "HIDDEN", label: "Ukryte" },
  { value: "REMOVED", label: "Usunięte" },
] as const;

const REPORT_TABS = [
  { value: "OPEN", label: "Otwarte" },
  { value: "RESOLVED", label: "Rozwiązane" },
  { value: "REJECTED", label: "Odrzucone" },
] as const;

type Search = Record<string, string | string[] | undefined>;

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" && sp.tab === "reports" ? "reports" : "reviews";
  const status = typeof sp.status === "string" ? sp.status : undefined;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Moderacja opinii</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Statusy opinii i kolejka zgłoszeń.
        </p>
      </header>

      <nav className="flex gap-1 border-b border-border">
        <TabLink href="/admin/opinie" active={tab === "reviews"}>
          Opinie
        </TabLink>
        <TabLink href="/admin/opinie?tab=reports" active={tab === "reports"}>
          Zgłoszenia
        </TabLink>
      </nav>

      {tab === "reviews" ? (
        <ReviewsTab status={status} />
      ) : (
        <ReportsTab status={status} />
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

async function ReviewsTab({ status }: { status?: string }) {
  const validStatus =
    REVIEW_TABS.some((t) => t.value === status) ? (status as "VISIBLE" | "HIDDEN" | "REMOVED") : "VISIBLE";

  const reviews = await db.review.findMany({
    where: { status: validStatus },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true, role: true } },
      course: { select: { slug: true, title: true } },
      _count: { select: { reports: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm w-fit">
        {REVIEW_TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/opinie?status=${t.value}`}
            className={`rounded px-3 py-1 transition-colors ${
              validStatus === t.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak opinii w tej kolejce.
        </div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-foreground">{r.user.name ?? r.user.email}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{kindLabels[r.kind]}</span>
                    <span className="text-muted-foreground">·</span>
                    <Link
                      href={`/kursy/${r.course.slug}`}
                      className="text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {r.course.title}
                    </Link>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{dateFmt.format(r.createdAt)}</span>
                    {r._count.reports > 0 && (
                      <span className="rounded bg-destructive/15 text-destructive px-1.5 py-0.5">
                        zgłoszeń: {r._count.reports}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-line">{r.body}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <ReviewStatusActions reviewId={r.id} current={r.status} />
                  <VerifyButton reviewId={r.id} verified={r.verified} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function ReportsTab({ status }: { status?: string }) {
  const validStatus =
    REPORT_TABS.some((t) => t.value === status) ? (status as "OPEN" | "RESOLVED" | "REJECTED") : "OPEN";

  const reports = await db.report.findMany({
    where: { status: validStatus },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reporter: { select: { name: true, email: true } },
      review: {
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { slug: true, title: true } },
        },
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm w-fit">
        {REPORT_TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/opinie?tab=reports&status=${t.value}`}
            className={`rounded px-3 py-1 transition-colors ${
              validStatus === t.value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak zgłoszeń.
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((rep) => (
            <li key={rep.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span>Zgłosił: <span className="font-medium">{rep.reporter.name ?? rep.reporter.email}</span></span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{dateFmt.format(rep.createdAt)}</span>
                {rep.reason && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span>Powód: <em className="text-foreground/80">{rep.reason}</em></span>
                  </>
                )}
              </div>
              <div className="rounded-md bg-muted/50 p-3 space-y-1">
                <div className="text-xs text-muted-foreground">
                  Opinia · {rep.review.user.name ?? rep.review.user.email} · status{" "}
                  <span className="font-mono">{rep.review.status}</span> ·{" "}
                  <Link
                    href={`/kursy/${rep.review.course.slug}`}
                    className="hover:underline"
                  >
                    {rep.review.course.title}
                  </Link>
                </div>
                <p className="text-sm whitespace-pre-line">{rep.review.body}</p>
              </div>
              <div className="flex justify-between gap-2">
                <ReviewStatusActions
                  reviewId={rep.review.id}
                  current={rep.review.status}
                />
                {validStatus === "OPEN" && <ReportActions reportId={rep.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
