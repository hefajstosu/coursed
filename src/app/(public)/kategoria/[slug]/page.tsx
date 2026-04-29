import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/course/CourseCard";
import { Pagination } from "@/components/site/Pagination";
import { getCategoryBySlug } from "@/server/queries/categories";
import { listCourses } from "@/server/queries/courses";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Kategoria" };
  return {
    title: `Kursy: ${category.name}`,
    description:
      category.description ??
      `Najlepsze kursy w kategorii ${category.name} na coursed.pl — opinie, oceny, porównania.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);
  const categorySlugs = [category.slug, ...category.children.map((c) => c.slug)];
  const { courses, total, perPage } = await listCourses({ categorySlugs }, "top-rated", page);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        {category.parent && (
          <nav className="text-sm text-muted-foreground">
            <Link href={`/kategoria/${category.parent.slug}`} className="hover:text-foreground">
              {category.parent.name}
            </Link>
            <span className="mx-2">/</span>
            <span>{category.name}</span>
          </nav>
        )}
        <h1 className="text-3xl font-semibold tracking-tight">
          Kursy: {category.name}
        </h1>
        {category.description && (
          <p className="text-muted-foreground max-w-2xl">{category.description}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "kurs" : total >= 2 && total <= 4 ? "kursy" : "kursów"} w tej kategorii.
        </p>
      </header>

      {category.children.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Podkategorie
          </h2>
          <ul className="flex flex-wrap gap-2">
            {category.children.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kategoria/${c.slug}`}
                  className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm hover:border-foreground/40"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {courses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          Brak kursów w tej kategorii.
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
        basePath={`/kategoria/${slug}`}
        searchParams={{}}
      />
    </div>
  );
}
