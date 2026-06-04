import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { UserRoleSelect } from "@/components/admin/UserRoleSelect";
import { pluralPl } from "@/lib/format";

export const metadata: Metadata = { title: "Użytkownicy" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short" });

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireRole("ADMIN", "EDITOR");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { ratings: true, reviews: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Użytkownicy</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {users.length} {pluralPl(users.length, ["wynik", "wyniki", "wyników"])}
            {q && ` dla „${q}”`}.
          </p>
        </div>
        <form action="/admin/uzytkownicy" className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Szukaj po emailu lub nazwie…"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
          />
          <button
            type="submit"
            className="h-9 rounded-md border border-input px-3 text-sm hover:bg-muted"
          >
            Szukaj
          </button>
        </form>
      </header>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <Th>Użytkownik</Th>
              <Th>Email</Th>
              <Th>Aktywność</Th>
              <Th>Dołączył</Th>
              <Th>Rola</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="bg-card">
                <Td>
                  <div className="font-medium">{u.name ?? <span className="text-muted-foreground">—</span>}</div>
                  {u.id === actor.id && (
                    <div className="text-xs text-muted-foreground">(to Ty)</div>
                  )}
                </Td>
                <Td className="font-mono text-xs">{u.email}</Td>
                <Td className="text-xs text-muted-foreground tabular-nums">
                  {u._count.ratings} ocen · {u._count.reviews} opinii
                </Td>
                <Td className="text-xs text-muted-foreground">
                  {dateFmt.format(u.createdAt)}
                </Td>
                <Td>
                  <UserRoleSelect
                    userId={u.id}
                    initial={u.role}
                    isSelf={u.id === actor.id}
                    isAdmin={actor.role === "ADMIN"}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {actor.role !== "ADMIN" && (
        <p className="text-xs text-muted-foreground">
          Tylko ADMIN może zmieniać role użytkowników.
        </p>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-medium px-4 py-2.5">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-2.5 align-middle ${className ?? ""}`}>{children}</td>;
}
