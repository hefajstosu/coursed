import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { pluralPl } from "@/lib/format";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = { title: "Audit log" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pl-PL", {
  dateStyle: "short",
  timeStyle: "medium",
});

const ENTITIES = [
  "Course",
  "Review",
  "Report",
  "BlogPost",
  "Category",
  "User",
  "CourseRequest",
] as const;

const ACTIONS = [
  "course.create",
  "course.update",
  "course.delete",
  "course.merge",
  "review.visible",
  "review.hidden",
  "review.removed",
  "report.resolved",
  "report.rejected",
  "blog.create",
  "blog.update",
  "blog.delete",
  "category.create",
  "category.update",
  "category.delete",
  "user.set_role",
  "course_request.accept",
  "course_request.reject",
] as const;

const PAGE_SIZE = 50;

type Search = Record<string, string | string[] | undefined>;

function getStr(sp: Search, key: string): string | undefined {
  const v = sp[key];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  await requireRole("ADMIN", "EDITOR");
  const sp = await searchParams;
  const entity = getStr(sp, "entity");
  const action = getStr(sp, "action");
  const actor = getStr(sp, "actor");
  const entityId = getStr(sp, "entityId");
  const pageRaw = getStr(sp, "page");
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);

  const where: Prisma.AuditLogWhereInput = {
    ...(entity && (ENTITIES as readonly string[]).includes(entity)
      ? { entity }
      : {}),
    ...(action && (ACTIONS as readonly string[]).includes(action)
      ? { action }
      : {}),
    ...(entityId ? { entityId } : {}),
    ...(actor
      ? {
          actor: {
            OR: [
              { email: { contains: actor, mode: "insensitive" } },
              { name: { contains: actor, mode: "insensitive" } },
            ],
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    db.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { entity, action, actor, entityId, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v.length > 0) params.set(k, v);
    }
    const s = params.toString();
    return s ? `/admin/audyt?${s}` : "/admin/audyt";
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total.toLocaleString("pl-PL")}{" "}
          {pluralPl(total, ["wpis", "wpisy", "wpisów"])}
          {(entity || action || actor || entityId) && " (filtrowane)"}.
        </p>
      </header>

      <form
        action="/admin/audyt"
        className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <Field label="Encja">
          <select
            name="entity"
            defaultValue={entity ?? ""}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="">— wszystkie —</option>
            {ENTITIES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Akcja">
          <select
            name="action"
            defaultValue={action ?? ""}
            className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm font-mono text-xs"
          >
            <option value="">— wszystkie —</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Aktor (email/nazwa)">
          <input
            name="actor"
            defaultValue={actor ?? ""}
            placeholder="np. tomasz@…"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          />
        </Field>

        <Field label="ID encji">
          <input
            name="entityId"
            defaultValue={entityId ?? ""}
            placeholder="cuid…"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 font-mono text-xs"
          />
        </Field>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-9 rounded-md bg-foreground px-4 text-sm text-background hover:opacity-90"
          >
            Filtruj
          </button>
          {(entity || action || actor || entityId) && (
            <Link
              href="/admin/audyt"
              className="h-9 inline-flex items-center rounded-md border border-input px-3 text-sm hover:bg-muted"
            >
              Wyczyść
            </Link>
          )}
        </div>
      </form>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak zdarzeń pasujących do filtrów.
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <Th>Data</Th>
                <Th>Aktor</Th>
                <Th>Akcja</Th>
                <Th>Encja</Th>
                <Th>Diff</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => (
                <tr key={l.id} className="bg-card align-top">
                  <Td className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                    {dateFmt.format(l.createdAt)}
                  </Td>
                  <Td className="text-xs">
                    <div className="font-medium">
                      {l.actor.name ?? l.actor.email}
                    </div>
                    {l.actor.name && (
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {l.actor.email}
                      </div>
                    )}
                  </Td>
                  <Td>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                      {l.action}
                    </span>
                  </Td>
                  <Td className="font-mono text-[11px]">
                    <div className="text-muted-foreground">{l.entity}</div>
                    <EntityLink entity={l.entity} entityId={l.entityId} />
                  </Td>
                  <Td>
                    <DiffCell diff={l.diff} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Strona {page} z {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
              >
                ← Poprzednia
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="rounded-md border border-border px-3 py-1.5 hover:bg-muted"
              >
                Następna →
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium px-3 py-2">{children}</th>;
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2.5 ${className ?? ""}`}>{children}</td>;
}

function EntityLink({
  entity,
  entityId,
}: {
  entity: string;
  entityId: string;
}) {
  const href = entityHref(entity, entityId);
  const short = `${entityId.slice(0, 10)}…`;
  if (!href) return <span className="text-foreground">{short}</span>;
  return (
    <Link href={href} className="text-foreground hover:underline">
      {short}
    </Link>
  );
}

function entityHref(entity: string, id: string): string | null {
  switch (entity) {
    case "Course":
      return `/admin/kursy/${id}`;
    case "BlogPost":
      return `/admin/blog/${id}`;
    case "Review":
    case "Report":
      return "/admin/opinie";
    case "CourseRequest":
      return "/admin/zgloszenia";
    case "User":
      return "/admin/uzytkownicy";
    case "Category":
      return "/admin/kategorie";
    default:
      return null;
  }
}

function DiffCell({ diff }: { diff: unknown }) {
  if (diff === null || diff === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  const json = JSON.stringify(diff, null, 2);
  if (json.length > 120) {
    return (
      <details className="max-w-md">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          {json.slice(0, 80)}…
        </summary>
        <pre className="mt-1 max-h-60 overflow-auto rounded border border-border bg-muted/40 p-2 text-[11px] leading-relaxed whitespace-pre-wrap break-all">
          {json}
        </pre>
      </details>
    );
  }
  return (
    <code className="text-[11px] text-foreground/80 break-all">{json}</code>
  );
}
