import type { Metadata } from "next";
import Link from "next/link";
import { getCategoriesTree } from "@/server/queries/categories";
import { pluralPl } from "@/lib/format";

export const metadata: Metadata = {
  title: "Kategorie kursów",
  description:
    "Przeglądaj wszystkie kategorie kursów w serwisie coursed.pl — od programowania po marketing i rozwój osobisty.",
  alternates: { canonical: "/kategorie" },
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const tree = await getCategoriesTree();

  const total = tree.reduce((sum, c) => sum + c.totalCourses, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Kategorie</h1>
        <p className="text-muted-foreground">
          {tree.length} {pluralPl(tree.length, ["kategoria", "kategorie", "kategorii"])}
          {" · "}
          {total} {pluralPl(total, ["kurs", "kursy", "kursów"])} łącznie.
        </p>
      </header>

      {tree.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak kategorii.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((c) => (
            <article
              key={c.id}
              className="relative rounded-lg border border-border bg-card p-5 space-y-3 transition-colors hover:border-foreground/40 focus-within:border-foreground/40"
            >
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  <Link
                    href={`/kategoria/${c.slug}`}
                    className="before:absolute before:inset-0 before:content-[''] focus:outline-none"
                  >
                    {c.name}
                  </Link>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {c.totalCourses} {pluralPl(c.totalCourses, ["kurs", "kursy", "kursów"])}
                </p>
              </div>
              {c.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              )}
              {c.children.length > 0 && (
                <ul className="relative flex flex-wrap gap-1.5 pt-1">
                  {c.children.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/kategoria/${sub.slug}`}
                        className="relative inline-flex items-center rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      >
                        {sub.name}
                        {sub.totalCourses > 0 && (
                          <span className="ml-1.5 text-[10px] tabular-nums opacity-70">
                            {sub.totalCourses}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
