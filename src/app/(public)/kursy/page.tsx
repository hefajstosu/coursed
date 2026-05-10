import type { Metadata } from "next";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseFilters } from "@/components/filters/CourseFilters";
import { Pagination } from "@/components/site/Pagination";
import {
  listCourses,
  searchCourses,
  type CourseListFilters,
  type CourseSort,
} from "@/server/queries/courses";
import { getTopLevelCategories } from "@/server/queries/categories";
import { formatLabels, levelLabels, languageLabels } from "@/lib/format";

export const metadata: Metadata = {
  title: "Wszystkie kursy",
  description:
    "Pełny katalog kursów na coursed.pl — filtruj po kategorii, formacie, języku i poziomie zaawansowania.",
  alternates: { canonical: "/kursy" },
};

const SORT_OPTIONS: { value: CourseSort; label: string }[] = [
  { value: "newest", label: "Najnowsze" },
  { value: "top-rated", label: "Najwyżej oceniane" },
  { value: "popular", label: "Najpopularniejsze" },
];

const FORMATS = Object.entries(formatLabels).map(([value, label]) => ({ value, label }));
const LEVELS = Object.entries(levelLabels).map(([value, label]) => ({ value, label }));
const LANGUAGES = Object.entries(languageLabels).map(([value, label]) => ({ value, label }));

function parseSort(raw: string | undefined): CourseSort {
  if (raw === "top-rated" || raw === "popular" || raw === "newest") return raw;
  return "newest";
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);

  const filters: CourseListFilters = {
    categorySlug: get("category"),
    format: get("format") as CourseListFilters["format"],
    language: get("language"),
    level: get("level") as CourseListFilters["level"],
  };
  const sort = parseSort(get("sort"));
  const page = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);
  const q = (get("q") ?? "").trim();

  const [listing, topCategories] = await Promise.all([
    q ? searchCourses(q, filters, page) : listCourses(filters, sort, page),
    getTopLevelCategories(),
  ]);
  const { courses, total, perPage } = listing;

  const categoryOptions = topCategories.flatMap((c) => [
    { value: c.slug, label: c.name },
    ...c.children.map((ch) => ({ value: ch.slug, label: `– ${ch.name}` })),
  ]);

  const flatSearchParams: Record<string, string | undefined> = {
    category: filters.categorySlug,
    format: filters.format,
    language: filters.language,
    level: filters.level,
    sort: sort === "newest" ? undefined : sort,
    q: q || undefined,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {q ? `Wyniki dla „${q}"` : "Wszystkie kursy"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "kurs" : total >= 2 && total <= 4 ? "kursy" : "kursów"}
          {q ? ` pasuje do wyszukiwania.` : ` w katalogu.`}
        </p>
      </header>

      <CourseFilters
        categories={categoryOptions}
        formats={FORMATS}
        languages={LANGUAGES}
        levels={LEVELS}
        sorts={SORT_OPTIONS}
      />

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak kursów spełniających wybrane kryteria.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        total={total}
        perPage={perPage}
        basePath="/kursy"
        searchParams={flatSearchParams}
      />
    </div>
  );
}
