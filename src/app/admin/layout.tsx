import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { logOut } from "@/server/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/kursy", label: "Kursy" },
  { href: "/admin/zgloszenia", label: "Zgłoszenia kursów" },
  { href: "/admin/opinie", label: "Opinie" },
  { href: "/admin/kategorie", label: "Kategorie" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/uzytkownicy", label: "Użytkownicy" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN", "EDITOR");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/admin" className="font-semibold tracking-tight">
            coursed.pl <span className="text-muted-foreground font-normal">— panel</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              ← Strona główna
            </Link>
            <span className="text-muted-foreground">
              {user.name ?? user.email} <span className="text-xs">({user.role})</span>
            </span>
            <form action={logOut}>
              <button
                type="submit"
                className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
              >
                Wyloguj
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl w-full flex-1 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 px-4 py-6">
        <nav className="space-y-1 text-sm">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
