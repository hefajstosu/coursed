import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { CourseRequestActions } from "@/components/admin/CourseRequestActions";

export const metadata: Metadata = { title: "Zgłoszenia kursów" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" });

const TABS = [
  { value: "NEW", label: "Nowe" },
  { value: "ACCEPTED", label: "Zaakceptowane" },
  { value: "REJECTED", label: "Odrzucone" },
] as const;

export default async function CourseRequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const status = (typeof sp.status === "string" ? sp.status : "NEW") as
    | "NEW"
    | "ACCEPTED"
    | "REJECTED";
  const validStatus = TABS.some((t) => t.value === status) ? status : "NEW";

  const requests = await db.courseRequest.findMany({
    where: { status: validStatus },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { createdBy: { select: { email: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Zgłoszenia kursów</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Akceptacja tworzy kurs w wersji roboczej — uzupełnij dane i opublikuj.
        </p>
      </header>

      <div className="flex gap-1 rounded-md border border-border p-0.5 text-sm w-fit">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/zgloszenia?status=${t.value}`}
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

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak zgłoszeń w tej kolejce.
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <h3 className="font-semibold leading-tight">{r.title}</h3>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-muted-foreground hover:text-foreground truncate underline-offset-4 hover:underline"
                    >
                      {r.url} ↗
                    </a>
                  )}
                  {r.note && (
                    <p className="text-sm text-foreground/80 whitespace-pre-line">{r.note}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                    {r.isCreator && (
                      <span className="rounded bg-primary/15 text-primary-foreground px-1.5 py-0.5 dark:text-primary">
                        twórca kursu
                      </span>
                    )}
                    <span>{dateFmt.format(r.createdAt)}</span>
                    {(r.submitterEmail || r.createdBy?.email) && (
                      <span>· {r.submitterEmail ?? r.createdBy?.email}</span>
                    )}
                  </div>
                </div>
                {validStatus === "NEW" && <CourseRequestActions requestId={r.id} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
