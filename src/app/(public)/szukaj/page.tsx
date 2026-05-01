import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { searchCourses, parseCachedRatings } from "@/server/queries/courses";
import { SearchHighlight } from "@/components/course/SearchHighlight";
import { RatingBadge } from "@/components/course/RatingBadge";
import { Pagination } from "@/components/site/Pagination";
import { formatLabels, levelLabels, languageLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Wyszukiwanie",
  description: "Wyszukaj kursy w katalogu coursed.pl.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const q = (get("q") ?? "").trim();
  const page = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);

  if (!q) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Wyszukiwarka</h1>
        <form action="/szukaj" className="flex gap-2">
          <input
            type="search"
            name="q"
            placeholder="Szukaj kursów…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Szukaj
          </button>
        </form>
        <p className="text-sm text-muted-foreground">
          Wpisz frazę, żeby przeszukać katalog kursów.
        </p>
      </div>
    );
  }

  const { courses, total, perPage, snippets } = await searchCourses(q, {}, page);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Wyniki wyszukiwania</h1>
        <form action="/szukaj" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Szukaj kursów…"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
          >
            Szukaj
          </button>
        </form>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? `Brak wyników dla „${q}".`
            : `${total} ${total === 1 ? "wynik" : total >= 2 && total <= 4 ? "wyniki" : "wyników"} dla „${q}".`}
        </p>
      </header>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Spróbuj innej frazy lub przejdź do{" "}
          <Link href="/kursy" className="underline hover:text-foreground">
            pełnego katalogu
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {courses.map((c) => {
            const ratings = parseCachedRatings(c.cachedRatings);
            const snippet = snippets.get(c.id) ?? "";
            return (
              <li key={c.id}>
                <Link
                  href={`/kursy/${c.slug}`}
                  className="group flex gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:border-foreground/20"
                >
                  <div className="relative aspect-[16/9] w-32 shrink-0 overflow-hidden rounded-md bg-muted sm:w-40">
                    {c.coverUrl ? (
                      <Image
                        src={c.coverUrl}
                        alt=""
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground/40">
                        {c.title.charAt(0)}
                      </div>
                    )}
                    <div className="absolute right-1 top-1">
                      <RatingBadge ratings={ratings} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {c.categories.map((cat) => (
                        <span key={cat.category.slug} className="rounded bg-muted px-1.5 py-0.5">
                          {cat.category.name}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-semibold leading-tight group-hover:text-foreground">
                      {c.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      <SearchHighlight snippet={snippet} fallback={c.shortDescription} />
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs text-muted-foreground">
                      <span>{formatLabels[c.format]}</span>
                      {c.level && <span>· {levelLabels[c.level]}</span>}
                      {c.language && <span>· {languageLabel(c.language)}</span>}
                      {c.priceModel && <span>· {c.priceModel}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        basePath="/szukaj"
        searchParams={{ q }}
      />
    </div>
  );
}
