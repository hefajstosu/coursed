import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseCard } from "@/components/course/CourseCard";
import { Pagination } from "@/components/site/Pagination";
import { getCategoryBySlug } from "@/server/queries/categories";
import { listCourses } from "@/server/queries/courses";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";

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
    alternates: { canonical: `/kategoria/${category.slug}` },
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

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Strona główna", path: "/" },
    { name: "Kategorie", path: "/kategorie" },
    ...(category.parent
      ? [{ name: category.parent.name, path: `/kategoria/${category.parent.slug}` }]
      : []),
    { name: category.name },
  ]);

  const topCourse = courses[0];
  const childList =
    category.children.length > 0
      ? category.children.map((c) => c.name).join(", ")
      : null;
  const faqs: { question: string; answer: string }[] = [
    {
      question: `Ile kursów ${category.name.toLowerCase()} znajdę na coursed.pl?`,
      answer:
        total === 0
          ? `Aktualnie nie mamy w katalogu kursów w kategorii ${category.name}. Pracujemy nad rozszerzeniem oferty — zajrzyj wkrótce.`
          : `W kategorii ${category.name} dostępnych jest ${total} ${total === 1 ? "kurs" : total >= 2 && total <= 4 ? "kursy" : "kursów"} z opiniami i ocenami od użytkowników i krytyków.`,
    },
    {
      question: `Jak wybrać dobry kurs ${category.name.toLowerCase()}?`,
      answer:
        `Sprawdź ocenę ogólną kursu (średnia 50/50 ocen użytkowników i krytyków, skala 1–10), ` +
        `przeczytaj opinie zawierające konkrety o programie i prowadzącym, zwróć uwagę na poziom (początkujący/średnio zaawansowany/zaawansowany) oraz format zajęć (online, offline, hybryda). ` +
        `Wszystkie kursy w katalogu coursed.pl mają wyraźnie oznaczone opinie zweryfikowanych krytyków.`,
    },
    ...(topCourse
      ? [
          {
            question: `Który kurs ${category.name.toLowerCase()} ma najlepsze oceny?`,
            answer:
              `Aktualnie najwyżej oceniany w tej kategorii jest „${topCourse.title}". ` +
              `Pełna lista — posortowana wg oceny — znajduje się poniżej; oceny aktualizujemy automatycznie po każdej nowej opinii.`,
          },
        ]
      : []),
    ...(childList
      ? [
          {
            question: `Jakie są podkategorie w ramach „${category.name}"?`,
            answer: `W ramach ${category.name} wyodrębniliśmy: ${childList}. Każda podkategoria ma własną listę kursów z dedykowanymi opiniami.`,
          },
        ]
      : []),
    {
      question: "Czy opinie pochodzą od prawdziwych uczestników?",
      answer:
        "Tak. Każda opinia pochodzi z konta zarejestrowanego użytkownika lub zweryfikowanego krytyka. " +
        "Opinie naruszające zasady są moderowane lub usuwane — szczegóły opisaliśmy na stronie /zasady.",
    },
  ];
  const faq = faqJsonLd(faqs);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
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

      <section className="space-y-3 border-t border-border pt-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Najczęstsze pytania
        </h2>
        <div className="divide-y divide-border rounded-lg border border-border">
          {faqs.map((f) => (
            <details key={f.question} className="group p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium marker:hidden [&::-webkit-details-marker]:hidden">
                <span>{f.question}</span>
                <span className="text-muted-foreground transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {f.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
